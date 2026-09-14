import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateSupabaseSqlMigration } from '../../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { supabaseConfig, updateSupabaseConfig, syncWithSupabase, products } = useApp();

  const [urlInput, setUrlInput] = useState(supabaseConfig.url || '');
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  // App Lock password state
  const [appLockPw, setAppLockPw] = useState(() => {
    try {
      return localStorage.getItem('freshmart_app_lock_password_v1') || '0000';
    } catch {
      return '0000';
    }
  });
  const [newAppLockPw, setNewAppLockPw] = useState('');
  const [confirmAppLockPw, setConfirmAppLockPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      alert('Please enter both your Supabase URL and Anon Key.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const res = await updateSupabaseConfig(urlInput.trim(), keyInput.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSqlMigration();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncData = async () => {
    setSyncing(true);
    const res = await syncWithSupabase();
    setSyncing(false);
    if (res.success) {
      alert(`Successfully synchronized ${res.count} products to Supabase!`);
    } else {
      alert(res.error || 'Failed to sync to Supabase.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Supabase Real-Time Database Connection</h3>
              <p className="text-xs text-slate-400">Connect cloud database for live multi-register inventory sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              supabaseConfig.isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {supabaseConfig.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-sm">
                {supabaseConfig.isConnected
                  ? 'Connected to Supabase Database'
                  : 'Standalone Local Storage Mode Active'}
              </div>
              <p className="text-[11px] mt-0.5 text-slate-500 leading-relaxed">
                {supabaseConfig.isConnected
                  ? 'All sales, real-time product stock deductions, and audit logs are synchronized live across connected grocery registers.'
                  : 'The app is fully functioning with offline local storage persistence. You can connect your live Supabase project below at any time.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave} className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Supabase Project URL:
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Supabase Public Anon Key (anon_key):
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing Connection...' : 'Save & Verify Connection'}</span>
              </button>

              {supabaseConfig.isConnected && (
                <button
                  type="button"
                  onClick={handleSyncData}
                  disabled={syncing}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Pushing...' : 'Push Local Catalog'}</span>
                </button>
              )}
            </div>
          </form>

          {/* SQL Schema Generator Accordion */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Supabase SQL Migration Script</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSql((prev) => !prev)}
                  className="text-[11px] text-slate-600 hover:underline"
                >
                  {showSql ? 'Hide SQL' : 'View SQL'}
                </button>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              If creating a fresh Supabase project, execute this SQL script in your Supabase Dashboard
              (SQL Editor) to create the tables (<code className="bg-slate-100 px-1 py-0.5 rounded">products</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">sales</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">sale_items</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">inventory_logs</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">app_users</code>) and enable real-time replication.
            </p>

            {showSql && (
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
                {generateSupabaseSqlMigration()}
              </pre>
            )}
          </div>

          
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
