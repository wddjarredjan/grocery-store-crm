import React from 'react';
import { useApp } from '../../context/AppContext';

const SystemHistory: React.FC = () => {
  const { history } = useApp();

  return (
    <div className="p-6">
      <h2 className="text-xl font-extrabold mb-4">Overall System History</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        {history.length === 0 ? (
          <div className="text-sm text-slate-500">No history yet.</div>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{h.action.replace(/_/g, ' ')}</div>
                  <div className="mt-1 text-xs text-slate-500">{h.entity} {h.entityId ? `• ${h.entityId}` : ''}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {h.actorName ? `${h.actorName} (${h.actorId})` : 'System'} — {new Date(h.timestamp).toLocaleString()}
                  </div>
                  {h.details && (
                    <pre className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">{typeof h.details === 'string' ? h.details : JSON.stringify(h.details)}</pre>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SystemHistory;
