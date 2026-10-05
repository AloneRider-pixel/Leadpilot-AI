import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Organization, OrgMember, UserProfile, UserRole } from '../../shared/types';

export interface OnboardingInput {
  companyName: string;
  industry: string;
  primaryCity: string;
  companySize: string;
  salespeopleCount: number;
  monthlyLeads: number;
  avgPropertyValue: number;
}

export class OrganizationService {
  /**
   * Fetch user's root profile
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  /**
   * Fetch organization by ID
   */
  static async getOrganization(orgId: string): Promise<Organization | null> {
    const path = `organizations/${orgId}`;
    try {
      const snap = await getDoc(doc(db, 'organizations', orgId));
      if (!snap.exists()) return null;
      return snap.data() as Organization;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  /**
   * Fetch member details inside an organization
   */
  static async getOrgMember(orgId: string, userId: string): Promise<OrgMember | null> {
    const path = `organizations/${orgId}/users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'organizations', orgId, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as OrgMember;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  /**
   * Create new organization and set the user as OWNER
   */
  static async createOrganizationWithOnboarding(
    userId: string,
    email: string,
    displayName: string,
    photoURL: string | undefined,
    data: OnboardingInput
  ): Promise<{ organization: Organization; userProfile: UserProfile }> {
    const sanitizedName = data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    const orgId = `org-${sanitizedName}-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const organization: Organization = {
      id: orgId,
      name: data.companyName.trim(),
      industry: data.industry || 'Real Estate Developer',
      primaryCity: data.primaryCity.trim(),
      companySize: data.companySize || '11-50 employees',
      salespeopleCount: Number(data.salespeopleCount) || 5,
      monthlyLeads: Number(data.monthlyLeads) || 200,
      avgPropertyValue: Number(data.avgPropertyValue) || 12500000,
      ownerId: userId,
      plan: 'GROWTH',
      subscriptionStatus: 'TRIAL',
      trialStart: nowIso,
      trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimits: {
        maxLeads: 5000,
        maxUsers: 25,
        aiAnalysesRemaining: 1500,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const userProfile: UserProfile = {
      userId,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || '',
      organizationId: orgId,
      role: 'OWNER',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const orgMember: OrgMember = {
      userId,
      email,
      displayName: displayName || email.split('@')[0],
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: nowIso,
    };

    // 1. Create Organization document
    const orgPath = `organizations/${orgId}`;
    try {
      await setDoc(doc(db, 'organizations', orgId), organization);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, orgPath);
    }

    // 2. Add User to Org Members
    const memberPath = `organizations/${orgId}/users/${userId}`;
    try {
      await setDoc(doc(db, 'organizations', orgId, 'users', userId), orgMember);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, memberPath);
    }

    // 3. Update root User profile
    const userPath = `users/${userId}`;
    try {
      await setDoc(doc(db, 'users', userId), userProfile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, userPath);
    }

    return { organization, userProfile };
  }

  /**
   * Update organization profile
   */
  static async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    const path = `organizations/${orgId}`;
    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
