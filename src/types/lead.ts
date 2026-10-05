/**
 * LeadPilot AI - Lead Domain Types
 * Strict typing for Leads, Conversations, AI Analysis, Lead Sources, and Follow-ups
 * Every entity enforces 'organizationId' for multi-tenant isolation.
 */

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'INTERESTED'
  | 'SITE_VISIT'
  | 'NEGOTIATION'
  | 'BOOKED'
  | 'WON'
  | 'LOST';

export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';

export type LeadSource =
  | 'Meta Ads'
  | 'Google Ads'
  | 'Website'
  | 'WhatsApp'
  | 'Instagram'
  | 'Referral'
  | 'Manual'
  | 'Walk-in';

export type LeadPurpose = 'SELF_USE' | 'INVESTMENT' | 'RENTAL_INCOME' | 'OTHER';

export type ConversationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PHONE_CALL' | 'NOTE';

export type MessageSender = 'CUSTOMER' | 'SALES_REP' | 'AI_SYSTEM';

export type FollowUpStatus = 'PENDING' | 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'SKIPPED';

export type FollowUpCadence = 'Immediate' | '1 Day' | '3 Days' | '7 Days' | '14 Days';

export interface ScoreBreakdown {
  timeline: number;           // max 20
  budget: number;             // max 15
  requirementClarity: number;    // max 15
  engagement: number;         // max 15
  siteVisitIntent: number;    // max 20
  financingReadiness: number; // max 15
  total: number;              // 0 - 100
}

export interface PropertyMatch {
  propertyId: string;
  propertyName: string;
  location: string;
  configuration: string;
  price: number;
  matchScore: number;
  matchReason: string;
}

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
}

export interface TenantScopedMetadata {
  organizationId: string;
  createdBy: string;
  updatedBy?: string;
  assignedTeamId?: string;
  campaignId?: string;
  adSetId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  customAttributes?: Record<string, string | number | boolean>;
  schemaVersion: number;
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  preferredLocation?: string;
  propertyType?: string; // '2BHK', '3BHK', '4BHK Villa', 'Penthouse', 'Plot'
  bedrooms?: string;
  budget: number; // In INR (e.g. 14000000 = 1.4 Cr)
  timelineDays: number;
  financingReadiness?: string; // 'Pre-approved Loan', 'Cash / Self-funded', 'Loan Required'
  purpose: LeadPurpose;
  source: LeadSource;
  status: LeadStatus;
  temperature: LeadTemperature;
  intentScore: number; // 0 - 100
  assignedRepId?: string;
  assignedRepName?: string;
  propertyId?: string;
  propertyName?: string;
  notes?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  isDemo?: boolean;
  tenantMetadata?: TenantScopedMetadata;
  analysis?: LeadAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  organizationId: string;
  leadId: string;
  sender: MessageSender;
  channel: ConversationChannel;
  content: string;
  timestamp: string;
  metadata?: {
    delivered?: boolean;
    read?: boolean;
    whatsappMessageId?: string;
    callDurationSeconds?: number;
    agentName?: string;
    rawPayload?: Record<string, unknown>;
  };
}

export interface Conversation {
  id: string;
  organizationId: string;
  leadId: string;
  channel: ConversationChannel;
  messages: ConversationMessage[];
  lastMessageAt: string;
  summary?: string;
  extractedRequirements?: {
    budget?: number;
    location?: string;
    propertyType?: string;
    preferredVisitTime?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  salespersonId: string;
  salespersonName: string;
  cadence: FollowUpCadence;
  scheduledFor: string;
  messageText: string;
  channel: 'WHATSAPP' | 'CALL' | 'EMAIL';
  status: FollowUpStatus;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}
