import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Lead, LeadStatus } from '../../types/lead';
import { ConversationAnalysisResult } from '../../../server/ai/analysisEngine';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Building,
  HelpCircle,
} from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface ConversationAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onApplyResults?: (results: ConversationAnalysisResult) => Promise<void>;
}

export const ConversationAnalyzerModal: React.FC<ConversationAnalyzerModalProps> = ({
  isOpen,
  onClose,
  lead,
  onApplyResults,
}) => {
  const [inputText, setInputText] = useState(
    lead?.notes ||
      'Customer: Hi, I saw your 3BHK project in Noida Sector 150. Is it still available? My budget is around 1.4 crore and I would like to visit this weekend.\nSales Rep: Namaste! Yes, we have select corner 3BHK inventory at Skyline Verde Sector 150. Would Saturday 11:30 AM work for your visit?\nCustomer: Saturday 11:30 AM works. Please send sample flat walkthrough video.'
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ConversationAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedReply, setCopiedReply] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please paste or write a conversation/call transcript to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputText,
          existingLeadContext: lead || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.result) {
        setAnalysisResult(data.result);
      } else {
        throw new Error('Analysis result was empty');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversation analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!analysisResult || !onApplyResults) return;
    setIsApplying(true);
    try {
      await onApplyResults(analysisResult);
      onClose();
    } catch (err) {
      console.error('Failed to apply analysis results:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const sampleHinglishChat = `Customer: Namaste, Sector 150 me 3BHK ready to move hai kya?
Sales Rep: Haanji sir, hamare paas Skyline Verde me 3BHK corner units available hain with OC. Budget kitna plan kiya hai aapne?
Customer: Budget 1.4 Cr tak stretch kar sakte hain. Bank loan pre-approved hai HDFC se. Is weekend visit kar sakte hain family ke sath?
Sales Rep: Bilkul sir! Saturday 11:30 AM slot book kar dun?
Customer: Haan, confirm kar dijiye.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Conversation & Transcript Analyzer"
      description="Paste WhatsApp chats, call transcripts, or sales notes in English, Hindi, or Hinglish"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Raw WhatsApp Thread / Sales Call Transcript:
            </label>
            <button
              type="button"
              onClick={() => setInputText(sampleHinglishChat)}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Load Hinglish Sample
            </button>
          </div>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste buyer conversation here in English, Hindi, or Hinglish..."
            className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-sm"
            >
              Extract Intelligence & Score
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {analysisResult && (
          <div className="border-t border-slate-200 pt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Top Score Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 text-white rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Intent Score</span>
                <div className="text-2xl font-black text-emerald-400">
                  {analysisResult.intentScore}/100
                </div>
                <span className="text-[10px] text-slate-300">{analysisResult.temperature} Lead</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Probability</span>
                <div className="text-2xl font-bold text-slate-900">
                  {analysisResult.buyingProbability}%
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Conversion Chance</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Urgency</span>
                <div className="text-xl font-bold text-slate-900">{analysisResult.urgency}</div>
                <span className="text-[10px] text-slate-500">Timeline factor</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Confidence</span>
                <div className="text-xl font-bold text-slate-900">
                  {Math.round(analysisResult.confidence * 100)}%
                </div>
                <span className="text-[10px] text-slate-500">Model certainty</span>
              </div>
            </div>

            {/* Extracted Requirements */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" /> Extracted Real Estate Requirements
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Detected Budget:</span>
                  <strong className="text-emerald-900">
                    {analysisResult.extractedRequirements.budget
                      ? formatINR(analysisResult.extractedRequirements.budget)
                      : analysisResult.extractedRequirements.budgetFormatted || 'Not stated'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Configuration:</span>
                  <strong className="text-emerald-900">
                    {analysisResult.extractedRequirements.propertyType ||
                      analysisResult.extractedRequirements.bedrooms ||
                      '3BHK'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Location:</span>
                  <strong className="text-emerald-900">
                    {analysisResult.extractedRequirements.preferredLocation ||
                      analysisResult.extractedRequirements.city ||
                      'NCR'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Decision Window:</span>
                  <strong className="text-emerald-900">
                    {analysisResult.extractedRequirements.timelineDays
                      ? `${analysisResult.extractedRequirements.timelineDays} days`
                      : 'Active'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-900 block">Recommended Sales Action:</span>
              <p className="text-slate-700">{analysisResult.recommendedAction}</p>
            </div>

            {/* WhatsApp Tailored Reply */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-600" /> Tailored WhatsApp Reply
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReply(analysisResult.recommendedReply)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedReply ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Message
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-800 bg-emerald-50/30 p-3 rounded-lg border border-slate-200 leading-relaxed font-sans">
                {analysisResult.recommendedReply}
              </p>
            </div>

            {/* Signals, Objections, Missing Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Buying Signals:
                </span>
                <ul className="space-y-1 text-slate-700">
                  {analysisResult.buyingSignals.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Objections / Hesitations:
                </span>
                <ul className="space-y-1 text-slate-700">
                  {analysisResult.objections.map((o, i) => (
                    <li key={i}>• {o}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 5-Step Follow-Up Cadence */}
            {analysisResult.followUpSequence && analysisResult.followUpSequence.length > 0 && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Generated Follow-Up Cadence Sequence:
                </span>
                <div className="space-y-2">
                  {analysisResult.followUpSequence.map((f, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                        <span>
                          {f.cadence} ({f.scheduledTime})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{f.channel}</span>
                      </div>
                      <p className="text-slate-600 italic text-[11px]">"{f.messageText}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {analysisResult && onApplyResults && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              isLoading={isApplying}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 shadow-sm"
            >
              Apply Extracted Intelligence to Lead
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
