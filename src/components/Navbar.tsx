import React, { useState, useEffect } from 'react';
import {
  Store,
  ShoppingCart,
  Boxes,
  BarChart3,
  FileText,
  Users,
  Database,
  Bell,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  KeyRound,
  Mail,
  Menu,
  Volume2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';

interface NavbarProps {
  onOpenSupabaseModal: () => void;
  onOpenEmailModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSupabaseModal, onOpenEmailModal }) => {
  const {
    currentUser,
    users,
    switchUserDirect,
    switchUserByPin,
    hasRole,
    alerts,
    unreadAlertsCount,
    markAlertAsRead,
    clearAllAlerts,
    requestNotificationPermission,
    supabaseConfig,
    activeTab,
    setActiveTab,
    activeShift,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'nav-pos', tab: 'pos' as const, label: 'POS Register', icon: ShoppingCart },
    { id: 'nav-inventory', tab: 'inventory' as const, label: 'Inventory', icon: Boxes },
    ...(hasRole(['admin_owner', 'manager', 'purchasing'])
      ? [{ id: 'nav-analytics', tab: 'analytics' as const, label: 'Analytics', icon: BarChart3 }]
      : []),
    ...(hasRole(['admin_owner', 'manager'])
      ? [
          { id: 'nav-reports', tab: 'reports' as const, label: 'PDF Reports', icon: FileText },
          { id: 'nav-users', tab: 'users' as const, label: 'Employees', icon: Users },
        ]
      : []),
  ];

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchUserByPin(pinInput);
    if (success) {
      setPinInput('');
      setPinError(false);
      setShowPinModal(false);
      setShowUserMenu(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin_owner':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Admin / Owner
          </span>
        );
      case 'manager':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Manager
          </span>
        );
      case 'purchasing':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Purchasing
          </span>
        );
      case 'inventory':
      case 'inventory_clerk':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Inventory
          </span>
        );
      case 'cashier':
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Cashier
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-slate-950/85 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-black tracking-tight text-white">FreshMart</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                  POS & ERP
                </span>
              </div>
              <div className="hidden text-[11px] text-slate-400 sm:block">
                Lane 01 • Shift #{activeShift.id.slice(-4)}
              </div>
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-1.5 shadow-inner shadow-slate-950/30">
              {navItems.map(({ id, tab, label, icon: Icon }) => (
                <button
                  key={id}
                  id={id}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowAlertsDropdown(false);
                    setShowUserMenu(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-600/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden xl:flex items-center rounded-xl border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-300">
              {currentTime}
            </div>

            {hasRole(['admin_owner', 'manager']) && (
              <button
                id="btn-email-summary"
                onClick={onOpenEmailModal}
                title="Weekly Performance Email Digest"
                className="hidden rounded-xl border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-white sm:inline-flex"
              >
                <Mail className="h-4 w-4" />
              </button>
            )}

            <button
              id="btn-supabase-status"
              onClick={onOpenSupabaseModal}
              title={
                supabaseConfig.isConnected
                  ? 'Connected to Supabase Real-Time DB'
                  : 'Supabase Offline / Standalone Mode (Click to Connect)'
              }
              className={`hidden items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:inline-flex ${
                supabaseConfig.isConnected
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:text-white'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>{supabaseConfig.isConnected ? 'Live' : 'Config'}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
            </button>

            <div className="relative">
              <button
                id="btn-alerts-bell"
                onClick={() => {
                  setShowAlertsDropdown((prev) => !prev);
                  setShowUserMenu(false);
                }}
                className="relative rounded-xl border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                title="Low Stock Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                    {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                  </span>
                )}
              </button>

              {showAlertsDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-[88vw] max-w-[28rem] rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-bold">Low-Stock Alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => requestNotificationPermission()}
                        className="text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        Enable Push
                      </button>
                      {alerts.length > 0 && (
                        <button
                          onClick={clearAllAlerts}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                        All inventory levels are healthy!
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-start justify-between gap-2 p-3 text-xs transition-colors hover:bg-slate-50 ${
                            !alert.isRead ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1 font-semibold text-slate-900">
                              <span>{alert.productName}</span>
                              {!alert.isRead && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Current Stock: <strong className="text-red-600">{alert.currentStock} {alert.unit}</strong> (Min: {alert.minThreshold} {alert.unit})
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400">
                              {new Date(alert.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              markAlertAsRead(alert.id);
                              setActiveTab('inventory');
                              setShowAlertsDropdown(false);
                            }}
                            className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            Restock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                id="btn-user-switcher"
                onClick={() => {
                  setShowUserMenu((prev) => !prev);
                  setShowAlertsDropdown(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-left transition-colors hover:border-slate-500"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-xs font-black text-emerald-300">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold leading-none text-white">{currentUser.name}</div>
                  <div className="mt-0.5 text-[10px] capitalize text-slate-400">{currentUser.role.replace('_', ' ')}</div>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <div className="text-[11px] text-slate-500">Active Shift Staff</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{currentUser.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(currentUser.role)}
                      <span className="text-[11px] text-slate-500">{currentUser.email}</span>
                    </div>
                  </div>

                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Quick Switch Account
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUserDirect(u);
                          setShowUserMenu(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50 ${
                          u.id === currentUser.id ? 'bg-slate-100 font-bold' : ''
                        }`}
                      >
                        <div>
                          <div className="text-slate-900">{u.name}</div>
                          <div className="text-[10px] capitalize text-slate-500">{u.role.replace('_', ' ')}</div>
                        </div>
                        {u.id === currentUser.id && (
                          <span className="text-[11px] font-semibold text-emerald-600">Active</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-slate-100 p-2">
                    <button
                      onClick={() => {
                        setShowPinModal(true);
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Switch via 4-Digit PIN</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex rounded-xl border border-slate-700 bg-slate-900/70 p-2 text-slate-300 transition-colors hover:border-slate-500 hover:text-white lg:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-800 bg-slate-950/95 pb-3 pt-2 lg:hidden">
            <div className="grid gap-2">
              {navItems.map(({ id, tab, label, icon: Icon }) => (
                <button
                  key={id}
                  id={id}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                    setShowAlertsDropdown(false);
                    setShowUserMenu(false);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {activeTab === tab && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={onOpenSupabaseModal}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
              >
                <Database className="h-3.5 w-3.5" />
                {supabaseConfig.isConnected ? 'Live DB' : 'Setup DB'}
              </button>
              {hasRole(['admin_owner', 'manager']) && (
                <button
                  onClick={onOpenEmailModal}
                  className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 p-2.5 text-slate-200"
                >
                  <Mail className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold">Cashier Handover PIN</h3>
              <p className="mt-1 text-xs text-slate-500">
                Enter employee 4-digit PIN (Try: Sofia 1234, Marco 1111, Alex 2222, Elena 3333)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-center text-2xl font-mono tracking-[1em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {pinError && (
                  <p className="mt-1.5 text-center text-xs font-medium text-red-600">
                    Invalid PIN code. Please try again.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  Unlock Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
