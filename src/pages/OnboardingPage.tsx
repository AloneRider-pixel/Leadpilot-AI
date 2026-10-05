import React, { useState } from 'react';
import { Building2, MapPin, Users, TrendingUp, IndianRupee, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { formatINR } from '../utils/formatters';

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'Real Estate Developer',
    primaryCity: 'Noida',
    companySize: '11-50 employees',
    salespeopleCount: 6,
    monthlyLeads: 250,
    avgPropertyValue: 14000000, // 1.4 Cr
  });

  const cityOptions = [
    { label: 'Noida / Greater Noida (UP)', value: 'Noida' },
    { label: 'Gurgaon / Gurugram (Haryana)', value: 'Gurgaon' },
    { label: 'Delhi NCR', value: 'Delhi' },
    { label: 'Bengaluru / Bangalore (Karnataka)', value: 'Bengaluru' },
    { label: 'Mumbai / MMR (Maharashtra)', value: 'Mumbai' },
    { label: 'Pune (Maharashtra)', value: 'Pune' },
    { label: 'Hyderabad (Telangana)', value: 'Hyderabad' },
    { label: 'Dehradun (Uttarakhand)', value: 'Dehradun' },
  ];

  const industryOptions = [
    { label: 'Residential Real Estate Developer', value: 'Residential Real Estate Developer' },
    { label: 'Luxury & Villa Projects', value: 'Luxury & Villa Projects' },
    { label: 'Commercial & Retail Developer', value: 'Commercial & Retail Developer' },
    { label: 'Channel Partner / Master Brokerage', value: 'Channel Partner / Master Brokerage' },
    { label: 'Integrated Townships & Plotted Developments', value: 'Integrated Townships' },
  ];

  const sizeOptions = [
    { label: '1 - 10 employees (Boutique)', value: '1-10 employees' },
    { label: '11 - 50 employees (Growth)', value: '11-50 employees' },
    { label: '51 - 200 employees (Scale)', value: '51-200 employees' },
    { label: '200+ employees (Enterprise)', value: '200+ employees' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Please provide your company or project name.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await completeOnboarding(formData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to initialize organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup Your Workspace • 2-Minute Onboarding</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Configure LeadPilot AI for Your Real Estate Business
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Welcome, {user?.displayName || user?.email}! Tell us about your sales operations to calibrate lead qualification thresholds and AI models.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-200 text-slate-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" /> Organization Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Company or Real Estate Brand Name"
                    required
                    placeholder="e.g. Apex Realty & Luxury Infrastructure"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div>
                  <Select
                    label="Real Estate Sector"
                    options={industryOptions}
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>

                <div>
                  <Select
                    label="Primary Operating City / Region"
                    options={cityOptions}
                    value={formData.primaryCity}
                    onChange={(e) => setFormData({ ...formData, primaryCity: e.target.value })}
                  />
                </div>

                <div>
                  <Select
                    label="Company Size"
                    options={sizeOptions}
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  />
                </div>

                <div>
                  <Input
                    label="Active Sales Representatives"
                    type="number"
                    min={1}
                    max={500}
                    value={formData.salespeopleCount}
                    onChange={(e) =>
                      setFormData({ ...formData, salespeopleCount: parseInt(e.target.value) || 1 })
                    }
                    leftIcon={<Users className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Sales Funnel Calibration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Typical Inbound Leads / Month"
                    type="number"
                    min={10}
                    max={50000}
                    value={formData.monthlyLeads}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyLeads: parseInt(e.target.value) || 50 })
                    }
                    helperText="From Meta Ads, Google Ads, Portals & WhatsApp"
                  />
                </div>

                <div>
                  <Input
                    label="Average Property Deal Value (INR)"
                    type="number"
                    step={100000}
                    min={1000000}
                    value={formData.avgPropertyValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        avgPropertyValue: parseInt(e.target.value) || 10000000,
                      })
                    }
                    helperText={`Calibrated to: ${formatINR(formData.avgPropertyValue)}`}
                    leftIcon={<IndianRupee className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <strong className="font-semibold">Tenant Isolation Guarantee:</strong> Your leads,
                recordings, phone numbers, and revenue records are partitioned under your dedicated
                organization container. Team members you invite will be scoped to your workspace.
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full justify-center shadow-lg shadow-emerald-700/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Launch LeadPilot AI Workspace
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
