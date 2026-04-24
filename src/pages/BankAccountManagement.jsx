import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaCheck,
  FaUser, FaClock, FaDollarSign, FaEye, FaSpinner,
  FaChevronDown, FaListUl, FaCog, FaUniversity, FaStar,
  FaMoneyBillWave, FaIdCard, FaChartBar, FaToggleOn,
  FaBuilding, FaShieldAlt, FaExclamationTriangle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import { ManagementButton, ManagementHub, ManagementTable } from '../components/common';
import usePermissionAccess from '../hooks/usePermissionAccess';
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
  violet: { iconWrap: 'bg-violet-50 text-violet-600', glow: 'bg-violet-100/70' },
  emerald: { iconWrap: 'bg-emerald-50 text-emerald-600', glow: 'bg-emerald-100/70' },
  indigo: { iconWrap: 'bg-indigo-50 text-indigo-600', glow: 'bg-indigo-100/70' },
  amber: { iconWrap: 'bg-amber-50 text-amber-600', glow: 'bg-amber-100/70' },
};

const ACCOUNT_TYPES = ['cash', 'bank'];
const STATUS_OPTIONS = ['active', 'inactive'];
const bankAccountsListRequestCache = new Map();

const getBankAccountsListCacheKey = (companyId) => String(companyId ?? 'no-company');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AccountTypeBadge = ({ type, compact = false }) => {
  const isCash = type === 'cash';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        isCash
          ? 'bg-amber-100 border border-amber-200 text-amber-700'
          : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
      } ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs'}`}
    >
      {isCash ? <FaMoneyBillWave size={compact ? 8 : 10} /> : <FaUniversity size={compact ? 8 : 10} />}
      {isCash ? 'CASH' : 'BANK'}
    </span>
  );
};

const StatusBadge = ({ status, compact = false }) => {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        isActive
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
    className={`inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 font-bold ${
      compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
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

// ─── Action Menu (inline) ──────────────────────────────────────────────────────

const ActionMenu = ({
  account, onEdit, onDelete, onView,
  editDisabled, deleteDisabled, editMessage, deleteMessage,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
      >
        <FaCog size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full z-50 mt-1 w-44 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden"
          >
            {[
              { label: 'View Details', icon: <FaEye size={13} />, onClick: () => { onView(account); setOpen(false); }, disabled: false, className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50' },
              { label: 'Edit Account', icon: <FaEdit size={13} />, onClick: () => { onEdit(account); setOpen(false); }, disabled: editDisabled, title: editDisabled ? editMessage : '', className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
              { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => { onDelete(account); setOpen(false); }, disabled: deleteDisabled, title: deleteDisabled ? deleteMessage : '', className: 'text-red-600 hover:text-red-700 hover:bg-red-50' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.title}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${item.className}`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Mobile Card ───────────────────────────────────────────────────────────────

const MobileBankCard = ({ account, onEdit, onDelete, onView, editDisabled, deleteDisabled, editMessage, deleteMessage }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md transition-all duration-300 group h-full flex flex-col"
    onClick={() => onView(account)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
          {account.account_type === 'cash' ? <FaMoneyBillWave size={18} /> : <FaUniversity size={18} />}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-800">{account.account_holder_name}</h3>
          <p className="text-[10px] text-slate-400 font-mono italic">{account.bank_name || 'Cash Account'}</p>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <ActionMenu account={account} onEdit={onEdit} onDelete={onDelete} onView={onView}
          editDisabled={editDisabled} deleteDisabled={deleteDisabled}
          editMessage={editMessage} deleteMessage={deleteMessage} />
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-1.5">
      <AccountTypeBadge type={account.account_type} compact />
      <StatusBadge status={account.status} compact />
      {account.is_primary && <PrimaryBadge compact />}
    </div>

    <div className="mt-4 space-y-2">
      {account.account_number && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Account No.</span>
          <span className="text-xs font-black text-slate-700 font-mono">{maskAccount(account.account_number)}</span>
        </div>
      )}
      {account.ifsc_code && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
          <span className="text-xs font-black text-slate-700 font-mono">{account.ifsc_code}</span>
        </div>
      )}
      {account.branch_name && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
          <span className="text-xs font-bold text-slate-700">{account.branch_name}</span>
        </div>
      )}
    </div>
  </motion.div>
);

// ─── Form Field ────────────────────────────────────────────────────────────────

const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 placeholder:font-normal placeholder:text-slate-400";
const selectCls = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 cursor-pointer appearance-none";

// ─── Main Component ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  bank_id: null,
  account_type: 'cash',
  bank_name: '',
  account_holder_name: '',
  account_number: '',
  ifsc_code: '',
  branch_name: '',
  is_primary: false,
  status: 'active',
};

const BankAccountManagement = () => {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const isMountedRef = useRef(true);
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, account: null });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const getEffectiveWidth = () => {
    const width = window.innerWidth;
    const offset = width >= 1024 ? 280 : (width >= 768 ? 80 : 0);
    return width - offset;
  };

  const getVisibleColumns = useCallback((width) => ({
    showAccount: true,
    showType: width >= 540,
    showAccountNumber: width >= 760,
    showIfscBranch: width >= 980,
    showStatus: width >= 620,
  }), []);
  const [visibleColumns, setVisibleColumns] = useState(() => getVisibleColumns(getEffectiveWidth()));

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);
  const createAccess = checkActionAccess('bankAccountManagement', 'create');
  const updateAccess = checkActionAccess('bankAccountManagement', 'update');
  const deleteAccess = checkActionAccess('bankAccountManagement', 'delete');
  const createMessage = getAccessMessage(createAccess);
  const updateMessage = getAccessMessage(updateAccess);
  const deleteMessage = getAccessMessage(deleteAccess);

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
    const cacheKey = getBankAccountsListCacheKey(companyId);
    let requestPromise = force ? null : bankAccountsListRequestCache.get(cacheKey);

    if (!requestPromise) {
      requestPromise = (async () => {
        const response = await apiCall('/bank-accounts/company/list', 'GET', null, companyId);
        return response.json();
      })();
      bankAccountsListRequestCache.set(cacheKey, requestPromise);
    }

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const result = await requestPromise;
      if (!isMountedRef.current) {
        return;
      }
      if (result.success) {
        setAccounts(result.data || []);
      } else {
        toast.error(result.message || 'Failed to fetch bank accounts');
        setAccounts([]);
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      toast.error('Connection error while fetching bank accounts');
      setAccounts([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      if (bankAccountsListRequestCache.get(cacheKey) === requestPromise) {
        bankAccountsListRequestCache.delete(cacheKey);
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
        a.account_holder_name?.toLowerCase().includes(q) ||
        a.bank_name?.toLowerCase().includes(q) ||
        a.account_number?.toLowerCase().includes(q) ||
        a.ifsc_code?.toLowerCase().includes(q) ||
        a.branch_name?.toLowerCase().includes(q) ||
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
    { label: 'Total Accounts', value: accounts.length, icon: FaUniversity, color: 'violet', isCount: true },
    { label: 'Active Accounts', value: accounts.filter(a => a.status === 'active').length, icon: FaCheck, color: 'emerald', isCount: true },
    { label: 'Bank Accounts', value: accounts.filter(a => a.account_type === 'bank').length, icon: FaBuilding, color: 'indigo', isCount: true },
    { label: 'Cash Accounts', value: accounts.filter(a => a.account_type === 'cash').length, icon: FaMoneyBillWave, color: 'amber', isCount: true },
  ], [accounts]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openModal = (mode, account = null) => {
    if (mode === 'create' && createAccess.disabled) return;
    if (mode === 'edit' && updateAccess.disabled) return;
    if (mode === 'delete' && deleteAccess.disabled) return;
    setModalMode(mode);
    setSelectedAccount(account);
    if (account && mode !== 'delete') {
      setFormData({
        bank_id: account.bank_id,
        account_type: account.account_type || 'cash',
        bank_name: account.bank_name || '',
        account_holder_name: account.account_holder_name || '',
        account_number: account.account_number || '',
        ifsc_code: account.ifsc_code || '',
        branch_name: account.branch_name || '',
        is_primary: account.is_primary || false,
        status: account.status || 'active',
      });
    } else if (!account) {
      setFormData({ ...EMPTY_FORM });
    }
    setShowModal(true);
  };

  const closeModal = useCallback(() => { if (!saving) setShowModal(false); }, [saving]);
  const closeViewModal = useCallback(() => setViewModal({ open: false, account: null }), []);

  useEffect(() => {
    if (!showModal && !viewModal.open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (viewModal.open) { closeViewModal(); return; }
        closeModal();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeModal, closeViewModal, showModal, viewModal.open]);

  // ── Action ───────────────────────────────────────────────────────────────────

  const handleAction = async () => {
    if (modalMode !== 'delete') {
      if (!formData.account_holder_name.trim()) { toast.error('Account holder name is required'); return; }
      if (formData.account_type === 'bank') {
        if (!formData.bank_name.trim()) { toast.error('Bank name is required'); return; }
        if (!formData.account_number.trim()) { toast.error('Account number is required'); return; }
        if (!formData.ifsc_code.trim()) { toast.error('IFSC code is required'); return; }
      }
    }

    setSaving(true);
    try {
      const companyId = getCompanyId();
      let response;

      if (modalMode === 'create') {
        const payload = {
          company_id: companyId,
          account_type: formData.account_type,
          account_holder_name: formData.account_holder_name,
          is_primary: formData.is_primary,
          ...(formData.account_type === 'bank' && {
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            ifsc_code: formData.ifsc_code,
            branch_name: formData.branch_name,
          }),
        };
        response = await apiCall('/bank-accounts/create', 'POST', payload, companyId);
      } else if (modalMode === 'edit') {
        const payload = {
          bank_id: formData.bank_id,
          bank_name: formData.bank_name,
          account_holder_name: formData.account_holder_name,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          branch_name: formData.branch_name,
          is_primary: formData.is_primary,
          status: formData.status,
        };
        response = await apiCall('/bank-accounts/update', 'PUT', payload, companyId);
      } else if (modalMode === 'delete') {
        response = await apiCall('/bank-accounts/delete', 'DELETE', { bank_id: selectedAccount.bank_id }, companyId);
      }

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Operation failed');

      toast.success(result.message || `Account ${modalMode === 'create' ? 'created' : modalMode === 'edit' ? 'updated' : 'deleted'} successfully`);
      setShowModal(false);
      await fetchData({ force: true });
    } catch (error) {
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = useCallback((page) => { goToPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [goToPage]);

  const isBankType = formData.account_type === 'bank';

  // ── Table columns ─────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'account',
      label: 'Account',
      visible: visibleColumns.showAccount,
      render: (account) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            {account.account_type === 'cash' ? <FaMoneyBillWave size={14} /> : <FaUniversity size={14} />}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">{account.account_holder_name}</div>
            <div className="text-[10px] text-slate-400 font-mono italic">{account.bank_name || 'Cash Account'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      visible: visibleColumns.showType,
      render: (account) => (
        <div className="flex flex-col gap-1">
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
        <span className="font-mono text-sm text-slate-600">{maskAccount(account.account_number)}</span>
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
          <FaSpinner className="animate-spin text-violet-500 text-4xl" />
          <p className="text-slate-400 font-medium animate-pulse">Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <ManagementHub
      eyebrow={<><FaChartBar size={11} /> Financial</>}
      title="Bank Account Management"
      description="Manage company bank accounts, cash wallets, and payment methods."
      accent="violet"
      actions={
        <ManagementButton
          tone="violet"
          variant="solid"
          leftIcon={<FaPlus />}
          onClick={() => openModal('create')}
          disabled={createAccess.disabled}
          title={createAccess.disabled ? createMessage : ''}
        >
          Add Account
        </ManagementButton>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        {!loading && accounts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[stat.color].iconWrap}`}>
                  <stat.icon size={18} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by holder name, bank, account number, IFSC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* Data */}
        {totalItems === 0 && !loading ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaUniversity size={24} /></div>
            <p className="text-slate-500 font-bold">No accounts found</p>
            <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">
              {searchTerm ? `No results matching "${searchTerm}"` : 'Add a bank account to get started.'}
            </p>
          </motion.div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={paginatedData}
            columns={columns}
            rowKey={(row) => row.bank_id}
            onRowClick={(row) => setViewModal({ open: true, account: row })}
            getActions={(row) => [
              { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setViewModal({ open: true, account: row }), className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50' },
              { label: 'Edit Account', icon: <FaEdit size={13} />, onClick: () => openModal('edit', row), disabled: updateAccess.disabled, title: updateAccess.disabled ? updateMessage : '', className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
              { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => openModal('delete', row), disabled: deleteAccess.disabled, title: deleteAccess.disabled ? deleteMessage : '', className: 'text-red-600 hover:text-red-700 hover:bg-red-50' },
            ]}
            accent="violet"
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {paginatedData.map((account) => (
              <MobileBankCard
                key={account.bank_id}
                account={account}
                onEdit={(r) => openModal('edit', r)}
                onDelete={(r) => openModal('delete', r)}
                onView={(r) => setViewModal({ open: true, account: r })}
                editDisabled={updateAccess.disabled}
                deleteDisabled={deleteAccess.disabled}
                editMessage={updateMessage}
                deleteMessage={deleteMessage}
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

      {/* ── View Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewModal.open && viewModal.account && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
            onMouseDown={(e) => e.target === e.currentTarget && closeViewModal()}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-indigo-700 text-white px-6 sm:px-8 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                      {viewModal.account.account_type === 'cash' ? <FaMoneyBillWave size={22} /> : <FaUniversity size={22} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold truncate leading-tight">{viewModal.account.account_holder_name}</h2>
                      <p className="text-white/70 text-sm mt-1">{viewModal.account.bank_name || 'Cash Account'}</p>
                    </div>
                  </div>
                  <button onClick={closeViewModal} className="p-2 hover:bg-white/20 rounded-xl transition-all shrink-0"><FaTimes size={20} /></button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <AccountTypeBadge type={viewModal.account.account_type} />
                  <StatusBadge status={viewModal.account.status} />
                  {viewModal.account.is_primary && <PrimaryBadge />}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Account No.', value: viewModal.account.account_number ? maskAccount(viewModal.account.account_number) : '—' },
                    { label: 'IFSC Code', value: viewModal.account.ifsc_code || '—' },
                    { label: 'Branch', value: viewModal.account.branch_name || '—' },
                    { label: 'Created', value: viewModal.account.created_at ? new Date(viewModal.account.created_at).toLocaleDateString() : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-sm font-bold text-slate-700 font-mono">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Owner info */}
                <div className="flex items-center gap-3 p-4 bg-violet-50/60 border border-violet-100 rounded-2xl">
                  <FaShieldAlt className="text-violet-400 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Owner Type</p>
                    <p className="text-sm font-bold text-violet-700 capitalize">{viewModal.account.owner_type || 'Company'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 shrink-0">
                <button onClick={closeViewModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                  Close
                </button>
                <button
                  onClick={() => { closeViewModal(); openModal('edit', viewModal.account); }}
                  disabled={updateAccess.disabled}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaEdit /> Edit Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create / Edit / Delete Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`bg-white w-full max-h-[90vh] rounded-3xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden ${
                modalMode === 'delete' ? 'max-w-md' : 'max-w-2xl'
              }`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* ── Delete ── */}
              {modalMode === 'delete' ? (
                <>
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-3xl px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FaTrash className="text-white text-sm" /></div>
                        <div>
                          <h2 className="text-lg font-bold">Delete Bank Account</h2>
                          <p className="text-xs text-white/80">This action cannot be undone</p>
                        </div>
                      </div>
                      <button type="button" onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes size={20} /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
                      <FaExclamationTriangle className="text-red-400" size={22} />
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Are you sure you want to delete <span className="font-bold text-slate-800">"{selectedAccount?.account_holder_name}"</span>? This cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
                    <button type="button" onClick={closeModal} disabled={saving} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-60">Cancel</button>
                    <button type="button" onClick={handleAction} disabled={saving || deleteAccess.disabled} title={deleteAccess.disabled ? deleteMessage : ''}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </>
              ) : (
                /* ── Create / Edit ── */
                <>
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-3xl px-6 sm:px-8 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          {modalMode === 'create' ? <FaPlus /> : <FaEdit />}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">{modalMode === 'create' ? 'Add Bank Account' : 'Edit Bank Account'}</h2>
                          <p className="text-xs text-white/80">{modalMode === 'create' ? 'Set up a new account or cash wallet' : `Editing: ${selectedAccount?.account_holder_name}`}</p>
                        </div>
                      </div>
                      <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes size={20} /></button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 space-y-5">
                    {/* Account Type — only for create */}
                    {modalMode === 'create' && (
                      <FormField label="Account Type">
                        <div className="grid grid-cols-2 gap-3">
                          {ACCOUNT_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData((p) => ({ ...p, account_type: type }))}
                              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${
                                formData.account_type === type
                                  ? 'border-violet-400 bg-violet-50 text-violet-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {type === 'cash' ? <FaMoneyBillWave size={14} /> : <FaUniversity size={14} />}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </FormField>
                    )}

                    {/* Holder name */}
                    <FormField label="Account Holder Name *">
                      <input
                        type="text"
                        value={formData.account_holder_name}
                        onChange={(e) => setFormData((p) => ({ ...p, account_holder_name: e.target.value }))}
                        placeholder="e.g. ABC Pvt Ltd / John Doe"
                        className={inputCls}
                      />
                    </FormField>

                    {/* Bank-only fields */}
                    {isBankType && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 overflow-hidden">
                        <FormField label="Bank Name *">
                          <input type="text" value={formData.bank_name} onChange={(e) => setFormData((p) => ({ ...p, bank_name: e.target.value }))} placeholder="e.g. State Bank of India" className={inputCls} />
                        </FormField>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField label="Account Number *">
                            <input type="text" value={formData.account_number} onChange={(e) => setFormData((p) => ({ ...p, account_number: e.target.value }))} placeholder="12345678901" className={inputCls} />
                          </FormField>
                          <FormField label="IFSC Code *">
                            <input type="text" value={formData.ifsc_code} onChange={(e) => setFormData((p) => ({ ...p, ifsc_code: e.target.value.toUpperCase() }))} placeholder="SBIN0001234" className={inputCls} />
                          </FormField>
                        </div>
                        <FormField label="Branch Name">
                          <input type="text" value={formData.branch_name} onChange={(e) => setFormData((p) => ({ ...p, branch_name: e.target.value }))} placeholder="e.g. Kolkata Main Branch" className={inputCls} />
                        </FormField>
                      </motion.div>
                    )}

                    {/* Status — only edit */}
                    {modalMode === 'edit' && (
                      <FormField label="Status">
                        <div className="relative">
                          <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))} className={selectCls}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                          <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                        </div>
                      </FormField>
                    )}

                    {/* Primary toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Set as Primary Account</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Mark this as the default account for transactions</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, is_primary: !p.is_primary }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_primary ? 'bg-violet-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${formData.is_primary ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 px-6 sm:px-8 pb-6 pt-4 border-t border-gray-100">
                    <button type="button" onClick={closeModal} disabled={saving} className="w-full rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={saving || !formData.account_holder_name.trim() || (modalMode === 'create' ? createAccess.disabled : updateAccess.disabled)}
                      title={modalMode === 'create' ? (createAccess.disabled ? createMessage : '') : (updateAccess.disabled ? updateMessage : '')}
                      className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin" /><span>Saving...</span></div>
                      ) : modalMode === 'create' ? 'Add Account' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ManagementHub>
  );
};

export default BankAccountManagement;
