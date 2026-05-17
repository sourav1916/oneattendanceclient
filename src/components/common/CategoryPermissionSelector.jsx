import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheck, FaChevronRight, FaShieldAlt, FaInfoCircle, FaMinus
} from 'react-icons/fa';

// ─── Category color map ────────────────────────────────────────────────────────
const CAT_STYLES = {
  'Attendance': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', checkBg: 'bg-blue-600' },
  'OT Method': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200', checkBg: 'bg-amber-600' },
  'Report': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200', checkBg: 'bg-green-600' },
  'Export': { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-violet-200', checkBg: 'bg-violet-600' },
  'Leave': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200', checkBg: 'bg-rose-600' },
  'Leave Type': { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500', border: 'border-pink-200', checkBg: 'bg-pink-600' },
  'Salary': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200', checkBg: 'bg-teal-600' },
  'Bank': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200', checkBg: 'bg-indigo-600' },
  'Invite': { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500', border: 'border-cyan-200', checkBg: 'bg-cyan-600' },
  'Employee': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200', checkBg: 'bg-orange-600' },
  'Permission': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200', checkBg: 'bg-purple-600' },
  'Shift': { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200', checkBg: 'bg-sky-600' },
  'Company Manage': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', checkBg: 'bg-emerald-600' },
  'Holiday Manage': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200', checkBg: 'bg-fuchsia-600' },
};

const DEFAULT_STYLE = {
  bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400',
  border: 'border-slate-200', checkBg: 'bg-slate-600',
};

const getCatStyle = (cat) => CAT_STYLES[cat] || DEFAULT_STYLE;

// ─── Mini checkbox ─────────────────────────────────────────────────────────────
const MiniCheck = ({ state, checkBg }) => {
  const base = 'w-[14px] h-[14px] rounded flex-shrink-0 flex items-center justify-center border transition-all duration-150';
  if (state === 'all') return <div className={`${base} ${checkBg} border-transparent`}><FaCheck size={7} className="text-white" /></div>;
  if (state === 'some') return <div className={`${base} ${checkBg} border-transparent`}><FaMinus size={7} className="text-white" /></div>;
  return <div className={`${base} border-slate-300 bg-white`} />;
};

// ─── Category row ──────────────────────────────────────────────────────────────
const CategoryRow = React.memo(({ cat, perms, selectedIds, onToggleCat, onTogglePerm, isOpen, onToggleOpen, readOnly = false }) => {
  const style = getCatStyle(cat);

  const selectedCount = useMemo(
    () => perms.filter(p => selectedIds.has(p.id)).length,
    [perms, selectedIds]
  );

  const state = selectedCount === 0 ? 'none' : selectedCount === perms.length ? 'all' : 'some';

  const badgeCls = state === 'all'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : state === 'some'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-500 border-slate-200';

  const badgeLabel = state === 'all' ? 'All' : `${selectedCount}/${perms.length}`;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${isOpen ? 'border-slate-200 shadow-sm' : 'border-slate-100'}`}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none bg-white hover:bg-slate-50/70 transition-colors"
        onClick={onToggleOpen}
      >
        {/* Category checkbox — click stops propagation so it doesn't also toggle open */}
        {!readOnly && (
          <div
            onClick={e => { e.stopPropagation(); onToggleCat(cat, state); }}
            className="flex-shrink-0"
            title={state === 'all' ? 'Deselect all' : 'Select all'}
          >
            <MiniCheck state={state} checkBg={style.checkBg} />
          </div>
        )}

        {/* Dot */}
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />

        {/* Name */}
        <span className="flex-1 text-sm font-semibold text-slate-700">{cat}</span>

        {/* Badge */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeCls}`}>
          {badgeLabel}
        </span>

        {/* Chevron */}
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <FaChevronRight className="text-slate-400 text-sm" />
        </motion.div>
      </div>

      {/* Permissions grid */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="perms"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50/60 border-t border-slate-100">
              {perms.map(perm => {
                const isSelected = selectedIds.has(perm.id);
                return (
                  <div
                    key={perm.id}
                    onClick={!readOnly ? () => onTogglePerm(perm.id) : undefined}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-lg border transition-all duration-150 ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${isSelected
                        ? `${style.bg} ${style.border}`
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-white'
                      }`}
                  >
                    {!readOnly && (
                      <div className={`mt-0.5 w-[13px] h-[13px] rounded flex-shrink-0 flex items-center justify-center border transition-all duration-150 ${isSelected ? `${style.checkBg} border-transparent` : 'border-slate-300 bg-white'
                        }`}>
                        {isSelected && <FaCheck size={7} className="text-white" />}
                      </div>
                    )}
                    {/* Labels */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold leading-tight truncate ${isSelected ? style.text : 'text-slate-700'}`}>
                        {perm.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CategoryRow.displayName = 'CategoryRow';

// ─── Main CategoryPermissionSelector ──────────────────────────────────────────
/**
 * Props:
 *   allPermissions  — array from API: { id, code, name, action, category }[]
 *   selectedIds     — number[] (array of selected permission IDs)
 *   onChange        — (newIds: number[]) => void
 */
const CategoryPermissionSelector = ({ allPermissions = [], selectedIds = [], onChange, readOnly = false }) => {
  const [openCategories, setOpenCategories] = useState(new Set());

  // Build a Set for O(1) lookup
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Group permissions by category, preserving insertion order
  const grouped = useMemo(() => {
    const map = {};
    allPermissions.forEach(p => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [allPermissions]);

  const categories = Object.keys(grouped);

  // Stats
  const totalCount = allPermissions.length;
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const noneSelected = selectedCount === 0;

  // Toggle a single permission
  const handleTogglePerm = useCallback((permId) => {
    const next = new Set(selectedSet);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    onChange([...next]);
  }, [selectedSet, onChange]);

  // Toggle an entire category
  const handleToggleCat = useCallback((cat, currentState) => {
    const ids = grouped[cat].map(p => p.id);
    const next = new Set(selectedSet);
    if (currentState === 'all') {
      ids.forEach(id => next.delete(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    onChange([...next]);
  }, [grouped, selectedSet, onChange]);

  // Toggle open/close category
  const handleToggleOpen = useCallback((cat) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Select / clear all
  const handleSelectAll = () => onChange(allPermissions.map(p => p.id));
  const handleClearAll = () => onChange([]);

  // Expand / collapse all categories
  const handleExpandAll = () => setOpenCategories(new Set(categories));
  const handleCollapseAll = () => setOpenCategories(new Set());

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 p-3.5 bg-slate-50/50 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
          <FaShieldAlt size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            {readOnly ? 'Assigned permissions' : 'Assign permissions'}
            <span className={`px-2 py-0.5 rounded-lg text-sm font-bold border uppercase tracking-wider ${allSelected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : noneSelected
                  ? 'bg-slate-50 text-slate-500 border-slate-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
              {selectedCount} / {totalCount}
            </span>
          </h3>
          <p className="text-sm text-slate-400 font-medium">{categories.length} categories</p>
        </div>
        {/* Toolbar */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm px-2 py-1 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 border border-slate-200 font-bold transition-all"
              >
                All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm px-2 py-1 bg-white text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-200 font-bold transition-all"
              >
                None
              </button>
              <div className="w-px h-4 bg-slate-200" />
            </>
          )}
          <button
            type="button"
            onClick={handleExpandAll}
            className="text-sm px-2 py-1 bg-white text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-200 font-bold transition-all"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="text-sm px-2 py-1 bg-white text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-200 font-bold transition-all"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Category list */}
      <div className="p-2.5 space-y-1.5 max-h-[38vh] overflow-y-auto custom-scrollbar bg-white">
        {allPermissions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm italic">
            No permissions available
          </div>
        ) : (
          categories.map(cat => (
            <CategoryRow
              key={cat}
              cat={cat}
              perms={grouped[cat]}
              selectedIds={selectedSet}
              onToggleCat={handleToggleCat}
              onTogglePerm={handleTogglePerm}
              isOpen={openCategories.has(cat)}
              onToggleOpen={() => handleToggleOpen(cat)}
              readOnly={readOnly}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      {!readOnly && (
        <div className="px-3 py-2 bg-indigo-50/40 border-t border-indigo-100/60">
          <p className="text-[10.5px] text-indigo-700 flex items-start gap-1.5">
            <FaInfoCircle className="text-indigo-400 flex-shrink-0 mt-0.5" size={10} />
            Click a category checkbox to toggle all. Expand to pick individual permissions.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryPermissionSelector;
