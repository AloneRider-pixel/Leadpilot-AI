import React from 'react';
import {
  Users,
  Flame,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatINR } from '../utils/formatters';

interface DashboardPageProps {
  onNavigateToLeads: (filter?: string) => void;
  onNavigateToLeadDetail?: (leadId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateToLeads, onNavigateToLeadDetail }) => {
  const { organization, role } = useAuth();

  // Primary KPIs required by prompt
  const kpis = [
    {
      title: 'Total Inbound Leads',
      value: '248',
      subtitle: '+18% vs last month',
      trend: { value: '18%', isPositive: true },
      icon: <Users className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Hot Leads (Score 80+)',
      value: '18',
      subtitle: 'Requiring immediate action',
      highlight: true,
      icon: <Flame className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Follow-ups Due Today',
      value: '14',
      subtitle: '4 overdue follow-ups',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    },
    {
      title: 'Appointments / Visits',
      value: '32',
      subtitle: '12 site visits booked',
      trend: { value: '24%', isPositive: true },
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
    },
    {
      title: 'Active Pipeline Value',
      value: '₹34.8 Cr',
      subtitle: 'In active negotiation',
      icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
    },
    {
      title: 'Weighted Pipeline',
      value: '₹14.2 Cr',
      subtitle: 'Probability-weighted',
      icon: <Building2 className="w-4 h-4 text-teal-600" />,
    },
    {
      title: 'Won Revenue (FY26)',
      value: '₹8.4 Cr',
      subtitle: '6 Closed property deeds',
      icon: <Award className="w-4 h-4 text-amber-500" />,
    },
    {
      title: 'Conversion Rate',
      value: '12.9%',
      subtitle: 'Inquiry to Site Visit',
      trend: { value: '3.2%', isPositive: true },
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
    },
  ];

  // AI Priority Queue required by prompt Section 6
  const priorityQueue = [
    {
      id: 'lead-rahul-sharma',
      name: 'Rahul Sharma',
      priority: 'URGENT' as const,
      budget: '₹1.4 Cr',
      city: 'Noida',
      property: '3BHK • ATS Knightsbridge',
      reason:
        'Rahul Sharma should be contacted immediately because he has a ₹1.4 Cr budget, a 30-day purchase timeline and requested a weekend site visit.',
      action: 'Confirm Saturday site visit slot & share unit layout',
      phone: '+91 98112 34567',
    },
    {
      id: 'lead-anita-desai',
      name: 'Dr. Anita Desai',
      priority: 'TODAY' as const,
      budget: '₹2.8 Cr',
      city: 'Gurgaon',
      property: '4BHK Villa • Golf Course Ext',
      reason:
        'Pre-approved HDFC loan confirmed. Requested sample flat video before visiting this Sunday afternoon.',
      action: 'Send WhatsApp walkthrough video with pricing sheet',
      phone: '+91 98201 44221',
    },
    {
      id: 'lead-karan-malhotra',
      name: 'Karan Malhotra',
      priority: 'NURTURE' as const,
      budget: '₹95 Lakhs',
      city: 'Noida Sec 150',
      property: '2BHK Luxury High-Rise',
      reason:
        'Comparing with Godrej Woods. Offered possession timeline within 6 months fits his lease expiry.',
      action: 'Highlight ready possession advantages over under-construction competitors',
      phone: '+91 98991 76543',
    },
    {
      id: 'lead-sameer-khan',
      name: 'Sameer Khan',
      priority: 'AT_RISK' as const,
      budget: '₹3.2 Cr',
      city: 'Bengaluru',
      property: 'Penthouse • Indiranagar',
      reason:
        'No rep response for 48 hours following his pricing enquiry. Risk of competitor channel partner conversion.',
      action: 'Immediate manager courtesy call & express brochure delivery',
      phone: '+91 98450 12890',
    },
  ];

  const priorityBadgeVariant = {
    URGENT: 'danger' as const,
    TODAY: 'warning' as const,
    NURTURE: 'info' as const,
    AT_RISK: 'danger' as const,
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Operating System Active
              </span>
              <span className="text-xs text-slate-400">
                {organization?.primaryCity} Market
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {organization?.name || 'Skyline Luxe Realty'} — Executive Sales Pulse
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              AI qualification engine is processing inbound leads across Meta Ads, WhatsApp & Google
              Portals. 4 high-intent prospects await instant response.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigateToLeads('hot')}
              leftIcon={<Flame className="w-4 h-4 text-emerald-200" />}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
            >
              View 18 Hot Leads
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <StatCard
            key={idx}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            trend={kpi.trend}
            highlight={kpi.highlight}
          />
        ))}
      </div>

      {/* AI Priority Queue Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                AI Priority Queue
              </h2>
              <p className="text-xs text-slate-500">
                Calibrated by buyer intent, budget clarity, timeline urgency & site-visit probability
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToLeads()}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            All Leads
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priorityQueue.map((item) => (
            <Card
              key={item.id}
              className="border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm"
              headerClassName="bg-slate-50/50 py-3"
              title={
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  <Badge variant={priorityBadgeVariant[item.priority]} size="sm">
                    {item.priority}
                  </Badge>
                </div>
              }
              action={
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">{item.budget}</span>
                  <span className="text-[11px] text-slate-400 block">{item.city}</span>
                </div>
              }
              footer={
                <div className="w-full flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium truncate max-w-[220px]">
                    {item.property}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onNavigateToLeadDetail
                          ? onNavigateToLeadDetail(item.id)
                          : onNavigateToLeads('hot')
                      }
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" /> Action
                    </button>
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Why prioritized:
                  </span>
                  {item.reason}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Next Step: {item.action}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Follow-up Cadence Box */}
        <Card
          title="Today’s Follow-Up Cadence"
          subtitle="Automated Day-1, Day-3, and Day-7 WhatsApp touchpoints"
          className="lg:col-span-2"
        >
          <div className="divide-y divide-slate-100">
            {[
              {
                name: 'Vikram Chawla',
                cadence: '1 Day Follow-up',
                property: '3BHK • Gaur City Noida',
                status: 'DRAFT',
                suggestedTime: '11:30 AM',
              },
              {
                name: 'Pooja Agarwal',
                cadence: '3 Days Follow-up',
                property: '4BHK Villa • Greater Noida West',
                status: 'SCHEDULED',
                suggestedTime: '02:00 PM',
              },
              {
                name: 'Rajeev Singhania',
                cadence: 'Immediate',
                property: 'Commercial Retail Shop • Sec 62',
                status: 'PENDING',
                suggestedTime: 'Immediate',
              },
            ].map((f, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{f.name}</span>
                    <Badge variant="neutral" size="sm">
                      {f.cadence}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{f.property}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">{f.suggestedTime}</span>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Architecture Status */}
        <Card
          title="System Architecture"
          subtitle="Enterprise SaaS Health Status"
        >
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Multi-Tenant Firestore
              </span>
              <span className="font-bold">Connected</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
              <span className="font-semibold">Gemini AI Model</span>
              <span className="font-mono text-[11px] text-emerald-700">gemini-3.8-flash</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
              <span className="font-semibold">Security Rules</span>
              <span className="text-emerald-700 font-semibold">Active & Hardened</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
              <span className="font-semibold">Your Tenant Role</span>
              <span className="font-semibold text-purple-700">{role || 'OWNER'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
