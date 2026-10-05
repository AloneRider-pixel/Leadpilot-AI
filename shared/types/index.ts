/**
 * LeadPilot AI - Core Domain Models & Multi-Tenant Types
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES_REP';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  organizationId?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  primaryCity: string;
  companySize: string;
  salespeopleCount: number;
  monthlyLeads: number;
  avgPropertyValue: number; // in INR
  ownerId: string;
  plan: 'TRIAL' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELED';
  trialStart?: string;
  trialEnd?: string;
  usageLimits?: {
    maxLeads: number;
    maxUsers: number;
    aiAnalysesRemaining: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  joinedAt: string;
}

import type { LeadSource } from '../../src/types/lead';

export type {
  LeadStatus,
  LeadTemperature,
  LeadSource,
  LeadPurpose,
  ConversationChannel,
  MessageSender,
  ScoreBreakdown,
  LeadAnalysis,
  TenantScopedMetadata,
  Lead,
  ConversationMessage,
  Conversation,
  FollowUpStatus,
  FollowUpCadence,
  FollowUp,
} from '../../src/types/lead';

export type AppointmentType = 'SITE_VISIT' | 'PHONE_CALL' | 'VIDEO_CALL' | 'MEETING';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export interface Appointment {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  salespersonId: string;
  salespersonName: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  location: string;
  propertyId?: string;
  propertyName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = 'AVAILABLE' | 'LIMITED' | 'SOLD' | 'COMING_SOON';

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  project: string;
  city: string;
  locality: string;
  type: string; // '2BHK', '3BHK', '4BHK Villa', 'Penthouse'
  bedrooms: number;
  price: number; // in INR
  status: PropertyStatus;
  description: string;
  features: string[];
  salespersonNotes?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  leadId?: string;
  leadName?: string;
  userId: string;
  userName: string;
  type:
    | 'LEAD_CREATED'
    | 'LEAD_UPDATED'
    | 'STAGE_CHANGED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'FOLLOWUP_SCHEDULED'
    | 'APPOINTMENT_BOOKED'
    | 'NOTE_ADDED'
    | 'STATUS_CHANGED';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  organizationId: string;
  userId?: string; // If targeting specific user, otherwise broadcast to org
  title: string;
  message: string;
  type: 'HOT_LEAD' | 'FOLLOWUP_DUE' | 'APPOINTMENT_APPROACHING' | 'LEAD_AT_RISK' | 'AI_INSIGHT';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface RevenueEvent {
  id: string;
  organizationId: string;
  leadId: string;
  dealValue: number;
  bookingAmount?: number;
  propertyId?: string;
  salespersonId: string;
  source: LeadSource;
  isAiInfluenced: boolean;
  attributionStage: 'AI_QUALIFIED' | 'AI_FOLLOWUP' | 'AI_BOOKED' | 'MANUAL';
  closedAt: string;
}

export interface AIRecommendation {
  id: string;
  leadId: string;
  leadName: string;
  priority: 'URGENT' | 'TODAY' | 'NURTURE' | 'AT_RISK';
  reason: string;
  recommendedAction: string;
  budgetFormatted: string;
  location: string;
}
