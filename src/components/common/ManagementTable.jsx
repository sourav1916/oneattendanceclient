import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCog } from 'react-icons/fa';
import ActionMenu from '../ActionMenu';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function resolveRowKey(row, rowKey, index) {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (row && rowKey in row) return row[rowKey];
  return index;
}

export default function ManagementTable({
  rows = [],
  columns = [],
  rowKey = 'id',
  actions,
  getActions,
  activeId,
  onToggleAction,
  onRowClick,
  emptyState,
  className = '',
  tableClassName = '',
  containerClassName = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName = '',
  cellClassName = '',
  accent = 'slate',
  compact = false,
  showHeader = true,
  showActionsColumn = true,
  actionsHeader = <FaCog className="ml-auto h-4 w-4" />,
  actionsClassName = '',
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1024);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const allVisibleColumns = columns.filter((column) => column.visible !== false);

  const getResponsiveColumns = () => {
    let maxCols = allVisibleColumns.length;
    if (containerWidth < 340) maxCols = 1;
    else if (containerWidth < 480) maxCols = 2;
    else if (containerWidth < 640) maxCols = 3;
    else if (containerWidth < 768) maxCols = 4;
    else if (containerWidth < 1024) maxCols = 5;
    else if (containerWidth < 1280) maxCols = 6;
    
    return allVisibleColumns.slice(0, maxCols);
  };

  const visibleColumns = getResponsiveColumns();
  const densityClasses = compact ? 'px-3 py-3' : 'px-4 lg:px-6 py-4';
  const cardAccentMap = {
    slate: 'border-slate-200 shadow-slate-200/50',
    blue: 'border-blue-100 shadow-blue-100/50',
    green: 'border-green-100 shadow-green-100/50',
    emerald: 'border-emerald-100 shadow-emerald-100/50',
    indigo: 'border-indigo-100 shadow-indigo-100/50',
    violet: 'border-violet-100 shadow-violet-100/50',
    amber: 'border-amber-100 shadow-amber-100/50',
    rose: 'border-rose-100 shadow-rose-100/50',
  };
  const cardClass = cardAccentMap[accent] || cardAccentMap.slate;

  if (!rows.length) {
    return emptyState || null;
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className={joinClasses('overflow-hidden rounded-xl bg-white w-full', cardClass, containerClassName, className)}
    >
      <div className={joinClasses('overflow-x-hidden w-full', tableClassName)}>
        <table className="w-full text-left text-sm text-gray-700 table-fixed sm:table-auto">
          {showHeader && (
            <thead className={joinClasses('hidden sm:table-header-group bg-gradient-to-r from-gray-100 to-gray-200 text-xs uppercase text-gray-600', headerClassName)}>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className={joinClasses(densityClasses, 'font-semibold', column.headerClassName)}
                  >
                    {column.label}
                  </th>
                ))}
                {showActionsColumn && (actions || getActions) && (
                  <th className={joinClasses(densityClasses, 'w-12 pr-4 text-right', actionsClassName)}>
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>
          )}

          <tbody className={joinClasses('divide-y divide-gray-100', bodyClassName)}>
            {rows.map((row, index) => {
              const key = resolveRowKey(row, rowKey, index);
              const rowActions = typeof getActions === 'function' ? getActions(row, index) : actions;
              const rowId = `row-${String(key)}`;

              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                  className={joinClasses(
                    'align-middle transition-all duration-200',
                    onRowClick && 'cursor-pointer hover:bg-slate-50',
                    rowClassName
                  )}
                >
                  {visibleColumns.map((column) => {
                    const content = typeof column.render === 'function'
                      ? column.render(row, index)
                      : row?.[column.key];

                    return (
                      <td
                        key={column.key}
                        className={joinClasses(
                          densityClasses,
                          'truncate',
                          column.className,
                          cellClassName
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}

                  {showActionsColumn && (actions || getActions) && (
                    <td className="w-12 pr-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <ActionMenu
                        menuId={rowId}
                        activeId={activeId}
                        onToggle={onToggleAction}
                        actions={rowActions || []}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
