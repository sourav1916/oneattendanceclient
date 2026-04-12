import React from 'react';
import { FaTh, FaListUl } from 'react-icons/fa';

const accentMap = {
  blue: {
    active: 'bg-blue-600 text-white shadow-md',
    inactive: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
  },
  amber: {
    active: 'bg-amber-600 text-white shadow-md',
    inactive: 'text-gray-600 hover:text-amber-600 hover:bg-amber-50',
  },
  green: {
    active: 'bg-green-600 text-white shadow-md',
    inactive: 'text-gray-600 hover:text-green-600 hover:bg-green-50',
  },
  violet: {
    active: 'bg-violet-600 text-white shadow-md',
    inactive: 'text-gray-600 hover:text-violet-600 hover:bg-violet-50',
  },
  slate: {
    active: 'bg-slate-700 text-white shadow-md',
    inactive: 'text-gray-600 hover:text-slate-700 hover:bg-slate-50',
  },
};

const iconByView = {
  table: FaListUl,
  card: FaTh,
};

export default function ManagementViewSwitcher({
  viewMode,
  onChange,
  accent = 'blue',
  className = '',
}) {
  const colors = accentMap[accent] || accentMap.blue;

  const buttonClass = (mode) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      viewMode === mode ? colors.active : colors.inactive
    }`;

  const TableIcon = iconByView.table;
  const CardIcon = iconByView.card;

  return (
    <div className={`flex justify-end ${className}`.trim()}>
      <div className="inline-flex items-center gap-1 p-1">
        <button type="button" onClick={() => onChange('table')} className={buttonClass('table')}>
          <TableIcon size={14} />
        </button>
        <button type="button" onClick={() => onChange('card')} className={buttonClass('card')}>
          <CardIcon size={14} />
        </button>
      </div>
    </div>
  );
}
