import React from 'react';

export default function ManagementGrid({ viewMode, children, className = '' }) {
  const visible = viewMode === 'card' ? 'grid' : 'hidden';
  return (
    <div
      className={`${visible} grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 ${className}`
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
