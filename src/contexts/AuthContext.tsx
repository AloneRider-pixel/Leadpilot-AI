import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithPopup, googleProvider, firebaseSignOut } from '../services/firebase';
import { OrganizationService, OnboardingInput } from '../services/organizationService';
import { Organization, UserProfile, UserRole } from '../../shared/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  role: UserRole | null;
  isLoading: boolean;
  isOnboarded: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: OnboardingInput) => Promise<void>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'leadpilot_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync profile & organization from Firestore
  const syncUserData = useCallback(async (uid: string, fallbackEmail?: string, fallbackName?: string) => {
    try {
      const profile = await OrganizationService.getUserProfile(uid);
      if (profile && profile.organizationId) {
        setUserProfile(profile);
        setRole(profile.role);
        const org = await OrganizationService.getOrganization(profile.organizationId);
        setOrganization(org);
      } else {
        // User is authenticated but not onboarded into an organization yet
        setUserProfile(profile || {
          userId: uid,
          email: fallbackEmail || '',
          displayName: fallbackName || 'Real Estate Professional',
          role: 'OWNER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setOrganization(null);
        setRole('OWNER');
      }
    } catch (err: unknown) {
      console.warn('Auth data sync note:', err);
    }
  }, []);

  useEffect(() => {
    // Check if demo user session exists
    const storedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (storedDemo) {
      try {
        const demoData = JSON.parse(storedDemo);
        setUser({
          uid: demoData.userId,
          email: demoData.email,
          displayName: demoData.displayName,
          photoURL: demoData.photoURL || '',
          emailVerified: true,
        } as unknown as User);
        setUserProfile(demoData.profile);
        setOrganization(demoData.organization);
        setRole(demoData.profile?.role || 'OWNER');
        setIsLoading(false);
        return;
      } catch (e) {
        console.error('Failed to parse stored demo session', e);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncUserData(firebaseUser.uid, firebaseUser.email ?? undefined, firebaseUser.displayName ?? undefined);
      } else {
        setUserProfile(null);
        setOrganization(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserData]);

  const signInWithGoogle = async () => {
    setError(null);
    setIsLoading(true);
    try {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserData(result.user.uid, result.user.email ?? undefined, result.user.displayName ?? undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed';
      console.error('Google Sign In error:', err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsDemoUser = async (userRole: UserRole = 'OWNER') => {
    setError(null);
    setIsLoading(true);
    try {
      const demoUid = userRole === 'OWNER' ? 'demo-owner-id' : 'demo-salesrep-id';
      const demoEmail = userRole === 'OWNER' ? 'vikram.mehta@skylineprop.in' : 'priya.singh@skylineprop.in';
      const demoName = userRole === 'OWNER' ? 'Vikram Mehta (Managing Director)' : 'Priya Singh (Senior Sales Lead)';

      // Check if we can seed or get demo org
      const demoOrgId = 'org-skyline-realty';
      const demoOrg: Organization = {
        id: demoOrgId,
        name: 'Skyline Luxe Realty & Developers',
        industry: 'Luxury Residential & Commercial',
        primaryCity: 'Noida & Gurgaon',
        companySize: '25-100 employees',
        salespeopleCount: 8,
        monthlyLeads: 450,
        avgPropertyValue: 16500000, // 1.65 Cr
        ownerId: 'demo-owner-id',
        plan: 'GROWTH',
        subscriptionStatus: 'ACTIVE',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        usageLimits: {
          maxLeads: 10000,
          maxUsers: 25,
          aiAnalysesRemaining: 2450,
        },
      };

      const demoProfile: UserProfile = {
        userId: demoUid,
        email: demoEmail,
        displayName: demoName,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        organizationId: demoOrgId,
        role: userRole,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sessionData = {
        userId: demoUid,
        email: demoEmail,
        displayName: demoName,
        profile: demoProfile,
        organization: demoOrg,
      };

      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(sessionData));
      setUser({
        uid: demoUid,
        email: demoEmail,
        displayName: demoName,
        emailVerified: true,
      } as unknown as User);
      setUserProfile(demoProfile);
      setOrganization(demoOrg);
      setRole(userRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (data: OnboardingInput) => {
    if (!user) throw new Error('You must be signed in to create an organization.');
    setError(null);
    setIsLoading(true);
    try {
      const { organization: newOrg, userProfile: newProfile } =
        await OrganizationService.createOrganizationWithOnboarding(
          user.uid,
          user.email || '',
          user.displayName || '',
          user.photoURL || undefined,
          data
        );
      setOrganization(newOrg);
      setUserProfile(newProfile);
      setRole(newProfile.role);

      // If in demo mode, update stored session
      const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (stored) {
        localStorage.setItem(
          DEMO_USER_STORAGE_KEY,
          JSON.stringify({
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            profile: newProfile,
            organization: newOrg,
          })
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrg = async () => {
    if (userProfile?.organizationId) {
      const org = await OrganizationService.getOrganization(userProfile.organizationId);
      if (org) setOrganization(org);
    }
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setOrganization(null);
    setRole(null);
  };

  const isOnboarded = Boolean(organization && userProfile?.organizationId);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        organization,
        role,
        isLoading,
        isOnboarded,
        error,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
        completeOnboarding,
        refreshOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
