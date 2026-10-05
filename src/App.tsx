import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AppLayout, NavTab } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LoadingState } from './components/common/LoadingState';
import { Card } from './components/common/Card';
import { Button } from './components/common/Button';
import {
  Users,
  KanbanSquare,
  Sparkles,
  Clock,
  Calendar,
  Building2,
  BarChart3,
  Settings,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading, isOnboarded, organization, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [leadsFilter, setLeadsFilter] = useState<string | undefined>(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingState message="Connecting to LeadPilot AI Workspace..." className="text-white" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <LoginPage />;
  }

  // Signed in, but tenant organization not configured
  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigateToLeads={(filter) => {
              setLeadsFilter(filter);
              setSelectedLeadId(null);
              setCurrentTab('leads');
            }}
            onNavigateToLeadDetail={(leadId) => {
              setSelectedLeadId(leadId);
              setCurrentTab('leads');
            }}
          />
        );

      case 'leads':
        return (
          <LeadsPage
            initialFilter={leadsFilter}
            selectedLeadId={selectedLeadId}
            onClearSelectedLead={() => setSelectedLeadId(null)}
          />
        );

      case 'pipeline':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Kanban Sales Pipeline</h1>
            <Card
              title="Real Estate Deal Pipeline"
              subtitle="NEW → CONTACTED → QUALIFIED → INTERESTED → SITE_VISIT → NEGOTIATION → BOOKED → WON"
            >
              <p className="text-xs text-slate-600">
                Pipeline stages ready for Stage activity tracking and probability-weighted revenue
                calculation.
              </p>
            </Card>
          </div>
        );

      case 'copilot':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" /> AI Sales Copilot
            </h1>
            <Card
              title="Server-Side Gemini AI Integration"
              subtitle="Model: gemini-3.8-flash initialized via backend server.ts proxy"
            >
              <p className="text-xs text-slate-600">
                AI Copilot proxy route is live on <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/ai/copilot</code>.
                API keys are securely held on the backend server.
              </p>
            </Card>
          </div>
        );

      case 'followups':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Follow-up Cadence Engine</h1>
            <Card title="Automated Follow-up Sequences" subtitle="Immediate, 1-Day, 3-Days, 7-Days, 14-Days">
              <p className="text-xs text-slate-600">
                Follow-up engine with WhatsApp personalization and anti-hallucination guardrails.
              </p>
            </Card>
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Appointments & Site Visits</h1>
            <Card title="Site Visit Calendar" subtitle="Schedule and track physical site visits and meetings">
              <p className="text-xs text-slate-600">
                Appointment booking workflows with status tracking (Scheduled, Confirmed, Completed, No Show).
              </p>
            </Card>
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Property Inventory Catalog</h1>
            <Card title="Real Estate Inventory" subtitle="NCR, Bengaluru, Mumbai projects and configurations">
              <p className="text-xs text-slate-600">
                Inventory catalog with AI semantic property matching based on buyer budget and location preferences.
              </p>
            </Card>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Sales & Revenue Analytics</h1>
            <Card title="Executive Metrics" subtitle="Deterministic database calculations and AI attribution">
              <p className="text-xs text-slate-600">
                Conversion funnel, source ROI, salesperson leaderboard, and AI-influenced revenue.
              </p>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">Organization Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Company Profile" subtitle="Your tenant workspace configuration">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block">Organization Name:</span>
                    <span className="text-slate-900">{organization?.name}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Primary City:</span>
                    <span className="text-slate-900">{organization?.primaryCity}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Industry Sector:</span>
                    <span className="text-slate-900">{organization?.industry}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">Sales Team Size:</span>
                    <span className="text-slate-900">{organization?.salespeopleCount} Sales Representatives</span>
                  </div>
                </div>
              </Card>

              <Card title="Security & RBAC" subtitle="Role-based access permissions">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-purple-50 text-purple-900 rounded-lg border border-purple-200">
                    <span className="font-bold block">Current Role: {role || 'OWNER'}</span>
                    <span>
                      {role === 'OWNER'
                        ? 'Full tenant administration, user invitations, and billing management.'
                        : 'Access restricted to assigned leads and operational tasks.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Firestore Security Rules Enforced</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return <DashboardPage onNavigateToLeads={() => setCurrentTab('leads')} />;
    }
  };

  return (
    <AppLayout currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)}>
      {renderTabContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
