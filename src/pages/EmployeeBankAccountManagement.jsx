import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaSearch, FaTimes, FaCheck,
  FaUser, FaSpinner,
  FaUniversity, FaStar, FaPlus,
  FaMoneyBillWave, FaChartBar, FaEye, FaQrcode, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import { ManagementHub, ManagementTable, ManagementButton } from '../components/common';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

const ITEMS_PER_PAGE = 10;

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const STAT_STYLES = {
  blue: { iconWrap: 'bg-blue-50 text-blue-600', glow: 'bg-blue-100/70' },
  emerald: { iconWrap: 'bg-emerald-50 text-emerald-600', glow: 'bg-emerald-100/70' },
  indigo: { iconWrap: 'bg-indigo-50 text-indigo-600', glow: 'bg-indigo-100/70' },
  amber: { iconWrap: 'bg-amber-50 text-amber-600', glow: 'bg-amber-100/70' },
};

const BANK_ACCOUNT_TYPES = ['bank', 'savings', 'current', 'loan'];
const isBankAccount = (type) => BANK_ACCOUNT_TYPES.includes(type);

const employeeBankAccountsRequestCache = new Map();
const getEmployeeBankAccountsCacheKey = (companyId) => String(companyId ?? 'no-company');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AccountTypeBadge = ({ type, compact = false }) => {
  const isCash = type === 'cash';
  const isUpi = type === 'upi';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${isCash
        ? 'bg-amber-100 border border-amber-200 text-amber-700'
        : isUpi
          ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
          : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
        } ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs'}`}
    >
      {isCash ? <FaMoneyBillWave size={compact ? 8 : 10} /> : isUpi ? <FaQrcode size={compact ? 8 : 10} /> : <FaUniversity size={compact ? 8 : 10} />}
      {isCash ? 'CASH' : isUpi ? 'UPI' : 'BANK'}
    </span>
  );
};

const StatusBadge = ({ status, compact = false }) => {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${isActive
        ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
        : 'bg-slate-100 border border-slate-200 text-slate-500'
        } ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs'}`}
    >
      {isActive ? <FaCheck size={compact ? 7 : 9} /> : <FaTimes size={compact ? 7 : 9} />}
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
};

const PrimaryBadge = ({ compact = false }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
  >
    <FaStar size={compact ? 7 : 9} /> PRIMARY
  </span>
);

const maskAccount = (num) => {
  if (!num) return '—';
  if (num.length <= 4) return num;
  return '••••' + num.slice(-4);
};

// ─── Mobile Card ───────────────────────────────────────────────────────────────

const MobileEmployeeBankCard = ({ account, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md transition-all duration-300 group h-full flex flex-col"
    onClick={() => onView(account)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          {account.account_type === 'cash' ? <FaMoneyBillWave size={18} /> : <FaUniversity size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-800">{account.employee_name || account.account_holder_name}</h3>
          <p className="text-[10px] text-slate-400 font-mono italic">
            {account.account_type === 'upi' ? (account.upi_id || 'UPI ID') : (account.bank_name || 'Cash Account')}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onView(account); }}
        className="p-2 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all shrink-0"
        title="View Details"
      >
        <FaEye size={14} />
      </button>
    </div>

    <div className="mt-4 flex flex-wrap gap-1.5">
      <AccountTypeBadge type={account.account_type} compact />
      <StatusBadge status={account.status} compact />
      {account.is_primary && <PrimaryBadge compact />}
    </div>

    <div className="mt-4 space-y-2">
      {account.employee_id && (
        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
          <span className="text-[10px] font-bold text-blue-600 uppercase">Employee ID</span>
          <span className="text-xs font-black text-blue-700 font-mono">{account.employee_id}</span>
        </div>
      )}
      {account.account_type === 'upi' && (
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">UPI ID</span>
          <span className="text-xs font-black text-emerald-700 font-mono">{account.upi_id}</span>
        </div>
      )}
      {account.account_number && isBankAccount(account.account_type) && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Account No.</span>
          <span className="text-xs font-black text-slate-700 font-mono">{maskAccount(account.account_number)}</span>
        </div>
      )}
      {account.ifsc_code && isBankAccount(account.account_type) && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
          <span className="text-xs font-black text-slate-700 font-mono">{account.ifsc_code}</span>
        </div>
      )}
    </div>
  </motion.div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const EmployeeBankAccountManagement = () => {
  const isMountedRef = useRef(true);
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, account: null });
  const [viewMode, setViewMode] = useState('table');

  const getEffectiveWidth = () => {
    const width = window.innerWidth;
    const offset = width >= 1024 ? 280 : (width >= 768 ? 80 : 0);
    return width - offset;
  };

  const getVisibleColumns = useCallback((width) => ({
    showEmployee: true,
    showAccount: width >= 640,
    showType: width >= 540,
    showAccountNumber: width >= 760,
    showIfscBranch: width >= 980,
    showStatus: width >= 620,
  }), []);
  const [visibleColumns, setVisibleColumns] = useState(() => getVisibleColumns(getEffectiveWidth()));

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVisibleColumns(getVisibleColumns(getEffectiveWidth()));
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [getVisibleColumns]);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async ({ force = false } = {}) => {
    const companyId = getCompanyId();
    if (!companyId) return;

    const cacheKey = getEmployeeBankAccountsCacheKey(companyId);
    let requestPromise = force ? null : employeeBankAccountsRequestCache.get(cacheKey);

    if (!requestPromise) {
      requestPromise = (async () => {
        const response = await apiCall('/bank-accounts/management/employee', 'GET', null, companyId);
        return response.json();
      })();
      employeeBankAccountsRequestCache.set(cacheKey, requestPromise);
    }

    if (isMountedRef.current) setLoading(true);

    try {
      const result = await requestPromise;
      
      if (!isMountedRef.current) return;

      if (result.success) {
        setAccounts(result.data || []);
      } else {
        toast.error(result.message || 'Failed to fetch employee bank accounts');
        setAccounts([]);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      toast.error('Connection error while fetching employee bank accounts');
      setAccounts([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
      if (employeeBankAccountsRequestCache.get(cacheKey) === requestPromise) {
        employeeBankAccountsRequestCache.delete(cacheKey);
      }
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) { setFilteredAccounts(accounts); return; }
    setFilteredAccounts(
      accounts.filter((a) =>
        a.employee_name?.toLowerCase().includes(q) ||
        a.employee_id?.toLowerCase().includes(q) ||
        a.account_holder_name?.toLowerCase().includes(q) ||
        a.bank_name?.toLowerCase().includes(q) ||
        a.account_number?.toLowerCase().includes(q) ||
        a.ifsc_code?.toLowerCase().includes(q) ||
        a.account_type?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q)
      )
    );
  }, [accounts, searchTerm]);

  useEffect(() => { goToPage(1); }, [searchTerm, goToPage]);

  const totalItems = filteredAccounts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  useEffect(() => {
    if (pagination.page > totalPages) goToPage(totalPages);
  }, [goToPage, pagination.page, totalPages]);

  const paginatedData = useMemo(
    () => filteredAccounts.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit),
    [filteredAccounts, pagination.page, pagination.limit]
  );

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => [
    { label: 'Total Accounts', value: accounts.length, icon: FaUniversity, color: 'blue', isCount: true },
    { label: 'Active Accounts', value: accounts.filter(a => a.status === 'active').length, icon: FaCheck, color: 'emerald', isCount: true },
    { label: 'Bank Accounts', value: accounts.filter(a => isBankAccount(a.account_type)).length, icon: FaUniversity, color: 'indigo', isCount: true },
    { label: 'UPI/Cash Accounts', value: accounts.filter(a => a.account_type === 'cash' || a.account_type === 'upi').length, icon: FaMoneyBillWave, color: 'amber', isCount: true },
  ], [accounts]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const closeViewModal = useCallback(() => setViewModal({ open: false, account: null }), []);

  useEffect(() => {
    if (!viewModal.open) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeViewModal();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeViewModal, viewModal.open]);

  const handlePageChange = useCallback((page) => { goToPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [goToPage]);

  // ── Table columns ─────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      visible: visibleColumns.showEmployee,
      render: (account) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
             <FaUser size={14} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">{account.employee_name || account.account_holder_name}</div>
            {account.employee_id && (
              <div className="text-[10px] text-slate-400 font-mono italic">
                {account.employee_id}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'account',
      label: 'Account Details',
      visible: visibleColumns.showAccount,
      render: (account) => (
        <div className="min-w-0">
           <div className="font-semibold text-slate-700 text-sm truncate">{account.account_holder_name}</div>
           <div className="text-[10px] text-slate-400 font-mono italic truncate">
             {account.account_type === 'upi' ? (account.upi_id || 'UPI ID') : (account.bank_name || 'Cash Account')}
           </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      visible: visibleColumns.showType,
      render: (account) => (
        <div className="flex flex-col gap-1 items-start">
          <AccountTypeBadge type={account.account_type} compact />
          {account.is_primary && <PrimaryBadge compact />}
        </div>
      ),
    },
    {
      key: 'account_number',
      label: 'Account No.',
      visible: visibleColumns.showAccountNumber,
      render: (account) => (
        <span className="font-mono text-sm text-slate-600">
          {account.account_type === 'upi' ? account.upi_id : (account.account_number ? maskAccount(account.account_number) : '—')}
        </span>
      ),
    },
    {
      key: 'ifsc',
      label: 'IFSC / Branch',
      visible: visibleColumns.showIfscBranch,
      render: (account) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">{account.ifsc_code || '—'}</span>
          <span className="text-[10px] text-slate-400">{account.branch_name || ''}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      visible: visibleColumns.showStatus,
      render: (account) => <StatusBadge status={account.status} compact />,
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-blue-500 text-4xl" />
          <p className="text-slate-400 font-medium animate-pulse">Loading employee bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <ManagementHub
      eyebrow={<><FaUniversity size={11} /> Employees</>}
      title="Employee Bank Accounts"
      description="View and manage bank accounts added by employees."
      accent="blue"
      onRefresh={() => fetchData({ force: true })}
      actions={
        <ManagementButton
          tone="blue"
          variant="solid"
          leftIcon={<FaPlus />}
          onClick={() => {
            toast.info("Adding employee accounts will be available soon.");
          }}
          className="whitespace-nowrap"
        >
          Add Account
        </ManagementButton>
      }
    >
      <div className="space-y-6 p-2 lg:p-0">
        {/* Stats */}
        {!loading && accounts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[stat.color].iconWrap}`}>
                  <stat.icon size={18} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ─── Consolidated Filter & View Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"
        >
          {/* Left Section: Search */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee, holder name, bank, account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none shadow-sm transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Right Section: View Switcher */}
          <div className="flex items-center justify-end">
            <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
          </div>
        </motion.div>

        {totalItems === 0 && !loading ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaUser size={24} /></div>
            <p className="text-slate-500 font-bold">No employee accounts found</p>
            <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">
              {searchTerm ? `No results matching "${searchTerm}"` : 'Employees have not added any bank accounts yet.'}
            </p>
          </motion.div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={paginatedData}
            columns={columns}
            rowKey={(row) => row.bank_id}
            onRowClick={(row) => setViewModal({ open: true, account: row })}
            getActions={(row) => [
              { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setViewModal({ open: true, account: row }), className: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' },
            ]}
            accent="blue"
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {paginatedData.map((account) => (
              <MobileEmployeeBankCard
                key={account.bank_id}
                account={account}
                onView={(r) => setViewModal({ open: true, account: r })}
              />
            ))}
          </ManagementGrid>
        )}

        {totalItems > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.page}
              totalItems={totalItems}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onLimitChange={changeLimit}
              showInfo
            />
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModal.open && !!viewModal.account}
        onClose={closeViewModal}
        title={viewModal.account?.account_holder_name}
        subtitle={viewModal.account?.account_type === 'upi' ? viewModal.account?.upi_id : (viewModal.account?.bank_name || 'Cash Account')}
        icon={viewModal.account?.account_type === 'cash' ? <FaMoneyBillWave size={20} /> : viewModal.account?.account_type === 'upi' ? <FaQrcode size={20} /> : <FaUniversity size={20} />}
        size="lg"
        footer={(
          <button
            onClick={closeViewModal}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        )}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <AccountTypeBadge type={viewModal.account?.account_type} />
            <StatusBadge status={viewModal.account?.status} />
            {viewModal.account?.is_primary && <PrimaryBadge />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 col-span-1 sm:col-span-2">
               <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">Employee Information</p>
               <p className="font-bold text-sm text-blue-700">{viewModal.account?.employee_name}</p>
               {viewModal.account?.employee_id && (
                 <p className="font-mono text-xs font-semibold text-blue-600 mt-1">{viewModal.account.employee_id}</p>
               )}
            </div>

            {viewModal.account?.account_type === 'upi' ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 col-span-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">UPI ID</p>
                <p className="font-mono text-sm font-bold text-emerald-700">{viewModal.account?.upi_id}</p>
              </div>
            ) : (
              <>
                {[
                  { label: 'Account No.', value: viewModal.account?.account_number ? maskAccount(viewModal.account.account_number) : '—' },
                  { label: 'IFSC Code', value: viewModal.account?.ifsc_code || '—' },
                  { label: 'Branch', value: viewModal.account?.branch_name || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="font-mono text-sm font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </>
            )}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</p>
              <p className="font-mono text-sm font-bold text-slate-700">
                {viewModal.account?.created_at ? new Date(viewModal.account.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <FaShieldAlt className="shrink-0 text-slate-400" size={16} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Owner Type</p>
              <p className="text-sm font-bold capitalize text-slate-700">{viewModal.account?.owner_type || 'Employee'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </ManagementHub>
  );
};

export default EmployeeBankAccountManagement;
