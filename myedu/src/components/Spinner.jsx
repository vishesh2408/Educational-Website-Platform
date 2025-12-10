import React from 'react';

// Simple spinner component using Tailwind classes
export default function Spinner({ size = '4', className = '', ariaHidden = true }) {
  const sz = typeof size === 'string' ? size : String(size);
  return (
    <svg
      aria-hidden={ariaHidden}
      className={`animate-spin h-${sz} w-${sz} ${className}`}
      viewBox="0 0 24 24"
      role="img"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
