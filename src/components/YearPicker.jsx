import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

const YearPicker = ({ 
  value, 
  onChange, 
  options,
  minYear = 2010, 
  maxYear = new Date().getFullYear() + 5,
  className = ""
}) => {
  let years = options;
  if (!years) {
    years = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer"
      >
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
        <FaChevronDown size={12} />
      </div>
    </div>
  );
};

export default YearPicker;
