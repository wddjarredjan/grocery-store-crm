import React, { useState } from 'react';
import {
  Users,
  Shield,
  KeyRound,
  Plus,
  Check,
  X,
  UserCheck,
  UserX,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [editingUserForm, setEditingUserForm] = useState({
    name: '',
    email: '',
    role: 'cashier' as UserRole,
  });

  const isOwner = currentUser.role === 'admin_owner';
  const canManageUsers = isOwner || currentUser.role === 'manager';

  const requestAdminOverride = (action: string) => {
    if (isOwner) return true;

    const adminOwner = users.find((user) => user.role === 'admin_owner');
    // If there is no configured Admin/Owner account, allow a Manager to confirm and proceed.
    if (!adminOwner) {
      if (currentUser.role === 'manager') {
        return window.confirm(`No Admin/Owner configured. Proceed to ${action} as Manager?`);
      }
      return false;
    }

    const adminPin = window.prompt(`Manager override required. Enter the Admin/Owner PIN to ${action}:`);
    if (!adminPin) return false;
    return adminPin.trim() === adminOwner.pin;
  };

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'cashier' as UserRole,
    pin: '',
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) {
      alert('You do not have permission to create employee accounts.');
      return;
    }

    if (!requestAdminOverride('create a new employee account')) {
      alert('Admin/Owner PIN verification failed. Only the Admin/Owner can approve this action.');
      return;
    }

    if (!newUserForm.name || !newUserForm.email || !newUserForm.pin) {
      alert('Please fill in all required fields.');
      return;
    }

    if (newUserForm.pin.length !== 4) {
      alert('PIN code must be exactly 4 digits.');
      return;
    }

    addUser({
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      pin: newUserForm.pin,
      isActive: true,
    });

    setIsAddModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      role: 'cashier',
      pin: '',
    });
  };

  const handleUpdatePin = (userId: string) => {
    if (!canManageUsers) {
      alert('You do not have permission to manage employee PINs.');
      return;
    }

    if (!requestAdminOverride('update a PIN')) {
      alert('Admin/Owner PIN verification failed. Only the Admin/Owner can approve this action.');
      return;
    }

    if (newPinValue.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    updateUser(userId, { pin: newPinValue });
    setEditingPinUserId(null);
    setNewPinValue('');
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditingUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleSaveUserEdit = (userId: string) => {
    if (!canManageUsers) {
      alert('You do not have permission to edit employee accounts.');
      return;
    }

    if (!requestAdminOverride('edit a user account')) {
      alert('Admin/Owner PIN verification failed. Editing requires Admin/Owner approval.');
      return;
    }

    if (!editingUserForm.name.trim() || !editingUserForm.email.trim()) {
      alert('Name and email are required.');
      return;
    }

    updateUser(userId, {
      name: editingUserForm.name.trim(),
      email: editingUserForm.email.trim(),
      role: editingUserForm.role,
    });

    setEditingUserId(null);
    setEditingUserForm({ name: '', email: '', role: 'cashier' });
  };

  const handleDeleteUser = (user: User) => {
    if (!canManageUsers) {
      alert('You do not have permission to delete employee accounts.');
      return;
    }

    if (user.id === currentUser.id) {
      alert('You cannot delete the currently active session user.');
      return;
    }

    if (!requestAdminOverride('delete a user account')) {
      alert('Admin/Owner PIN verification failed. Deletion requires Admin/Owner approval.');
      return;
    }

    const confirmed = window.confirm(`Delete ${user.name} from the system? This action cannot be undone.`);
    if (!confirmed) return;

    deleteUser(user.id);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin_owner':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Admin / Owner
          </span>
        );
      case 'manager':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            Store Manager
          </span>
        );
      case 'purchasing':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Purchasing
          </span>
        );
      case 'inventory':
      case 'inventory_clerk':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Inventory
          </span>
        );
      case 'cashier':
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Front Cashier
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            <span>Role-Based Access Control (RBAC) & Staff</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage employee access, configure cash register 4-digit PINs, and audit role permissions.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee Account</span>
          </button>
        )}
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Active Staff Directory</h3>
          <span className="text-xs text-slate-500">{users.length} configured staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">4-Digit PIN</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        {u.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span>{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          You
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>

                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                  <td className="py-3 px-4 text-center font-mono font-bold">
                    {editingPinUserId === u.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="password"
                          maxLength={4}
                          value={newPinValue}
                          onChange={(e) => setNewPinValue(e.target.value)}
                          placeholder="••••"
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold"
                        />
                        <button
                          onClick={() => handleUpdatePin(u.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPinUserId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPinUserId(u.id);
                          setNewPinValue(u.pin);
                        }}
                        className="text-slate-500 hover:text-slate-900 flex items-center gap-1 mx-auto bg-slate-100 px-2 py-0.5 rounded text-[11px]"
                        title="Click to reset PIN"
                      >
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>PIN: {u.pin}</span>
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {u.isActive ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[11px] inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-[11px] inline-flex items-center gap-1">
                        <UserX className="w-3 h-3" /> Suspended
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleStartEditUser(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>

                      <select
                        value={u.role}
                        onChange={(e) => {
                          if (!canManageUsers) {
                            alert('You do not have permission to update roles.');
                            return;
                          }

                          if (!requestAdminOverride('change a user role')) {
                            alert('Admin/Owner PIN verification failed. Role changes require Admin/Owner approval.');
                            return;
                          }

                          updateUser(u.id, { role: e.target.value as UserRole });
                        }}
                        className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="admin_owner">Admin / Owner</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="purchasing">Purchasing</option>
                        <option value="inventory">Inventory</option>
                        <option value="inventory_clerk">Inventory Clerk (legacy)</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-base text-slate-900">Grocery Store RBAC Permission Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-4">System Capability</th>
                <th className="py-2.5 px-4 text-center">Front Cashier</th>
                <th className="py-2.5 px-4 text-center">Inventory Clerk</th>
                <th className="py-2.5 px-4 text-center">Store Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { feature: 'POS Register & Fast Cart Checkout', cashier: true, inv: true, mgr: true },
                { feature: 'Barcode Scanner (Camera & Wedge)', cashier: true, inv: true, mgr: true },
                { feature: 'Thermal Receipt Printing & Holds', cashier: true, inv: true, mgr: true },
                { feature: 'Produce Scale Weighted Pricing', cashier: true, inv: true, mgr: true },
                { feature: 'Stock Adjustments & Restock POs', cashier: false, inv: true, mgr: true },
                { feature: 'Barcode Shelf Label Printing', cashier: false, inv: true, mgr: true },
                { feature: 'Sales Analytics & Revenue Charts', cashier: false, inv: false, mgr: true },
                { feature: 'PDF Manager Reports (Z-Reading & Audits)', cashier: false, inv: false, mgr: true },
                { feature: 'Employee Accounts & PIN Resets', cashier: false, inv: false, mgr: true },
                { feature: 'Supabase Live Database Setup', cashier: false, inv: false, mgr: true },
                { feature: 'Automated Weekly Email Digest', cashier: false, inv: false, mgr: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.cashier ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.inv ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.mgr ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUserId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 mb-4">Edit Employee Account</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUserForm.name}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUserForm.email}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editingUserForm.role}
                  onChange={(e) => setEditingUserForm({ ...editingUserForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="admin_owner">Admin / Owner</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier / Front Register</option>
                  <option value="purchasing">Purchasing / Reorder Specialist</option>
                  <option value="inventory">Inventory / Stock Supervisor</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveUserEdit(editingUserId)}
                  className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-extrabold text-base text-slate-900 mb-4">Add Employee Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. David Vance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="david.v@freshmart.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="admin_owner">Admin / Owner</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier / Front Register</option>
                  <option value="purchasing">Purchasing / Reorder Specialist</option>
                  <option value="inventory">Inventory / Stock Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4-Digit Quick PIN *</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newUserForm.pin}
                  onChange={(e) => setNewUserForm({ ...newUserForm, pin: e.target.value })}
                  placeholder="e.g. 4444"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-center tracking-widest text-base"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
