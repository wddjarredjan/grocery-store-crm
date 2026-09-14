import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SystemHistory from './SystemHistory';

export const SettingsPage: React.FC = () => {
  const { } = useApp();
  const [storedPw, setStoredPw] = useState(() => {
    try {
      return localStorage.getItem('freshmart_app_lock_password_v1') || '0000';
    } catch {
      return '0000';
    }
  });

  const [currentInput, setCurrentInput] = useState('');
  const [newInput, setNewInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStoredPw(() => {
      try {
        return localStorage.getItem('freshmart_app_lock_password_v1') || '0000';
      } catch {
        return '0000';
      }
    });
  }, []);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (currentInput !== storedPw) {
      setMessage('Current password is incorrect.');
      setCurrentInput('');
      return;
    }
    if (!newInput) {
      setMessage('Enter a new password.');
      return;
    }
    if (newInput !== confirmInput) {
      setMessage('New passwords do not match.');
      return;
    }

    try {
      localStorage.setItem('freshmart_app_lock_password_v1', newInput);
      setStoredPw(newInput);
      setCurrentInput('');
      setNewInput('');
      setConfirmInput('');
      setMessage('Password updated.');
    } catch (e) {
      console.error(e);
      setMessage('Could not save password.');
    }
  };

  const handleResetToDefault = () => {
    setMessage(null);
    if (currentInput !== storedPw) {
      setMessage('Current password is incorrect.');
      setCurrentInput('');
      return;
    }
    try {
      localStorage.setItem('freshmart_app_lock_password_v1', '0000');
      setStoredPw('0000');
      setCurrentInput('');
      setNewInput('');
      setConfirmInput('');
      setMessage('Password reset to default (0000).');
    } catch (e) {
      console.error(e);
      setMessage('Could not reset password.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg">App Lock</h2>
          <p className="text-sm text-slate-500">Startup lock for the application. Default password is <strong>0000</strong>.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <form onSubmit={handleChangePassword} className="space-y-3 text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current App Lock Password</label>
            <input
              type="password"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          {message && <div className="text-xs text-center text-slate-600">{message}</div>}

          <div className="flex gap-2 pt-3">
            <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save Password</button>
            <button type="button" onClick={handleResetToDefault} className="py-2 px-4 bg-slate-200 rounded-xl font-bold">Reset to 0000</button>
          </div>
        </form>
      </div>

      {/* System History - visible to Admin/Owner only */}
      {/* useApp has hasRole, but we can check current user's role */}
      <div className="mt-6">
        {/* Only show system history to admin_owner */}
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        {/**/}
      </div>
      {/* Render SystemHistory only if admin_owner */}
      {(useApp().currentUser.role === 'admin_owner') && <SystemHistory />}
    </div>
  );
};

export default SettingsPage;
