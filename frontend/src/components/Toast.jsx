
import React from 'react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed right-4 top-4 z-50">
      <div
        role="status"
        aria-live="polite"
        className={`px-3 py-2 rounded shadow ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1">{toast.message}</div>
          {onClose && (
            <button aria-label="Dismiss" onClick={onClose} className="text-sm opacity-80 hover:opacity-100">×</button>
          )}
        </div>
      </div>
    </div>
  );
}
