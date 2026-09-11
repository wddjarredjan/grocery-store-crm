import React, { useState, useMemo } from 'react';
import {
  Mail,
  X,
  Send,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateWeeklySummaryData,
  generateWeeklySummaryHtml,
} from '../../services/emailService';

interface WeeklyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyEmailModal: React.FC<WeeklyEmailModalProps> = ({ isOpen, onClose }) => {
  const { sales, products, currentUser } = useApp();
  const [recipientEmail, setRecipientEmail] = useState(currentUser.email || 'store.manager@freshmart.com');
  const [scheduleDay, setScheduleDay] = useState('Monday 06:00 AM');
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const summary = useMemo(() => {
    return generateWeeklySummaryData(sales, products, recipientEmail);
  }, [sales, products, recipientEmail]);

  const emailHtml = useMemo(() => {
    return generateWeeklySummaryHtml(summary);
  }, [summary]);

  if (!isOpen) return null;

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(emailHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTestEmail = () => {
    setSending(true);
    setSendSuccess(false);

    // Simulate reliable transmission to email dispatch service (e.g. Resend / SendGrid API)
    setTimeout(() => {
      setSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 5000);
    }, 1000);
  };

  const handleOpenMailto = () => {
    const subject = encodeURIComponent(
      `FreshMart Weekly Grocery Performance Digest - ${summary.weekRange}`
    );
    const body = encodeURIComponent(
      `Weekly Grocery Performance Summary (${summary.weekRange}):\n\n` +
      `Gross Revenue: $${summary.totalRevenue.toFixed(2)} (+${summary.revenueGrowthPct}%)\n` +
      `Total Transactions: ${summary.totalTransactions}\n` +
      `Average Basket: $${summary.averageBasket.toFixed(2)}\n` +
      `Low Stock Items: ${summary.lowStockItemsCount} lines critical\n\n` +
      `Top Selling Products:\n` +
      summary.topSellingProducts.slice(0, 3).map((p, i) => `${i + 1}. ${p.name}: $${p.revenue.toFixed(2)} (${p.quantity} sold)`).join('\n') +
      `\n\nFull HTML report generated in FreshMart POS & ERP.`
    );
    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Automated Weekly Performance Email Digest</h3>
              <p className="text-xs text-slate-400">Proactive inventory reorder alerts & sales summary for leadership</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
          <div className="sm:col-span-5">
            <label className="block font-bold text-slate-700 mb-0.5">Manager / Recipient Email:</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-bold text-slate-700 mb-0.5">Automated Dispatch Schedule:</label>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md">
                <Clock className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-slate-800">{scheduleDay}</span>
            </div>
          </div>

          <div className="sm:col-span-3 flex justify-end gap-1.5">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                viewMode === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('html')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                viewMode === 'html'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Raw HTML
            </button>
          </div>
        </div>

        {/* Email Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 min-h-[300px]">
          {viewMode === 'preview' ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden max-w-2xl mx-auto">
              <iframe
                title="Email Preview"
                srcDoc={emailHtml}
                className="w-full h-[460px] border-none"
              />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleCopyHtml}
                className="absolute right-3 top-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'HTML Copied!' : 'Copy Template Code'}</span>
              </button>
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[460px] leading-relaxed">
                {emailHtml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 font-medium">
              Cron trigger active: automated weekly summary compiles every Sunday midnight.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {sendSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Digest dispatched!</span>
              </span>
            )}

            <button
              onClick={handleOpenMailto}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              title="Open draft in system email client"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Mail Client</span>
            </button>

            <button
              onClick={handleSendTestEmail}
              disabled={sending}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Send className={`w-3.5 h-3.5 ${sending ? 'animate-bounce' : ''}`} />
              <span>{sending ? 'Dispatching...' : 'Send Performance Summary'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
