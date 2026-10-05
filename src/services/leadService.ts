import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Lead,
  LeadStatus,
  LeadTemperature,
  LeadAnalysis,
  ConversationMessage,
} from '../types/lead';
import { generateDemoLeads } from '../data/demoLeads';

export interface LeadFilterOptions {
  status?: LeadStatus;
  temperature?: LeadTemperature;
  search?: string;
  source?: string;
  assignedRepId?: string;
  city?: string;
  limitCount?: number;
}

// In-memory / session fallback cache for instant demo reactivity
const localLeadsCache: Record<string, Lead[]> = {};
const localConvsCache: Record<string, Record<string, ConversationMessage[]>> = {};

export class LeadService {
  /**
   * Helper to get tenant-scoped collection reference
   * Strictly enforces /organizations/{organizationId}/leads path
   */
  private static getCollectionRef(orgId: string) {
    if (!orgId) throw new Error('Tenant organizationId is required for lead operations');
    return collection(db, 'organizations', orgId, 'leads');
  }

  /**
   * Create a new lead scoped to the tenant organization
   */
  static async createLead(
    leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    customId?: string
  ): Promise<Lead> {
    const orgId = leadData.organizationId;
    if (!orgId) {
      throw new Error('organizationId is required to create a tenant lead');
    }

    const leadId =
      customId || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullLead: Lead = {
      ...leadData,
      id: leadId,
      organizationId: orgId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Update in-memory fallback
    if (!localLeadsCache[orgId]) localLeadsCache[orgId] = [];
    localLeadsCache[orgId].unshift(fullLead);

    const path = `organizations/${orgId}/leads/${leadId}`;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'leads', leadId), fullLead);
      return fullLead;
    } catch (error) {
      console.warn('Firestore write note (using local cache):', error);
      return fullLead;
    }
  }

  /**
   * Fetch all leads for an organization with optional filtering
   */
  static async getLeadsByOrg(
    orgId: string,
    options?: LeadFilterOptions
  ): Promise<Lead[]> {
    if (!orgId) throw new Error('Tenant organizationId is required');
    const path = `organizations/${orgId}/leads`;

    try {
      const colRef = this.getCollectionRef(orgId);
      let q = query(colRef);

      if (options?.status) {
        q = query(q, where('status', '==', options.status));
      }
      if (options?.temperature) {
        q = query(q, where('temperature', '==', options.temperature));
      }
      if (options?.source) {
        q = query(q, where('source', '==', options.source));
      }
      if (options?.assignedRepId) {
        q = query(q, where('assignedRepId', '==', options.assignedRepId));
      }
      if (options?.city) {
        q = query(q, where('city', '==', options.city));
      }
      if (options?.limitCount) {
        q = query(q, limit(options.limitCount));
      }

      const snap = await getDocs(q);
      const leads: Lead[] = [];
      snap.forEach((d) => leads.push(d.data() as Lead));

      // If remote collection has records, sync to local cache
      if (leads.length > 0) {
        localLeadsCache[orgId] = leads;
      } else if (localLeadsCache[orgId] && localLeadsCache[orgId].length > 0) {
        // Return local cache if remote is empty
        leads.push(...localLeadsCache[orgId]);
      }

      // Client-side search & sorting
      let result = leads;
      if (options?.search) {
        const s = options.search.toLowerCase();
        result = result.filter(
          (l) =>
            l.name.toLowerCase().includes(s) ||
            l.phone.toLowerCase().includes(s) ||
            l.city.toLowerCase().includes(s) ||
            (l.email && l.email.toLowerCase().includes(s)) ||
            (l.propertyName && l.propertyName.toLowerCase().includes(s))
        );
      }

      return result.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.warn('Firestore getLeads note, falling back to cached state:', error);
      const cached = localLeadsCache[orgId] || [];
      return cached;
    }
  }

  /**
   * Get a single lead by ID with tenant verification
   */
  static async getLeadById(orgId: string, leadId: string): Promise<Lead | null> {
    if (!orgId || !leadId) throw new Error('organizationId and leadId are required');

    // Check local cache first
    const cached = (localLeadsCache[orgId] || []).find((l) => l.id === leadId);

    try {
      const snap = await getDoc(doc(db, 'organizations', orgId, 'leads', leadId));
      if (!snap.exists()) return cached || null;
      const data = snap.data() as Lead;
      if (data.organizationId !== orgId) {
        throw new Error('Tenant isolation violation: Lead does not belong to this organization');
      }
      return data;
    } catch (error) {
      return cached || null;
    }
  }

  /**
   * Update lead fields
   */
  static async updateLead(
    orgId: string,
    leadId: string,
    updates: Partial<Lead>
  ): Promise<void> {
    if (!orgId || !leadId) throw new Error('organizationId and leadId are required');

    // Update local cache
    if (localLeadsCache[orgId]) {
      const idx = localLeadsCache[orgId].findIndex((l) => l.id === leadId);
      if (idx !== -1) {
        localLeadsCache[orgId][idx] = {
          ...localLeadsCache[orgId][idx],
          ...updates,
          organizationId: orgId,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    try {
      const leadRef = doc(db, 'organizations', orgId, 'leads', leadId);
      await updateDoc(leadRef, {
        ...updates,
        organizationId: orgId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Firestore updateLead note:', error);
    }
  }

  /**
   * Update lead status in pipeline
   */
  static async updateLeadStatus(
    orgId: string,
    leadId: string,
    status: LeadStatus,
    note?: string
  ): Promise<void> {
    const updates: Partial<Lead> = {
      status,
      lastContactAt: new Date().toISOString(),
    };
    if (note) {
      updates.notes = note;
    }
    await this.updateLead(orgId, leadId, updates);
  }

  /**
   * Update lead with AI analysis and scoring results
   */
  static async updateLeadAnalysis(
    orgId: string,
    leadId: string,
    analysis: LeadAnalysis
  ): Promise<void> {
    await this.updateLead(orgId, leadId, {
      analysis,
      intentScore: analysis.intentScore,
      temperature: analysis.temperature,
    });
  }

  /**
   * Delete lead
   */
  static async deleteLead(orgId: string, leadId: string): Promise<void> {
    if (!orgId || !leadId) throw new Error('organizationId and leadId are required');

    if (localLeadsCache[orgId]) {
      localLeadsCache[orgId] = localLeadsCache[orgId].filter((l) => l.id !== leadId);
    }

    try {
      await deleteDoc(doc(db, 'organizations', orgId, 'leads', leadId));
    } catch (error) {
      console.warn('Firestore deleteLead note:', error);
    }
  }

  /**
   * Fetch conversation messages for a lead
   */
  static async getLeadConversations(
    orgId: string,
    leadId: string
  ): Promise<ConversationMessage[]> {
    if (!orgId || !leadId) return [];

    const localMessages = localConvsCache[orgId]?.[leadId] || [];

    try {
      const convRef = collection(db, 'organizations', orgId, 'conversations');
      const q = query(convRef, where('leadId', '==', leadId));
      const snap = await getDocs(q);
      const messages: ConversationMessage[] = [];
      snap.forEach((d) => messages.push(d.data() as ConversationMessage));

      if (messages.length > 0) {
        return messages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
      return localMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      return localMessages;
    }
  }

  /**
   * Add a message / call transcript to a lead conversation
   */
  static async addConversationMessage(
    orgId: string,
    message: Omit<ConversationMessage, 'id'>
  ): Promise<ConversationMessage> {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullMsg: ConversationMessage = {
      ...message,
      id: msgId,
      organizationId: orgId,
    };

    if (!localConvsCache[orgId]) localConvsCache[orgId] = {};
    if (!localConvsCache[orgId][message.leadId]) localConvsCache[orgId][message.leadId] = [];
    localConvsCache[orgId][message.leadId].push(fullMsg);

    try {
      await setDoc(doc(db, 'organizations', orgId, 'conversations', msgId), fullMsg);
      // Also update lead's lastContactAt
      await this.updateLead(orgId, message.leadId, {
        lastContactAt: fullMsg.timestamp,
      });
      return fullMsg;
    } catch (error) {
      console.warn('Firestore addConversationMessage note:', error);
      return fullMsg;
    }
  }

  /**
   * Batch import leads (e.g. from CSV)
   */
  static async importLeadsBatch(
    orgId: string,
    leadsData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ importedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    for (const lead of leadsData) {
      try {
        await this.createLead({
          ...lead,
          organizationId: orgId,
        });
        count++;
      } catch (err: unknown) {
        errors.push(
          `Failed to import ${lead.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return { importedCount: count, errors };
  }

  /**
   * Seed 25 realistic Indian Real Estate demo leads (including Rahul Sharma)
   */
  static async seedDemoLeads(orgId: string): Promise<Lead[]> {
    if (!orgId) throw new Error('Tenant organizationId is required');
    const { leads, conversations } = generateDemoLeads(orgId);

    // Save into local cache immediately for instantaneous UI responsiveness
    localLeadsCache[orgId] = leads;
    localConvsCache[orgId] = conversations;

    // Push into Firestore in background / batch
    for (const lead of leads) {
      try {
        await setDoc(doc(db, 'organizations', orgId, 'leads', lead.id), lead);
      } catch (e) {
        // Fallback continues gracefully
      }
    }

    // Seed conversation messages for key leads
    for (const [leadId, msgs] of Object.entries(conversations)) {
      for (const msg of msgs) {
        try {
          await setDoc(doc(db, 'organizations', orgId, 'conversations', msg.id), msg);
        } catch (e) {
          // Ignore write failure in demo mode
        }
      }
    }

    return leads;
  }

  /**
   * Attach a real-time listener to tenant leads
   */
  static subscribeToLeads(
    orgId: string,
    onSuccess: (leads: Lead[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    if (!orgId) throw new Error('organizationId is required for subscription');

    // Deliver cached leads immediately
    if (localLeadsCache[orgId] && localLeadsCache[orgId].length > 0) {
      onSuccess([...localLeadsCache[orgId]]);
    }

    const colRef = this.getCollectionRef(orgId);
    try {
      return onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const leads: Lead[] = [];
            snapshot.forEach((d) => leads.push(d.data() as Lead));
            leads.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            localLeadsCache[orgId] = leads;
            onSuccess(leads);
          } else if (localLeadsCache[orgId]) {
            onSuccess([...localLeadsCache[orgId]]);
          }
        },
        (error) => {
          console.warn('Real-time listener notice:', error);
          if (localLeadsCache[orgId]) {
            onSuccess([...localLeadsCache[orgId]]);
          }
          if (onError) onError(error);
        }
      );
    } catch (e) {
      return () => {};
    }
  }
}
