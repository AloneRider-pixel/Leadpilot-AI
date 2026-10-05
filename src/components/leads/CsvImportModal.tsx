import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Lead, LeadSource, LeadStatus, LeadTemperature } from '../../types/lead';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  organizationId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  organizationId,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const sampleCsv = `Name,Phone,City,Property,BudgetInCrores,TimelineDays,Source
Amit Saxena,+91 98110 55443,Noida,3BHK,1.5,30,Meta Ads
Kavita Nanda,+91 98200 44332,Gurgaon,4BHK Villa,2.75,45,Google Ads
Naveen Reddy,+91 98490 11229,Hyderabad,3BHK,1.8,60,Website
Sanjay Joshi,+91 97654 99881,Pune,2BHK,0.95,30,WhatsApp
Meera Iyer,+91 99800 44331,Bengaluru,3BHK,2.1,15,Instagram`;

  const handleLoadSample = () => {
    setCsvContent(sampleCsv);
    parseCsv(sampleCsv);
  };

  const parseCsv = (text: string) => {
    setValidationErrors([]);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setValidationErrors(['CSV must have a header row and at least one data row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((h, index) => {
        rowData[h] = cols[index] || '';
      });

      const name = rowData['name'] || cols[0];
      const phone = rowData['phone'] || cols[1];
      const city = rowData['city'] || cols[2] || 'Noida';
      const property = rowData['property'] || rowData['propertytype'] || cols[3] || '3BHK';
      const budgetCr = parseFloat(rowData['budgetincrores'] || rowData['budget'] || cols[4]) || 1.4;
      const timeline = parseInt(rowData['timelinedays'] || rowData['timeline'] || cols[5]) || 30;
      const source = (rowData['source'] || cols[6] || 'Meta Ads') as LeadSource;

      if (!name) {
        errors.push(`Row ${i + 1}: Missing prospect name.`);
        continue;
      }
      if (!phone) {
        errors.push(`Row ${i + 1}: Missing contact phone number.`);
        continue;
      }

      const budgetInINR = Math.round(budgetCr * 10000000);
      const score = timeline <= 30 ? 88 : timeline <= 60 ? 74 : 60;
      const temp: LeadTemperature = score >= 80 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD';

      leads.push({
        organizationId,
        name,
        phone,
        city,
        propertyType: property,
        bedrooms: property.includes('BHK') ? property : '3 BHK',
        budget: budgetInINR,
        timelineDays: timeline,
        financingReadiness: 'Pre-approved Loan',
        purpose: 'SELF_USE',
        source,
        status: 'NEW' as LeadStatus,
        temperature: temp,
        intentScore: score,
        assignedRepId: 'rep-priya',
        assignedRepName: 'Priya Singh',
        notes: `Imported via CSV batch on ${new Date().toLocaleDateString('en-IN')}`,
        lastContactAt: new Date().toISOString(),
      });
    }

    setValidationErrors(errors);
    setParsedRows(leads);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    try {
      await onImport(parsedRows);
      onClose();
    } catch (e: unknown) {
      setValidationErrors([e instanceof Error ? e.message : 'Import failed']);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Leads from CSV / Spreadsheets"
      description="Upload or paste structured lead lists from Meta Ads, Google Ads, or Brokerage Portals"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Upload / Paste Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Choose CSV File</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
            <Button variant="ghost" size="sm" onClick={handleLoadSample} leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Load Sample Data
            </Button>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Format: Name, Phone, City, Property, BudgetInCrores, TimelineDays, Source
          </span>
        </div>

        {/* Raw Text Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Or Paste CSV / Tab-Delimited Data Below:
          </label>
          <textarea
            rows={5}
            value={csvContent}
            onChange={(e) => {
              setCsvContent(e.target.value);
              parseCsv(e.target.value);
            }}
            placeholder="Name,Phone,City,Property,BudgetInCrores,TimelineDays,Source&#10;Rajesh Patel,+91 98111 22334,Noida,3BHK,1.4,30,Meta Ads"
            className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Validation Notices:
            </div>
            {validationErrors.map((err, idx) => (
              <div key={idx}>• {err}</div>
            ))}
          </div>
        )}

        {/* Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Valid Leads Ready to Import ({parsedRows.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Auto-assigned to Priya Singh • Scored by LeadPilot Engine
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">City</th>
                    <th className="p-2">Property</th>
                    <th className="p-2">Budget</th>
                    <th className="p-2">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {parsedRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-900">{r.name}</td>
                      <td className="p-2 font-mono text-slate-600">{r.phone}</td>
                      <td className="p-2 text-slate-600">{r.city}</td>
                      <td className="p-2 text-slate-600">{r.propertyType}</td>
                      <td className="p-2 font-semibold text-emerald-700">{formatINR(r.budget)}</td>
                      <td className="p-2 text-slate-500">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0}
            isLoading={isImporting}
          >
            Import {parsedRows.length} Leads
          </Button>
        </div>
      </div>
    </Modal>
  );
};
