import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaUmbrellaBeach,
  FaClipboardList,
  FaChartLine,
  FaInfoCircle,
  FaChevronRight,
} from 'react-icons/fa';
import usePermissionAccess from '../hooks/usePermissionAccess';
import LeaveManagement from './LeaveManagement';
import LeaveConfigManagement from './LeaveConfigManagement';
import LeaveBalanceManagement from './LeaveBalanceManagement';

const TAB_ORDER = ['requests', 'config', 'balance'];

const TAB_CONFIG = {
  requests: {
    label: 'Leave Requests',
    shortLabel: 'Requests',
    description: 'Review employee leave applications and approvals.',
    icon: FaUmbrellaBeach,
    pageKey: 'leaveManagement',
    component: LeaveManagement,
    accent: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  config: {
    label: 'Leave Config',
    shortLabel: 'Config',
    description: 'Manage leave types, rules, and accrual settings.',
    icon: FaClipboardList,
    pageKey: 'leaveConfig',
    component: LeaveConfigManagement,
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  balance: {
    label: 'Leave Balance',
    shortLabel: 'Balance',
    description: 'Assign and review employee leave balances.',
    icon: FaChartLine,
    pageKey: 'leaveBalance',
    component: LeaveBalanceManagement,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const normalizeTab = (tab) => {
  if (!tab) return 'requests';
  return TAB_ORDER.includes(tab) ? tab : 'requests';
};

function AccessDeniedState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FaInfoCircle size={20} />
      </div>
      <h2 className="text-lg font-bold text-slate-800">No leave tabs available</h2>
      <p className="mt-2 text-sm text-slate-500">
        Your current role does not have access to leave requests, leave configuration, or leave balances.
      </p>
    </div>
  );
}

export default function LeaveManagementHub() {
  const { checkPageAccess } = usePermissionAccess();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedTab = normalizeTab(searchParams.get('tab'));

  const tabs = useMemo(
    () =>
      TAB_ORDER.map((tabId) => {
        const config = TAB_CONFIG[tabId];
        const access = checkPageAccess(config.pageKey);
        return {
          id: tabId,
          ...config,
          access,
        };
      }),
    [checkPageAccess]
  );

  const accessibleTabs = tabs.filter((tab) => tab.access.allowed);
  const fallbackTab = accessibleTabs[0]?.id || tabs[0]?.id || 'requests';
  const activeTab = tabs.find((tab) => tab.id === requestedTab && tab.access.allowed)?.id || fallbackTab;

  useEffect(() => {
    if (!tabs.length) return;

    const nextSearchParams = new URLSearchParams(location.search);
    if (activeTab) {
      nextSearchParams.set('tab', activeTab);
    }

    const nextSearch = nextSearchParams.toString();
    if (`?${nextSearch}` !== location.search) {
      navigate({ pathname: '/leave-management', search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
    }
  }, [activeTab, location.pathname, location.search, navigate, tabs.length]);

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = currentTab?.component;
  const CurrentIcon = currentTab?.icon;

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    navigate(`/leave-management?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
                <FaUmbrellaBeach size={11} />
                Leave management
              </div>
              <h1 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                All leave tools in one place
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Switch between leave requests, leave setup, and balance allocation without leaving this screen.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${currentTab?.accent || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {CurrentIcon && <CurrentIcon size={12} />}
                {currentTab?.label}
              </span>
              <FaChevronRight className="text-slate-300" size={12} />
              <span className="text-xs text-slate-500">{currentTab?.description}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              const disabled = !tab.access.allowed;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  disabled={disabled}
                  title={disabled ? 'You do not have access to this section' : tab.description}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-300'
                      : disabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {ActiveComponent ? <ActiveComponent /> : <AccessDeniedState />}
      </div>
    </div>
  );
}
