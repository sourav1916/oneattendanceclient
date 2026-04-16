import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaFileInvoiceDollar,
  FaCalculator,
  FaLayerGroup,
  FaChevronRight,
  FaInfoCircle,
} from 'react-icons/fa';
import usePermissionAccess from '../hooks/usePermissionAccess';
import SalaryManagement from './SalaryManagement';
import SalaryComponentsManagement from './SalaryComponentsManagement';
import SalaryPackageManagement from './SalaryPackageManagement';

const TAB_ORDER = ['salary', 'components', 'packages'];

const TAB_CONFIG = {
  salary: {
    label: 'Salary Management',
    shortLabel: 'Salary',
    description: 'Assign and manage employee salaries.',
    icon: FaFileInvoiceDollar,
    pageKey: 'salaryManagement',
    component: SalaryManagement,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  components: {
    label: 'Salary Components',
    shortLabel: 'Components',
    description: 'Define earnings, deductions, and contributions.',
    icon: FaCalculator,
    pageKey: 'salaryComponentsManagement',
    component: SalaryComponentsManagement,
    accent: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  packages: {
    label: 'Salary Packages',
    shortLabel: 'Packages',
    description: 'Bundle components into reusable salary packages.',
    icon: FaLayerGroup,
    pageKey: 'salaryPackageManagement',
    component: SalaryPackageManagement,
    accent: 'bg-violet-50 text-violet-700 border-violet-200',
  },
};

const normalizeTab = (tab) => {
  if (!tab) return 'salary';
  return TAB_ORDER.includes(tab) ? tab : 'salary';
};

function AccessDeniedState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FaInfoCircle size={20} />
      </div>
      <h2 className="text-lg font-bold text-slate-800">No salary tabs available</h2>
      <p className="mt-2 text-sm text-slate-500">
        Your current role does not have access to salary management, salary components, or salary packages.
      </p>
    </div>
  );
}

export default function SalaryManagementHub() {
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
  const fallbackTab = accessibleTabs[0]?.id || tabs[0]?.id || 'salary';
  const activeTab = tabs.find((tab) => tab.id === requestedTab && tab.access.allowed)?.id || fallbackTab;

  useEffect(() => {
    if (!tabs.length) return;

    const nextSearchParams = new URLSearchParams(location.search);
    if (activeTab) {
      nextSearchParams.set('tab', activeTab);
    }

    const nextSearch = nextSearchParams.toString();
    if (`?${nextSearch}` !== location.search) {
      navigate({ pathname: '/salary-management', search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
    }
  }, [activeTab, location.search, navigate, tabs.length]);

  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = currentTab?.component;
  const CurrentIcon = currentTab?.icon;

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    navigate(`/salary-management?tab=${tabId}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                <FaFileInvoiceDollar size={11} />
                Salary management
              </div>
              <h1 className="mt-3 text-2xl font-bold text-purple-600 md:text-3xl">
                Salary tools in one place
              </h1>
              <p className="mt-2 text-sm text-slate-500 md:text-base">
                Switch between employee salaries, salary components, and salary packages without leaving the page.
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
                      ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-300'
                      : disabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                        : 'border-purple-600 bg-white text-slate-600 hover:border-purple-600 hover:bg-purple-50 hover:text-purple-600'
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
