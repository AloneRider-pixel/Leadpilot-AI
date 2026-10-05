import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, LeadTemperature, LeadSource } from '../types/lead';
import { LeadService } from '../services/leadService';
import { useAuth } from '../contexts/AuthContext';
import { LeadFormModal } from '../components/leads/LeadFormModal';
import { CsvImportModal } from '../components/leads/CsvImportModal';
import { LeadDetailWorkspace } from '../components/leads/LeadDetailWorkspace';
import { ConversationAnalyzerModal } from '../components/leads/ConversationAnalyzerModal';
import { ConversationAnalysisResult } from '../../server/ai/analysisEngine';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { LoadingState, EmptyState } from '../components/common/LoadingState';
import { DEMO_SALES_REPS } from '../data/demoLeads';
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  RefreshCw,
  Flame,
  ArrowUpDown,
  Phone,
  Building,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  formatINR,
  formatRelativeTime,
  getTemperatureBadgeClass,
  getStatusBadgeClass,
} from '../utils/formatters';

interface LeadsPageProps {
  initialFilter?: string;
  selectedLeadId?: string | null;
  onClearSelectedLead?: () => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  initialFilter,
  selectedLeadId,
  onClearSelectedLead,
}) => {
  const { organization } = useAuth();
  const orgId = organization?.id || 'org-skyline-realty';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState<string>(
    initialFilter === 'hot' ? 'HOT' : 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [repFilter, setRepFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'updated' | 'score' | 'budget_desc' | 'budget_asc' | 'name'>('updated');

  // Modals & Workspace State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isChatAnalyzerOpen, setIsChatAnalyzerOpen] = useState(false);
  const [activeLeadForWorkspace, setActiveLeadForWorkspace] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Handle extracted chat applied as new lead
  const handleApplyChatToNewLead = async (res: ConversationAnalysisResult) => {
    const budgetVal = res.extractedRequirements.budget || 14000000;
    const newLead = await LeadService.createLead({
      organizationId: orgId,
      name: 'Inbound Prospect (WhatsApp)',
      phone: '+91 98112 00000',
      city: res.extractedRequirements.city || 'Noida',
      preferredLocation: res.extractedRequirements.preferredLocation,
      propertyType: res.extractedRequirements.propertyType || '3BHK',
      bedrooms: res.extractedRequirements.bedrooms || '3 BHK',
      budget: budgetVal,
      timelineDays: res.extractedRequirements.timelineDays || 30,
      financingReadiness: res.extractedRequirements.financingReadiness || 'Pre-approved Loan',
      purpose: res.extractedRequirements.purpose || 'SELF_USE',
      source: 'WhatsApp',
      status: 'QUALIFIED',
      temperature: res.temperature,
      intentScore: res.intentScore,
      assignedRepId: 'rep-priya',
      assignedRepName: 'Priya Singh',
      notes: res.summary,
      analysis: {
        organizationId: orgId,
        leadId: '',
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
      },
    });
    setActiveLeadForWorkspace(newLead);
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real-time listener & initial fetch
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = LeadService.subscribeToLeads(
      orgId,
      (fetchedLeads) => {
        if (fetchedLeads.length === 0) {
          // Auto-seed demo leads for great initial out-of-the-box experience
          LeadService.seedDemoLeads(orgId).then((demo) => {
            setLeads(demo);
            setIsLoading(false);
          });
        } else {
          setLeads(fetchedLeads);
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Real-time sync notice:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Handle selectedLeadId from dashboard navigation
  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const match = leads.find((l) => l.id === selectedLeadId);
      if (match) {
        setActiveLeadForWorkspace(match);
      }
    }
  }, [selectedLeadId, leads]);

  // Handle Manual Seed Trigger
  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const demo = await LeadService.seedDemoLeads(orgId);
      setLeads(demo);
    } catch (e) {
      console.error('Failed to seed demo data:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Add / Edit Lead Submission
  const handleLeadSubmit = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingLead) {
      await LeadService.updateLead(orgId, editingLead.id, leadData);
      setEditingLead(null);
    } else {
      await LeadService.createLead(leadData);
    }
  };

  // CSV Import Submission
  const handleCsvImport = async (newLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    await LeadService.importLeadsBatch(orgId, newLeads);
  };

  // Filtered & Sorted leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          l.city.toLowerCase().includes(q) ||
          (l.preferredLocation && l.preferredLocation.toLowerCase().includes(q)) ||
          (l.propertyName && l.propertyName.toLowerCase().includes(q))
      );
    }

    // Temperature filter
    if (temperatureFilter !== 'ALL') {
      result = result.filter((l) => l.temperature === temperatureFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((l) => l.status === statusFilter);
    }

    // City filter
    if (cityFilter !== 'ALL') {
      result = result.filter((l) => l.city === cityFilter);
    }

    // Source filter
    if (sourceFilter !== 'ALL') {
      result = result.filter((l) => l.source === sourceFilter);
    }

    // Sales Rep filter
    if (repFilter !== 'ALL') {
      result = result.filter((l) => l.assignedRepId === repFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.intentScore || 0) - (a.intentScore || 0);
        case 'budget_desc':
          return b.budget - a.budget;
        case 'budget_asc':
          return a.budget - b.budget;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [leads, searchTerm, temperatureFilter, statusFilter, cityFilter, sourceFilter, repFilter, sortBy]);

  // Paginated records
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage]);

  const uniqueCities = useMemo(() => {
    const set = new Set(leads.map((l) => l.city).filter(Boolean));
    return Array.from(set);
  }, [leads]);

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbound Leads Workspace</h1>
            <Badge variant="neutral" size="md">
              {leads.length} Leads
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full qualification pipeline, scoring matrix, and multi-tenant Firestore management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDemoData}
            isLoading={isSeeding}
            leftIcon={<Database className="w-3.5 h-3.5 text-slate-500" />}
          >
            Reset / Seed 25 Demo Leads
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatAnalyzerOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Analyze Raw Chat
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCsvModalOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Import CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingLead(null);
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-500 shadow-sm"
          >
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4">
            <Input
              placeholder="Search by prospect name, phone, email, project..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Temperature Filter */}
          <div className="lg:col-span-2">
            <select
              value={temperatureFilter}
              onChange={(e) => {
                setTemperatureFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Temperatures</option>
              <option value="HOT">🔥 HOT Leads (80+)</option>
              <option value="WARM">⚡ WARM Leads (50-79)</option>
              <option value="COLD">❄️ COLD Leads (&lt;50)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Pipeline Stages</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="SITE_VISIT">SITE_VISIT</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="BOOKED">BOOKED</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="lg:col-span-2">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="updated">Sort: Recent Activity</option>
              <option value="score">Sort: Highest Intent Score</option>
              <option value="budget_desc">Sort: Budget (High → Low)</option>
              <option value="budget_asc">Sort: Budget (Low → High)</option>
              <option value="name">Sort: Prospect Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading tenant leads from Firestore..." className="py-16" />
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-slate-400" />}
            title="No leads match your criteria"
            description="Try loosening your filters or search keywords, or add a new lead inquiry."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTemperatureFilter('ALL');
                  setStatusFilter('ALL');
                  setCityFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lead Name</th>
                  <th className="py-3 px-4">Phone & City</th>
                  <th className="py-3 px-4">Property Req.</th>
                  <th className="py-3 px-4">Budget (INR)</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Intent Score</th>
                  <th className="py-3 px-4">Temperature</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Rep</th>
                  <th className="py-3 px-4">Last Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setActiveLeadForWorkspace(lead)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-emerald-500 group-hover:text-emerald-700 transition-colors">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {lead.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{lead.source}</span>
                        </div>
                      </div>
                    </td>

                    {/* Phone & City */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 block">{lead.phone}</span>
                      <span className="text-[11px] text-slate-400">{lead.city}</span>
                    </td>

                    {/* Property */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">{lead.propertyType || '3BHK'}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                        {lead.preferredLocation || 'NCR'}
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatINR(lead.budget)}
                    </td>

                    {/* Timeline */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">
                        {lead.timelineDays ? `${lead.timelineDays}d` : '30d'}
                      </span>
                    </td>

                    {/* Intent Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900">
                          {lead.intentScore || 70}
                        </span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                    </td>

                    {/* Temperature */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getTemperatureBadgeClass(
                          lead.temperature
                        )}`}
                      >
                        {lead.temperature}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadgeClass(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    {/* Assigned Rep */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {lead.assignedRepName || 'Priya Singh'}
                    </td>

                    {/* Last Contact */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatRelativeTime(lead.lastContactAt || lead.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLeads.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Lead Creation/Edit Modal */}
      <LeadFormModal
        isOpen={isAddModalOpen || Boolean(editingLead)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLead(null);
        }}
        onSubmit={handleLeadSubmit}
        initialData={editingLead}
        organizationId={orgId}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={handleCsvImport}
        organizationId={orgId}
      />

      {/* Raw Chat / Transcript Analyzer Modal */}
      <ConversationAnalyzerModal
        isOpen={isChatAnalyzerOpen}
        onClose={() => setIsChatAnalyzerOpen(false)}
        onApplyResults={handleApplyChatToNewLead}
      />

      {/* Full Lead Workspace Drawer */}
      {activeLeadForWorkspace && (
        <LeadDetailWorkspace
          lead={activeLeadForWorkspace}
          organizationId={orgId}
          onClose={() => {
            setActiveLeadForWorkspace(null);
            if (onClearSelectedLead) onClearSelectedLead();
          }}
          onUpdateLead={(updated) => {
            setActiveLeadForWorkspace(updated);
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          }}
          onOpenEditModal={(l) => {
            setEditingLead(l);
            setIsAddModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
