import React, { useState, useEffect } from 'react';
import {
  Lead,
  LeadStatus,
  LeadTemperature,
  ConversationMessage,
} from '../../types/lead';
import { LeadService } from '../../services/leadService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Bot,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Copy,
  Check,
  Building,
  User,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  formatINR,
  formatDateTime,
  getTemperatureBadgeClass,
  getStatusBadgeClass,
} from '../../utils/formatters';

import { ConversationAnalyzerModal } from './ConversationAnalyzerModal';
import { ConversationAnalysisResult } from '../../../server/ai/analysisEngine';
import { AiAnalysisService } from '../../services/aiAnalysisService';

interface LeadDetailWorkspaceProps {
  lead: Lead;
  organizationId: string;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onOpenEditModal: (lead: Lead) => void;
}

export const LeadDetailWorkspace: React.FC<LeadDetailWorkspaceProps> = ({
  lead,
  organizationId,
  onClose,
  onUpdateLead,
  onOpenEditModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'intelligence' | 'conversation' | 'reply' | 'followups'
  >('intelligence');
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChannel, setNewChannel] = useState<'WHATSAPP' | 'PHONE_CALL' | 'NOTE'>('WHATSAPP');
  const [newSender, setNewSender] = useState<'CUSTOMER' | 'SALES_REP'>('CUSTOMER');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedReply, setGeneratedReply] = useState<string>('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  const handleApplyConversationAnalysis = async (res: ConversationAnalysisResult) => {
    const fullAnalysis = {
      organizationId,
      leadId: lead.id,
      summary: res.summary,
      intentScore: res.intentScore,
      temperature: res.temperature,
      buyingProbability: res.buyingProbability,
      urgency: res.urgency,
      buyingSignals: res.buyingSignals,
      objections: res.objections,
      missingInformation: res.missingInformation,
      recommendedAction: res.recommendedAction,
      recommendedMessage: res.recommendedReply,
      riskFlags: res.riskFlags,
      confidence: res.confidence,
      analyzedAt: new Date().toISOString(),
      scoreBreakdown: res.scoreBreakdown,
    };

    const updates: Partial<Lead> = {
      analysis: fullAnalysis,
      intentScore: res.intentScore,
      temperature: res.temperature,
    };

    if (res.extractedRequirements.budget) updates.budget = res.extractedRequirements.budget;
    if (res.extractedRequirements.city) updates.city = res.extractedRequirements.city;
    if (res.extractedRequirements.preferredLocation) updates.preferredLocation = res.extractedRequirements.preferredLocation;
    if (res.extractedRequirements.propertyType) updates.propertyType = res.extractedRequirements.propertyType;
    if (res.extractedRequirements.timelineDays) updates.timelineDays = res.extractedRequirements.timelineDays;
    if (res.extractedRequirements.financingReadiness) updates.financingReadiness = res.extractedRequirements.financingReadiness;

    await LeadService.updateLead(organizationId, lead.id, updates);
    const updatedLead: Lead = { ...lead, ...updates, updatedAt: new Date().toISOString() };
    onUpdateLead(updatedLead);
    setGeneratedReply(res.recommendedReply);
    setActiveTab('intelligence');
  };

  // Load conversations for this lead
  useEffect(() => {
    let isMounted = true;
    LeadService.getLeadConversations(organizationId, lead.id).then((msgs) => {
      if (isMounted) setConversations(msgs);
    });
    return () => {
      isMounted = false;
    };
  }, [lead.id, organizationId]);

  // Set default generated reply from analysis if available
  useEffect(() => {
    if (lead.analysis?.recommendedMessage) {
      setGeneratedReply(lead.analysis.recommendedMessage);
    }
  }, [lead.analysis]);

  // Handle stage change directly
  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatusUpdating(true);
    try {
      await LeadService.updateLeadStatus(organizationId, lead.id, newStatus);
      const updated = { ...lead, status: newStatus, updatedAt: new Date().toISOString() };
      onUpdateLead(updated);
    } catch (e) {
      console.error('Failed to update lead status:', e);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Add conversation message / transcript
  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const added = await LeadService.addConversationMessage(organizationId, {
        organizationId,
        leadId: lead.id,
        sender: newSender,
        channel: newChannel,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });
      setConversations((prev) => [...prev, added]);
      setNewMessage('');
    } catch (e) {
      console.error('Failed to log message:', e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Run Real Server-Side Gemini AI Analysis & Persist to LeadAnalysis collection
  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const convText = conversations
        .map((m) => `[${m.sender} via ${m.channel}]: ${m.content}`)
        .join('\n');

      const persistedAnalysis = await AiAnalysisService.analyzeAndPersistLead({
        lead,
        conversationHistory: convText || lead.notes || 'Inbound portal inquiry.',
        propertyContext: `${lead.propertyType || 'Apartment'} in ${lead.city}`,
        forceRefresh: true,
      });

      const updated: Lead = {
        ...lead,
        analysis: persistedAnalysis,
        intentScore: persistedAnalysis.intentScore,
        temperature: persistedAnalysis.temperature,
        updatedAt: new Date().toISOString(),
      };
      onUpdateLead(updated);
      setGeneratedReply(persistedAnalysis.recommendedMessage);
      setActiveTab('intelligence');
    } catch (e: unknown) {
      console.error('AI Analysis failed:', e);
      alert('AI analysis request failed. Check server logs.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate personalized WhatsApp reply on demand
  const handleGenerateCustomReply = async (instruction?: string) => {
    setIsGeneratingReply(true);
    try {
      const response = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          promptInstruction:
            instruction ||
            'Confirm interest, answer property questions, and invite them for a weekend site visit walkthrough.',
          channel: 'WHATSAPP',
        }),
      });
      const data = await response.json();
      if (data.reply) {
        setGeneratedReply(data.reply);
      }
    } catch (e) {
      console.error('Reply generation failed:', e);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusOptions: LeadStatus[] = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'INTERESTED',
    'SITE_VISIT',
    'NEGOTIATION',
    'BOOKED',
    'WON',
    'LOST',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Workspace Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{lead.name}</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getTemperatureBadgeClass(
                    lead.temperature
                  )}`}
                >
                  {lead.temperature}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadgeClass(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                <span className="font-mono">{lead.phone}</span>
                <span>•</span>
                <span>{lead.city}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-400">{formatINR(lead.budget)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAnalyzerOpen(true)}
              leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              Analyze Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEditModal(lead)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              Edit Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAiAnalysis}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/40"
            >
              Run AI Analysis
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Bar & Pipeline Switcher */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Stage:</span>
            <select
              value={lead.status}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-500"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Rep: <strong className="text-slate-800">{lead.assignedRepName || 'Unassigned'}</strong>
            </span>
            <span>•</span>
            <span>
              Source: <strong className="text-slate-800">{lead.source}</strong>
            </span>
            <span>•</span>
            <span>
              Intent Score: <strong className="text-emerald-700 font-bold">{lead.intentScore || 50}/100</strong>
            </span>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="px-6 bg-white border-b border-slate-200 flex gap-6 text-xs font-semibold">
          {[
            { id: 'intelligence', label: 'AI Intelligence & Score', icon: Sparkles },
            { id: 'profile', label: 'Buyer Profile', icon: User },
            { id: 'conversation', label: 'Conversation & Notes', icon: MessageSquare },
            { id: 'reply', label: 'AI WhatsApp Reply', icon: Bot },
            { id: 'followups', label: 'Follow-Up Plan', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  active
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: AI INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              {/* Scoring Dial & Probability Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm border border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Intent Score
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400">
                      {lead.analysis?.intentScore ?? lead.intentScore ?? 75}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {lead.temperature === 'HOT'
                      ? 'High purchase likelihood'
                      : lead.temperature === 'WARM'
                      ? 'Moderate consideration'
                      : 'Low engagement'}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Buying Probability
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">
                      {lead.analysis?.buyingProbability ?? 80}%
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">Estimated conversion</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Urgency
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-sm font-bold ${
                        (lead.analysis?.urgency || 'HIGH') === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lead.analysis?.urgency || 'HIGH'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {lead.timelineDays ? `${lead.timelineDays} days timeline` : 'Active'}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Temperature
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Flame
                      className={`w-6 h-6 ${
                        lead.temperature === 'HOT'
                          ? 'text-rose-500 fill-rose-500'
                          : lead.temperature === 'WARM'
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="text-2xl font-bold text-slate-900">{lead.temperature}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Calibrated by rules</p>
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Recommended Next Action for {lead.assignedRepName || 'Sales Rep'}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-950 mt-1">
                      {lead.analysis?.recommendedAction ||
                        'Call buyer immediately to confirm weekend site visit availability and share floor plan brochure.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transparent 0–100 Scoring Breakdown (Section 10) */}
              {lead.analysis?.scoreBreakdown && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Transparent Scoring Matrix (0–100)</span>
                    <span className="font-mono text-emerald-700">
                      Total: {lead.analysis.scoreBreakdown.total}/100
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Purchase Timeline</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.timeline} / 20
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Budget Clarity</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.budget} / 15
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Requirement Clarity</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.requirementClarity} / 15
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Engagement</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.engagement} / 15
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Site Visit Intent</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.siteVisitIntent} / 20
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 block">Financing Readiness</span>
                      <strong className="text-slate-800 text-sm">
                        {lead.analysis.scoreBreakdown.financingReadiness} / 15
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Signals, Objections, Missing Info, Risk Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buying Signals */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Positive Buying Signals
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(lead.analysis?.buyingSignals && lead.analysis.buyingSignals.length > 0
                      ? lead.analysis.buyingSignals
                      : [
                          `Defined budget of ${formatINR(lead.budget)}`,
                          `Active timeline: within ${lead.timelineDays} days`,
                          `Specific configuration: ${lead.propertyType}`,
                          `Location preference: ${lead.city} ${lead.preferredLocation || ''}`,
                        ]
                    ).map((signal, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold mt-0.5">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Objections */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-amber-700">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Buyer Objections / Hesitations
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(lead.analysis?.objections && lead.analysis.objections.length > 0
                      ? lead.analysis.objections
                      : [
                          'Checking possession timeline certainty',
                          'Comparing price per sq.ft with nearby projects',
                        ]
                    ).map((obj, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold mt-0.5">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Information */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-blue-700">
                    <HelpCircle className="w-4 h-4 text-blue-600" /> Missing Information (To Inquire)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(lead.analysis?.missingInformation && lead.analysis.missingInformation.length > 0
                      ? lead.analysis.missingInformation
                      : [
                          'Preferred floor level (low, middle, or penthouse)',
                          'Vastu orientation requirements',
                          'Down-payment ready percentage',
                        ]
                    ).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Flags */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-rose-700">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Risk Flags
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {(lead.analysis?.riskFlags && lead.analysis.riskFlags.length > 0
                      ? lead.analysis.riskFlags
                      : [
                          'Actively talking with competitor brokerages in the same micro-market',
                        ]
                    ).map((flag, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold mt-0.5">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Recommended Property Matches */}
              {lead.analysis?.propertyMatches && lead.analysis.propertyMatches.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Building className="w-4 h-4 text-emerald-600" />
                      AI Recommended Property Matches ({lead.analysis.propertyMatches.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">Ranked by buyer budget & location</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lead.analysis.propertyMatches.map((pm, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{pm.propertyName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {pm.matchScore}% Match
                          </span>
                        </div>
                        <div className="text-slate-500 flex items-center justify-between text-[11px]">
                          <span>{pm.configuration} • {pm.location}</span>
                          <span className="font-semibold text-emerald-700">{formatINR(pm.price)}</span>
                        </div>
                        <p className="text-slate-600 italic text-[11px] bg-white p-2 rounded border border-slate-100">
                          "{pm.matchReason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary Card */}
              {lead.analysis?.summary && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Lead Intelligence Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{lead.analysis.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUYER PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                  Buyer Profile & Requirements
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Full Name</span>
                    <span className="text-slate-900 font-semibold text-sm">{lead.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Phone Number</span>
                    <span className="text-slate-900 font-mono font-medium">{lead.phone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="text-slate-900">{lead.email || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">City & Micro-Market</span>
                    <span className="text-slate-900 font-medium">
                      {lead.city} {lead.preferredLocation ? `(${lead.preferredLocation})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Configuration</span>
                    <span className="text-slate-900 font-medium">{lead.propertyType || '3BHK'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Verified Budget</span>
                    <span className="text-emerald-700 font-bold text-sm">
                      {formatINR(lead.budget)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Purchase Timeline</span>
                    <span className="text-slate-900 font-medium">
                      Within {lead.timelineDays} Days
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Financing Readiness</span>
                    <span className="text-slate-900 font-medium">{lead.financingReadiness}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Purchase Purpose</span>
                    <span className="text-slate-900 font-medium">
                      {lead.purpose === 'SELF_USE'
                        ? 'Self-Use (Primary Residence)'
                        : lead.purpose === 'INVESTMENT'
                        ? 'Capital Appreciation'
                        : 'Rental Income'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Inbound Lead Source</span>
                    <span className="text-slate-900 font-medium">{lead.source}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Assigned Representative</span>
                    <span className="text-slate-900 font-medium">
                      {lead.assignedRepName || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">Created Date</span>
                    <span className="text-slate-900">{formatDateTime(lead.createdAt)}</span>
                  </div>
                </div>
              </div>

              {lead.notes && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Inbound Notes & Inquiries
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    {lead.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONVERSATION & NOTES */}
          {activeTab === 'conversation' && (
            <div className="space-y-4">
              {/* Message History */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs max-h-96 overflow-y-auto space-y-3">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No logged messages yet. Enter WhatsApp chat or call notes below.
                  </div>
                ) : (
                  conversations.map((msg) => {
                    const isCustomer = msg.sender === 'CUSTOMER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-600">
                            {isCustomer ? lead.name : 'Sales Executive'}
                          </span>
                          <span>via {msg.channel}</span>
                          <span>•</span>
                          <span>{formatDateTime(msg.timestamp)}</span>
                        </div>
                        <div
                          className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isCustomer
                              ? 'bg-slate-100 text-slate-900 rounded-tl-xs'
                              : 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Conversation Entry */}
              <form
                onSubmit={handleAddMessage}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Add Message or Sales Call Transcript</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={newSender === 'CUSTOMER'}
                        onChange={() => setNewSender('CUSTOMER')}
                      />
                      <span>Customer</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={newSender === 'SALES_REP'}
                        onChange={() => setNewSender('SALES_REP')}
                      />
                      <span>Sales Rep</span>
                    </label>
                    <select
                      value={newChannel}
                      onChange={(e) =>
                        setNewChannel(e.target.value as 'WHATSAPP' | 'PHONE_CALL' | 'NOTE')
                      }
                      className="border border-slate-300 rounded px-2 py-0.5 text-xs"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE_CALL">Phone Call</option>
                      <option value="NOTE">Internal Note</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Paste WhatsApp message or summarize customer discussion..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSendingMessage}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Log Message
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: AI WHATSAPP REPLY GENERATOR */}
          {activeTab === 'reply' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-600" />
                      Personalized WhatsApp Reply
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tailored to {lead.name}’s budget of {formatINR(lead.budget)} in {lead.city}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateCustomReply()}
                    isLoading={isGeneratingReply}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Regenerate
                  </Button>
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={generatedReply}
                    onChange={(e) => setGeneratedReply(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-4 text-xs font-sans text-slate-900 leading-relaxed bg-emerald-50/20 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedReply)}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Message
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">Compliance & Anti-Hallucination:</div>
                  <p>
                    LeadPilot AI generates polite, culturally attuned responses without fabricating
                    unapproved discounts, terms, or unavailable inventory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FOLLOW-UP PLAN */}
          {activeTab === 'followups' && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Automated Follow-up Sequence Cadence
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Day-1, Day-3, Day-7, and Day-14 touchpoints
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  {
                    cadence: 'Immediate Touchpoint',
                    timing: 'Within 15 minutes of inbound ad lead',
                    status: 'COMPLETED',
                    message:
                      'Namaste! Thank you for inquiring about our 3BHK residences. Sharing brochure and unit layout.',
                  },
                  {
                    cadence: '1 Day Follow-Up',
                    timing: 'Tomorrow at 11:30 AM',
                    status: 'SCHEDULED',
                    message:
                      'Hi Rahul ji, checking in to confirm if you had a chance to view the sample apartment video. Would this Saturday work for your visit?',
                  },
                  {
                    cadence: '3 Days Follow-Up',
                    timing: 'In 3 days',
                    status: 'PENDING',
                    message:
                      'Exclusive update: 2 corner units in Tower B on mid-floors are available for selection this weekend.',
                  },
                  {
                    cadence: '7 Days Follow-Up',
                    timing: 'In 7 days',
                    status: 'PENDING',
                    message:
                      'Re-engaging regarding financing subsidies and bank loan pre-approval options.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{item.cadence}</span>
                        <Badge
                          variant={item.status === 'COMPLETED' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">{item.timing}</p>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                        "{item.message}"
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConversationAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
        lead={lead}
        onApplyResults={handleApplyConversationAnalysis}
      />
    </div>
  );
};
