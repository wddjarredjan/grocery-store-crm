import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { POSRegister } from './components/pos/POSRegister';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { ReportsManager } from './components/reports/ReportsManager';
import { UserManagement } from './components/users/UserManagement';
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal';
import SettingsPage from './components/settings/SettingsPage';
import { WeeklyEmailModal } from './components/reports/WeeklyEmailModal';
import { ShieldAlert, KeyRound, ShoppingBag } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, hasRole, switchUserByPin, switchUserDirect, users, addUser } = useApp();
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [managerPinInput, setManagerPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(() => {
    try {
      const unlocked = sessionStorage.getItem('freshmart_app_unlocked_v1');
      return unlocked !== '1';
    } catch {
      return true;
    }
  });
  const [appLockInput, setAppLockInput] = useState('');
  const [appLockError, setAppLockError] = useState(false);
  const [isEmployeePinOpen, setIsEmployeePinOpen] = useState(false);
  const [employeePinInput, setEmployeePinInput] = useState('');
  const [employeePinError, setEmployeePinError] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isCreateAccountMode, setIsCreateAccountMode] = useState(true);
  const [createAccountForm, setCreateAccountForm] = useState({
    name: '',
    role: 'cashier' as UserRole,
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleManagerPinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchUserByPin(managerPinInput);
    if (success) {
      setPinError(false);
      setManagerPinInput('');
    } else {
      setPinError(true);
    }
  };

  const getStoredAppLock = () => {
    try {
      const pw = localStorage.getItem('freshmart_app_lock_password_v1');
      return pw ?? '0000';
    } catch {
      return '0000';
    }
  };

  const handleAppUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = getStoredAppLock();
    if (appLockInput === stored) {
      try {
        sessionStorage.setItem('freshmart_app_unlocked_v1', '1');
      } catch {}
      // unlock the UI, then immediately require an employee PIN to select the active user
      setIsAppLocked(false);
      setIsEmployeePinOpen(true);
      setAppLockError(false);
      setAppLockInput('');
    } else {
      setAppLockError(true);
      setAppLockInput('');
    }
  };

  const handleEmployeePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchUserByPin(employeePinInput);
    if (success) {
      setEmployeePinError(false);
      setEmployeePinInput('');
      setIsEmployeePinOpen(false);
    } else {
      setEmployeePinError(true);
      setEmployeePinInput('');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const enteredEmail = loginEmail.trim().toLowerCase();
    const enteredPassword = loginPassword.trim();

    const selectedUser = users.find(
      (user) => user.email.toLowerCase() === enteredEmail && user.password === enteredPassword
    );

    if (!selectedUser) {
      setLoginMessage({ type: 'error', text: 'Invalid email or password. Please try again.' });
      setLoginPassword('');
      return;
    }

    switchUserDirect(selectedUser);
    setSelectedUserId(selectedUser.id);
    setLoginMessage(null);
    setLoginEmail('');
    setLoginPassword('');
    setIsLoginOpen(false);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createAccountForm.name.trim() || !createAccountForm.email.trim() || !createAccountForm.phone.trim()) {
      setLoginMessage({ type: 'error', text: 'Please complete the full name, phone number, and email address.' });
      return;
    }

    if (!createAccountForm.password || createAccountForm.password.length < 6) {
      setLoginMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (createAccountForm.password !== createAccountForm.confirmPassword) {
      setLoginMessage({ type: 'error', text: 'Passwords do not match. Please re-enter them.' });
      return;
    }

    const normalizedEmail = createAccountForm.email.trim().toLowerCase();
    const emailExists = users.some((user) => user.email.toLowerCase() === normalizedEmail);
    if (emailExists) {
      setLoginMessage({ type: 'error', text: 'An account with this email already exists.' });
      return;
    }

    const generatedPin = createAccountForm.phone.replace(/\D/g, '').slice(-4) || '1234';
    const newUser = {
      name: createAccountForm.name.trim(),
      email: normalizedEmail,
      phone: createAccountForm.phone.trim(),
      password: createAccountForm.password,
      role: createAccountForm.role,
      pin: generatedPin.length === 4 ? generatedPin : '1234',
      isActive: true,
    };

    addUser(newUser);

    setCreateAccountForm({
      name: '',
      role: 'cashier',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setSelectedUserId('');
    setLoginEmail(normalizedEmail);
    setLoginPassword('');
    setIsCreateAccountMode(false);
    setLoginMessage({ type: 'success', text: 'Account created successfully. Please sign in to continue.' });
  };

  const selectedUser = users.find((user) => user.id === selectedUserId) || currentUser;

  const canAccessTab = (tab: typeof activeTab) => {
    switch (tab) {
      case 'analytics':
        return hasRole(['admin_owner', 'manager', 'purchasing']);
      case 'reports':
      case 'users':
        return hasRole(['admin_owner', 'manager']);
      default:
        return true;
    }
  };

  const isRestrictedTab = ['analytics', 'reports', 'users'].includes(activeTab);
  const canAccess = canAccessTab(activeTab);

  return (
    <div className="app-shell min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {isAppLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white">
              <h1 className="text-2xl font-black tracking-tight">App Lock</h1>
              <p className="mt-2 text-sm text-emerald-50/90">Enter the app unlock password to continue.</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleAppUnlock} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Password</label>
                  <input
                    type="password"
                    value={appLockInput}
                    onChange={(e) => setAppLockInput(e.target.value)}
                    placeholder="0000"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-mono text-lg"
                  />
                  {appLockError && (
                    <p className="mt-2 text-xs text-red-600">Incorrect password. Try again.</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-xs"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isEmployeePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white">
              <h1 className="text-2xl font-black tracking-tight">Enter your Employee PIN</h1>
              <p className="mt-2 text-sm text-emerald-50/90">Please enter your 4-digit employee PIN to continue.</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleEmployeePinSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Employee PIN</label>
                  <input
                    type="password"
                    value={employeePinInput}
                    onChange={(e) => setEmployeePinInput(e.target.value)}
                    placeholder="1234"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-mono text-lg"
                  />
                  {employeePinError && (
                    <p className="mt-2 text-xs text-red-600">Invalid PIN. Try again.</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-xs"
                  >
                    Enter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // If user cancels selecting employee, lock app again
                      try {
                        sessionStorage.setItem('freshmart_app_unlocked_v1', '0');
                      } catch {}
                      setIsEmployeePinOpen(false);
                      setIsAppLocked(true);
                    }}
                    className="flex-1 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl shadow-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white">
              <div className="mb-6 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-50">
                FreshMart POS
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {isCreateAccountMode ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-3 max-w-md text-sm text-emerald-50/90">
                {isCreateAccountMode
                  ? 'Enter your details to create a new store account and start working securely.'
                  : 'Sign in to access your assigned store permissions and continue the shift securely.'}
              </p>
            </div>

            <div className="p-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {isCreateAccountMode ? 'New employee registration' : 'Employee sign in'}
                  </p>
                  {!isCreateAccountMode && (
                    <>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">{selectedUser.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{selectedUser.role.replace('_', ' ')}</p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccountMode((prev) => !prev);
                    setLoginMessage(null);
                  }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100"
                >
                  {isCreateAccountMode ? 'Already have an account?' : 'Create Account'}
                </button>
              </div>

              {isCreateAccountMode ? (
                <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={createAccountForm.name}
                      onChange={(e) => setCreateAccountForm({ ...createAccountForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      Position
                    </label>
                    <select
                      value={createAccountForm.role}
                      onChange={(e) => setCreateAccountForm({ ...createAccountForm, role: e.target.value as UserRole })}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="admin_owner">Admin / Owner</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="purchasing">Purchasing</option>
                      <option value="inventory">Inventory</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={createAccountForm.phone}
                      onChange={(e) => setCreateAccountForm({ ...createAccountForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="+63 912 345 6789"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={createAccountForm.email}
                      onChange={(e) => setCreateAccountForm({ ...createAccountForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="name@freshmart.com"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        Password
                      </label>
                      <input
                        type="password"
                        value={createAccountForm.password}
                        onChange={(e) => setCreateAccountForm({ ...createAccountForm, password: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="••••••"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        Re-enter Password
                      </label>
                      <input
                        type="password"
                        value={createAccountForm.confirmPassword}
                        onChange={(e) => setCreateAccountForm({ ...createAccountForm, confirmPassword: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Create Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@freshmart.com"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

{loginMessage && (
                      <div className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                        loginMessage.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {loginMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Sign In to POS
                  </button>
                </form>
              )}

              {!isCreateAccountMode && selectedUser && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                  <div className="font-bold uppercase tracking-[0.12em] text-slate-600">Account details</div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Full name</span>
                    <span className="font-semibold text-slate-800">{selectedUser.name}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span>Position</span>
                    <span className="font-semibold text-slate-800">{selectedUser.role.replace('_', ' ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <Navbar
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onOpenEmailModal={() => setIsEmailOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="app-content flex-1 pb-12">
        {isRestrictedTab && !canAccess ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Manager Authorization Required</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              This section contains sensitive store financials, profit margins, and employee credentials.
              Current user: <strong>{currentUser.name} ({currentUser.role})</strong>.
            </p>

            <form onSubmit={handleManagerPinUnlock} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Enter Manager 4-Digit PIN (Elena: 3333):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPinInput}
                  onChange={(e) => setManagerPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-[1em] text-xl font-mono py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                {pinError && (
                  <p className="text-xs text-red-600 mt-1 font-semibold">
                    Invalid manager PIN. Try: 3333 (Elena Vance)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Return to Register
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Authorize</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && <POSRegister />}
            {activeTab === 'inventory' && <InventoryManagement />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'reports' && <ReportsManager />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'settings' && <SettingsPage />}
          </>
        )}
      </main>

      {/* Supabase Database Connection Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />

      {/* Automated Weekly Performance Summary Email Modal */}
      <WeeklyEmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
