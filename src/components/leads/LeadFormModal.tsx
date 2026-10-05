import React, { useState, useEffect } from 'react';
import { Lead, LeadPurpose, LeadSource, LeadStatus, LeadTemperature } from '../../types/lead';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { DEMO_SALES_REPS } from '../../data/demoLeads';
import { formatINR } from '../../utils/formatters';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Lead | null;
  organizationId: string;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  organizationId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Noida',
    preferredLocation: '',
    propertyType: '3BHK',
    bedrooms: '3 BHK',
    budgetCrores: '1.4', // string input in Crores or Lakhs
    timelineDays: 30,
    financingReadiness: 'Pre-approved Loan',
    purpose: 'SELF_USE' as LeadPurpose,
    source: 'Meta Ads' as LeadSource,
    status: 'NEW' as LeadStatus,
    assignedRepId: 'rep-priya',
    assignedRepName: 'Priya Singh',
    propertyName: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      const budgetInCr = (initialData.budget / 10000000).toFixed(2);
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        city: initialData.city || 'Noida',
        preferredLocation: initialData.preferredLocation || '',
        propertyType: initialData.propertyType || '3BHK',
        bedrooms: initialData.bedrooms || '3 BHK',
        budgetCrores: budgetInCr,
        timelineDays: initialData.timelineDays || 30,
        financingReadiness: initialData.financingReadiness || 'Pre-approved Loan',
        purpose: initialData.purpose || 'SELF_USE',
        source: initialData.source || 'Meta Ads',
        status: initialData.status || 'NEW',
        assignedRepId: initialData.assignedRepId || 'rep-priya',
        assignedRepName: initialData.assignedRepName || 'Priya Singh',
        propertyName: initialData.propertyName || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: 'Noida',
        preferredLocation: '',
        propertyType: '3BHK',
        bedrooms: '3 BHK',
        budgetCrores: '1.4',
        timelineDays: 30,
        financingReadiness: 'Pre-approved Loan',
        purpose: 'SELF_USE',
        source: 'Meta Ads',
        status: 'NEW',
        assignedRepId: 'rep-priya',
        assignedRepName: 'Priya Singh',
        propertyName: '',
        notes: '',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  // Transparent Lead Scoring Calculation (Section 10)
  const calculateInitialScore = (data: typeof formData): { score: number; temp: LeadTemperature } => {
    let timelineScore = 10;
    if (data.timelineDays <= 30) timelineScore = 20;
    else if (data.timelineDays <= 60) timelineScore = 15;
    else if (data.timelineDays <= 90) timelineScore = 10;
    else timelineScore = 5;

    const budgetVal = parseFloat(data.budgetCrores) || 0;
    const budgetScore = budgetVal > 0 ? 15 : 5;

    const reqScore = data.propertyType && data.city ? 14 : 7;
    const engagementScore = data.phone ? 13 : 5;

    let siteVisitScore = 10;
    if (data.status === 'SITE_VISIT' || data.status === 'QUALIFIED') siteVisitScore = 20;
    else if (data.status === 'INTERESTED') siteVisitScore = 15;

    let financeScore = 10;
    if (data.financingReadiness.includes('Pre-approved') || data.financingReadiness.includes('Cash')) {
      financeScore = 15;
    } else if (data.financingReadiness.includes('Loan Required')) {
      financeScore = 10;
    } else {
      financeScore = 5;
    }

    const total = Math.min(100, timelineScore + budgetScore + reqScore + engagementScore + siteVisitScore + financeScore);
    const temp: LeadTemperature = total >= 80 ? 'HOT' : total >= 50 ? 'WARM' : 'COLD';
    return { score: total, temp };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide buyer full name.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please enter contact phone number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const budgetInINR = Math.round((parseFloat(formData.budgetCrores) || 1.4) * 10000000);
      const rep = DEMO_SALES_REPS.find((r) => r.id === formData.assignedRepId) || DEMO_SALES_REPS[0];
      const { score, temp } = calculateInitialScore(formData);

      await onSubmit({
        organizationId,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        city: formData.city,
        preferredLocation: formData.preferredLocation.trim() || undefined,
        propertyType: formData.propertyType,
        bedrooms: formData.bedrooms,
        budget: budgetInINR,
        timelineDays: Number(formData.timelineDays) || 30,
        financingReadiness: formData.financingReadiness,
        purpose: formData.purpose,
        source: formData.source,
        status: formData.status,
        temperature: temp,
        intentScore: score,
        assignedRepId: rep.id,
        assignedRepName: rep.name,
        propertyName: formData.propertyName.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        lastContactAt: new Date().toISOString(),
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save lead record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cityOptions = [
    { label: 'Noida', value: 'Noida' },
    { label: 'Gurgaon', value: 'Gurgaon' },
    { label: 'Delhi NCR', value: 'Delhi' },
    { label: 'Bengaluru', value: 'Bengaluru' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Pune', value: 'Pune' },
    { label: 'Hyderabad', value: 'Hyderabad' },
    { label: 'Dehradun', value: 'Dehradun' },
  ];

  const sourceOptions: { label: string; value: LeadSource }[] = [
    { label: 'Meta Ads (Facebook/Instagram)', value: 'Meta Ads' },
    { label: 'Google Ads (Search/PMax)', value: 'Google Ads' },
    { label: 'Website Inbound Form', value: 'Website' },
    { label: 'WhatsApp Official Chatbot', value: 'WhatsApp' },
    { label: 'Instagram DM', value: 'Instagram' },
    { label: 'Customer Referral', value: 'Referral' },
    { label: 'Direct Walk-in / Site Visitor', value: 'Walk-in' },
    { label: 'Manual Sales Outreach', value: 'Manual' },
  ];

  const statusOptions: { label: string; value: LeadStatus }[] = [
    { label: 'NEW (Uncontacted)', value: 'NEW' },
    { label: 'CONTACTED (First response sent)', value: 'CONTACTED' },
    { label: 'QUALIFIED (Intent & budget verified)', value: 'QUALIFIED' },
    { label: 'INTERESTED (Considering project)', value: 'INTERESTED' },
    { label: 'SITE_VISIT (Visit requested / scheduled)', value: 'SITE_VISIT' },
    { label: 'NEGOTIATION (Floor plan & pricing active)', value: 'NEGOTIATION' },
    { label: 'BOOKED (Token deposit paid)', value: 'BOOKED' },
    { label: 'WON (Builder-Buyer Agreement signed)', value: 'WON' },
    { label: 'LOST (Not interested / bought elsewhere)', value: 'LOST' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit Lead: ${initialData.name}` : 'Register New Inbound Lead'}
      description="Record buyer inquiry, calibrate budget in ₹ Crores, and assign sales representative"
      maxWidth="2xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Prospect Full Name"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Mobile Phone (WhatsApp Enabled)"
            required
            placeholder="e.g. +91 98112 34567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul.sharma@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Target City"
            options={cityOptions}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        {/* Property & Requirement Specifications */}
        <div className="border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Preferred Micro-Market / Sector"
                placeholder="e.g. Sector 150 / Expressway"
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
              />
            </div>

            <div>
              <Select
                label="Configuration"
                options={[
                  { label: '3 BHK Luxury Apartment', value: '3BHK' },
                  { label: '2 BHK Premium Apartment', value: '2BHK' },
                  { label: '4 BHK Independent Villa', value: '4BHK Villa' },
                  { label: 'Penthouse / Duplex', value: 'Penthouse' },
                  { label: 'Residential Plot / Land', value: 'Plot' },
                  { label: 'Commercial Retail Shop', value: 'Commercial Retail' },
                ]}
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Budget (in ₹ Crores)"
                type="number"
                step="0.05"
                min="0.1"
                placeholder="1.4"
                value={formData.budgetCrores}
                onChange={(e) => setFormData({ ...formData, budgetCrores: e.target.value })}
                helperText={`Equates to: ${formatINR((parseFloat(formData.budgetCrores) || 0) * 10000000)}`}
              />
            </div>
          </div>
        </div>

        {/* Buying Timeline, Financing & Purpose */}
        <div className="border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Select
                label="Purchase Timeline"
                options={[
                  { label: 'Immediate / 15 Days', value: '15' },
                  { label: 'Within 30 Days (Active)', value: '30' },
                  { label: 'Within 60 Days', value: '60' },
                  { label: 'Within 90 Days', value: '90' },
                  { label: '6+ Months (Planning)', value: '180' },
                ]}
                value={formData.timelineDays.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, timelineDays: parseInt(e.target.value) || 30 })
                }
              />
            </div>

            <div>
              <Select
                label="Financing Readiness"
                options={[
                  { label: 'Pre-approved Bank Loan (HDFC/ICICI/SBI)', value: 'Pre-approved Loan' },
                  { label: '100% Cash / Self-funded', value: 'Cash / Self-funded' },
                  { label: 'Home Loan Required', value: 'Loan Required' },
                  { label: 'Not Yet Initiated', value: 'Not initiated' },
                ]}
                value={formData.financingReadiness}
                onChange={(e) => setFormData({ ...formData, financingReadiness: e.target.value })}
              />
            </div>

            <div>
              <Select
                label="Purchase Purpose"
                options={[
                  { label: 'Self-Use (Primary Home)', value: 'SELF_USE' },
                  { label: 'Investment (Capital Appreciation)', value: 'INVESTMENT' },
                  { label: 'Rental Income / Yield', value: 'RENTAL_INCOME' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value as LeadPurpose })
                }
              />
            </div>
          </div>
        </div>

        {/* Source & Sales Assignment */}
        <div className="border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Select
                label="Lead Source Channel"
                options={sourceOptions}
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value as LeadSource })
                }
              />
            </div>

            <div>
              <Select
                label="Pipeline Stage Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as LeadStatus })
                }
              />
            </div>

            <div>
              <Select
                label="Assigned Sales Representative"
                options={DEMO_SALES_REPS.map((r) => ({
                  label: `${r.name}`,
                  value: r.id,
                }))}
                value={formData.assignedRepId}
                onChange={(e) => {
                  const rep = DEMO_SALES_REPS.find((r) => r.id === e.target.value);
                  setFormData({
                    ...formData,
                    assignedRepId: e.target.value,
                    assignedRepName: rep?.name || 'Priya Singh',
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Initial Inbound Notes / Specific Request
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Inquired about weekend site visit, wants corner unit facing park view."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Create & Score Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
