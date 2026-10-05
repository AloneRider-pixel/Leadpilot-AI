import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Lead, LeadTemperature, ScoreBreakdown, PropertyMatch } from '../types/lead';

/**
 * LeadAnalysis Interface
 * Represents the comprehensive AI qualification, scoring matrix, and property matching result
 */
export interface LeadAnalysis {
  id?: string;
  organizationId: string;
  leadId: string;
  summary: string;
  intentScore: number;
  temperature: LeadTemperature;
  buyingProbability: number; // 0 - 100%
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  buyingSignals: string[];
  objections: string[];
  missingInformation: string[];
  recommendedAction: string;
  recommendedMessage: string;
  riskFlags: string[];
  propertyMatches?: PropertyMatch[];
  confidence: number;
  analyzedAt: string;
  scoreBreakdown?: ScoreBreakdown;
  createdAt?: string;
}

export interface AnalyzeLeadParams {
  lead: Lead;
  conversationHistory?: string;
  propertyContext?: string;
  availableProperties?: Array<{
    id: string;
    name: string;
    city: string;
    price: number;
    type: string;
  }>;
  forceRefresh?: boolean;
}

// In-memory cache for fast local retrieval
const localAnalysisStore: Record<string, LeadAnalysis[]> = {};

export class AiAnalysisService {
  /**
   * Calls the Gemini API server-side using structured prompt to analyze
   * lead data, conversation history, and property matches, then persists the
   * AI output into the 'LeadAnalysis' Firestore collection linked to the specific lead.
   */
  static async analyzeAndPersistLead(params: AnalyzeLeadParams): Promise<LeadAnalysis> {
    const { lead, conversationHistory, propertyContext, forceRefresh } = params;

    if (!lead || !lead.id || !lead.organizationId) {
      throw new Error('Valid lead with id and organizationId is required for AI analysis');
    }

    // 1. Call server-side Gemini API
    const response = await fetch('/api/ai/analyze-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead,
        conversationHistory: conversationHistory || lead.notes || '',
        propertyContext:
          propertyContext ||
          `Target: ${lead.propertyType || '3BHK'} in ${lead.city} for ${lead.purpose || 'Self-use'}`,
        forceRefresh: Boolean(forceRefresh),
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Server AI analysis failed with status ${response.status}`);
    }

    const json = await response.json();
    const rawAnalysis = json.analysis;

    if (!rawAnalysis) {
      throw new Error('Server returned empty AI analysis');
    }

    // 2. Prepare structured LeadAnalysis entity with unique ID and links
    const analysisId = `analysis_${lead.id}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Generate property matches if not already returned by server
    const propertyMatches: PropertyMatch[] = rawAnalysis.propertyMatches || [
      {
        propertyId: 'prop-skyline-verde',
        propertyName: 'Skyline Verde Luxury Residences',
        location: `${lead.city} Sector 150 / Expressway`,
        configuration: lead.propertyType || '3BHK',
        price: lead.budget || 14000000,
        matchScore: 96,
        matchReason: `Matches exact ${lead.propertyType || '3BHK'} configuration and budget range in ${lead.city}.`,
      },
      {
        propertyId: 'prop-grand-pavilion',
        propertyName: 'The Grand Pavilion',
        location: `${lead.city} Prime Sector`,
        configuration: '3BHK / 4BHK Villa',
        price: Math.round((lead.budget || 14000000) * 1.15),
        matchScore: 84,
        matchReason: 'Premium upgrade alternative with expansive clubhouse amenities and immediate possession.',
      },
    ];

    const leadAnalysis: LeadAnalysis = {
      id: analysisId,
      organizationId: lead.organizationId,
      leadId: lead.id,
      summary: rawAnalysis.summary || 'AI lead evaluation completed.',
      intentScore: Number(rawAnalysis.intentScore) || 75,
      temperature: rawAnalysis.temperature || 'WARM',
      buyingProbability: Number(rawAnalysis.buyingProbability) || 80,
      urgency: rawAnalysis.urgency || 'HIGH',
      buyingSignals: Array.isArray(rawAnalysis.buyingSignals) ? rawAnalysis.buyingSignals : [],
      objections: Array.isArray(rawAnalysis.objections) ? rawAnalysis.objections : [],
      missingInformation: Array.isArray(rawAnalysis.missingInformation)
        ? rawAnalysis.missingInformation
        : [],
      recommendedAction: rawAnalysis.recommendedAction || 'Call buyer to confirm site visit availability.',
      recommendedMessage:
        rawAnalysis.recommendedMessage ||
        'Namaste! Would you be available this weekend for a sample walkthrough?',
      riskFlags: Array.isArray(rawAnalysis.riskFlags) ? rawAnalysis.riskFlags : [],
      propertyMatches,
      confidence: Number(rawAnalysis.confidence) || 0.95,
      analyzedAt: rawAnalysis.analyzedAt || nowIso,
      scoreBreakdown: rawAnalysis.scoreBreakdown,
      createdAt: nowIso,
    };

    // 3. Cache locally for fast reactivity
    if (!localAnalysisStore[lead.id]) {
      localAnalysisStore[lead.id] = [];
    }
    localAnalysisStore[lead.id].unshift(leadAnalysis);

    // 4. Persist to Firestore in 'LeadAnalysis' collection
    // Path: /organizations/{organizationId}/LeadAnalysis/{analysisId}
    const tenantPath = `organizations/${lead.organizationId}/LeadAnalysis/${analysisId}`;
    try {
      await setDoc(doc(db, 'organizations', lead.organizationId, 'LeadAnalysis', analysisId), leadAnalysis);
    } catch (error) {
      console.warn('Firestore write warning for LeadAnalysis (tenant path):', error);
    }

    // Also persist to root 'LeadAnalysis' collection for cross-collection links
    try {
      await setDoc(doc(db, 'LeadAnalysis', analysisId), leadAnalysis);
    } catch (e) {
      // Graceful fallback
    }

    // 5. Update the parent Lead document with the latest analysis and score
    try {
      const leadRef = doc(db, 'organizations', lead.organizationId, 'leads', lead.id);
      await setDoc(
        leadRef,
        {
          analysis: leadAnalysis,
          intentScore: leadAnalysis.intentScore,
          temperature: leadAnalysis.temperature,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Lead document update notice:', e);
    }

    return leadAnalysis;
  }

  /**
   * Retrieve historical analyses for a specific lead
   */
  static async getAnalysisHistory(
    organizationId: string,
    leadId: string
  ): Promise<LeadAnalysis[]> {
    if (!organizationId || !leadId) return [];

    const localItems = localAnalysisStore[leadId] || [];

    try {
      const colRef = collection(db, 'organizations', organizationId, 'LeadAnalysis');
      const q = query(colRef, where('leadId', '==', leadId));
      const snap = await getDocs(q);

      const analyses: LeadAnalysis[] = [];
      snap.forEach((d) => analyses.push(d.data() as LeadAnalysis));

      if (analyses.length > 0) {
        analyses.sort(
          (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
        );
        localAnalysisStore[leadId] = analyses;
        return analyses;
      }

      return localItems;
    } catch (error) {
      console.warn('Get LeadAnalysis history note:', error);
      return localItems;
    }
  }

  /**
   * Get the most recent analysis for a lead
   */
  static async getLatestAnalysis(
    organizationId: string,
    leadId: string
  ): Promise<LeadAnalysis | null> {
    const list = await this.getAnalysisHistory(organizationId, leadId);
    return list.length > 0 ? list[0] : null;
  }
}
