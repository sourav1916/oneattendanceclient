import React from 'react';
import { motion } from 'framer-motion';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

const accentStyles = {
  slate: 'from-slate-600 to-slate-800 text-slate-700 border-slate-200',
  blue: 'from-blue-600 to-indigo-600 text-blue-700 border-blue-200',
  green: 'from-green-600 to-emerald-600 text-green-700 border-green-200',
  emerald: 'from-emerald-600 to-teal-600 text-emerald-700 border-emerald-200',
  indigo: 'from-indigo-600 to-violet-600 text-indigo-700 border-indigo-200',
  violet: 'from-violet-600 to-fuchsia-600 text-violet-700 border-violet-200',
  amber: 'from-amber-600 to-orange-600 text-amber-700 border-amber-200',
  rose: 'from-rose-600 to-red-600 text-rose-700 border-rose-200',
};

const activeButtonStyles = {
  slate: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-md',
  blue: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-300',
  green: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-300',
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-300',
  indigo: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-300',
  violet: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-300',
  amber: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-300',
  rose: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-300',
};

export default function ManagementHub({
  eyebrow,
  title,
  description,
  accent = 'slate',
  summary,
  tabs,
  activeTab,
  onTabChange,
  actions,
  children,
  className = '',
  contentClassName = '',
  widthClassName = 'max-w-7xl',
}) {
  const accentClass = accentStyles[accent] || accentStyles.slate;

  return (
    <div className={joinClasses('min-h-screen', className)}>
      <div className={joinClasses('mx-auto', widthClassName)}>
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-2 rounded-[10px] sm: m-[10px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow && (
                <div className={joinClasses(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]',
                  accentClass
                )}>
                  {eyebrow}
                </div>
              )}
              {title && <h1 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>}
              {description && <p className="mt-2 text-sm text-slate-500 md:text-base">{description}</p>}
            </div>

            {(summary || actions) && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {summary}
                {actions}
              </div>
            )}
          </div>

          {tabs?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                const disabled = tab.disabled || false;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => !disabled && onTabChange && onTabChange(tab.id)}
                    disabled={disabled}
                    title={tab.title || tab.description || tab.label}
                    className={joinClasses(
                      'inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? activeButtonStyles[accent] || activeButtonStyles.slate
                        : disabled
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {Icon && <Icon size={13} />}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className={`p-[10px] lg:p-2 ${contentClassName || ""}`}>{children}</div>
      </div>
    </div>
  );
}
