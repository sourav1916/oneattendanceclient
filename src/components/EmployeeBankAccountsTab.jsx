import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch, FaTimes, FaCheck,
  FaUser, FaSpinner,
  FaUniversity, FaStar, FaPlus,
  FaMoneyBillWave, FaEye, FaQrcode, FaShieldAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import { ManagementTable } from '../components/common';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import SelectField from '../components/SelectField';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const BANK_ACCOUNT_TYPES = ['bank', 'savings', 'current', 'loan'];
const isBankAccount = (type) => BANK_ACCOUNT_TYPES.includes(type);

const maskAccount = (num) => {
  if (!num) return '—';
  if (num.length <= 4) return num;
  return '••••' + num.slice(-4);
};

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

// ─── Badges ───────────────────────────────────────────────────────────────────

const AccountTypeBadge = ({ type, compact = false }) => {
  const isUpi = type === 'upi';
  const isCash = type === 'cash';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${isCash
        ? 'bg-amber-100 border border-amber-200 text-amber-700'
        : isUpi
          ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
          : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
        } ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs'}`}
    >
      {isCash ? (
        <FaMoneyBillWave size={compact ? 8 : 10} />
      ) : isUpi ? (
        <FaQrcode size={compact ? 8 : 10} />
      ) : (
        <FaUniversity size={compact ? 8 : 10} />
      )}
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

// ─── Mobile Card ───────────────────────────────────────────────────────────────

const MobileBankCard = ({ account, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md transition-all duration-300 group h-full flex flex-col"
    onClick={() => onView(account)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          {account.account_type === 'upi' ? (
            <FaQrcode size={18} />
          ) : account.account_type === 'cash' ? (
            <FaMoneyBillWave size={18} />
          ) : (
            <FaUniversity size={18} />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-800">{account.account_holder_name}</h3>
          <p className="text-[10px] text-slate-400 font-mono italic">
            {account.account_type === 'upi'
              ? account.upi_id || 'UPI ID'
              : account.bank_name || 'Cash Account'}
          </p>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onView(account); }}
        className="p-2 rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50 transition-all shrink-0"
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
      {account.account_type === 'upi' && (
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">UPI ID</span>
          <span className="text-xs font-black text-emerald-700 font-mono">{account.upi_id}</span>
        </div>
      )}
      {account.account_number && isBankAccount(account.account_type) && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Account No.</span>
          <span className="text-xs font-black text-slate-700 font-mono">
            {maskAccount(account.account_number)}
          </span>
        </div>
      )}
      {account.ifsc_code && isBankAccount(account.account_type) && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
          <span className="text-xs font-black text-slate-700 font-mono">{account.ifsc_code}</span>
        </div>
      )}
      {account.branch_name && isBankAccount(account.account_type) && (
        <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
          <span className="text-xs font-black text-slate-700 font-mono truncate max-w-[60%]">
            {account.branch_name}
          </span>
        </div>
      )}
    </div>
  </motion.div>
);

// ─── View Modal ────────────────────────────────────────────────────────────────

const BankAccountViewModal = ({ account, onClose }) => {
  if (!account) return null;
  return (
    <Modal
      isOpen={!!account}
      onClose={onClose}
      title={account.account_holder_name}
      subtitle={
        account.account_type === 'upi'
          ? account.upi_id
          : account.bank_name || 'Cash Account'
      }
      icon={
        account.account_type === 'cash' ? (
          <FaMoneyBillWave size={20} />
        ) : account.account_type === 'upi' ? (
          <FaQrcode size={20} />
        ) : (
          <FaUniversity size={20} />
        )
      }
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <AccountTypeBadge type={account.account_type} />
          <StatusBadge status={account.status} />
          {account.is_primary && <PrimaryBadge />}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Holder name */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 col-span-1 sm:col-span-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
              Account Holder
            </p>
            <p className="font-bold text-sm text-blue-700">{account.account_holder_name}</p>
          </div>

          {account.account_type === 'upi' ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 col-span-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                UPI ID
              </p>
              <p className="font-mono text-sm font-bold text-emerald-700">{account.upi_id}</p>
            </div>
          ) : (
            <>
              {account.bank_name && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 col-span-1 sm:col-span-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Bank Name
                  </p>
                  <p className="font-bold text-sm text-slate-700">{account.bank_name}</p>
                </div>
              )}
              {[
                {
                  label: 'Account No.',
                  value: account.account_number
                    ? maskAccount(account.account_number)
                    : '—',
                },
                { label: 'IFSC Code', value: account.ifsc_code || '—' },
                { label: 'Branch', value: account.branch_name || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-700">{value}</p>
                </div>
              ))}
            </>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Created
            </p>
            <p className="font-mono text-sm font-bold text-slate-700">
              {account.created_at
                ? new Date(account.created_at).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <FaShieldAlt className="shrink-0 text-slate-400" size={16} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Owner Type
            </p>
            <p className="text-sm font-bold capitalize text-slate-700">
              {account.owner_type || 'Employee'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Tab Component ────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const EmployeeBankAccountsTab = ({ employeeId }) => {
  const isMountedRef = useRef(true);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterAccountType, setFilterAccountType] = useState(null);
  const [filterIsPrimary, setFilterIsPrimary] = useState(null);
  const [totalServerItems, setTotalServerItems] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page on filter change
  useEffect(() => { goToPage(1); }, [debouncedSearch, filterStatus, filterAccountType, filterIsPrimary, goToPage]);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async ({ force = false } = {}) => {
    if (!employeeId) return;
    const companyId = getCompanyId();
    if (!companyId) return;

    const params = new URLSearchParams();
    params.append('employee_id', employeeId);
    params.append('page', pagination.page);
    params.append('limit', pagination.limit);
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filterStatus?.value) params.append('status', filterStatus.value);
    if (filterAccountType?.value) params.append('account_type', filterAccountType.value);
    if (filterIsPrimary?.value !== undefined && filterIsPrimary?.value !== '')
      params.append('is_primary', filterIsPrimary.value);

    if (isMountedRef.current) setLoading(true);

    try {
      const response = await apiCall(
        `/bank-accounts/management/employee?${params.toString()}`,
        'GET',
        null,
        companyId
      );
      const result = await response.json();

      if (!isMountedRef.current) return;
      if (result.success) {
        setAccounts(result.data || []);
        const total =
          result.meta?.total ?? result.total ?? null;
        setTotalServerItems(total);
      } else {
        toast.error(result.message || 'Failed to fetch bank accounts');
        setAccounts([]);
        setTotalServerItems(null);
      }
    } catch {
      if (!isMountedRef.current) return;
      toast.error('Connection error while fetching bank accounts');
      setAccounts([]);
      setTotalServerItems(null);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [
    employeeId,
    debouncedSearch,
    filterStatus,
    filterAccountType,
    filterIsPrimary,
    pagination.page,
    pagination.limit,
  ]);

  const prevDep = useRef('');
  useEffect(() => {
    const dep = `${employeeId}|${debouncedSearch}|${filterStatus?.value || ''}|${filterAccountType?.value || ''}|${filterIsPrimary?.value ?? ''}|${pagination.page}|${pagination.limit}`;
    if (prevDep.current !== dep) {
      fetchData();
      prevDep.current = dep;
    }
  }, [employeeId, debouncedSearch, filterStatus, filterAccountType, filterIsPrimary, pagination.page, pagination.limit, fetchData]);

  // ── Client-side filtering (when server doesn't paginate) ──────────────────

  const filteredAccounts = useMemo(() => {
    if (totalServerItems !== null) return accounts; // server-paginated
    const q = debouncedSearch.trim().toLowerCase();
    let list = [...accounts];
    if (q) {
      list = list.filter(
        (a) =>
          a.account_holder_name?.toLowerCase().includes(q) ||
          a.bank_name?.toLowerCase().includes(q) ||
          a.account_number?.toLowerCase().includes(q) ||
          a.ifsc_code?.toLowerCase().includes(q) ||
          a.account_type?.toLowerCase().includes(q) ||
          a.upi_id?.toLowerCase().includes(q)
      );
    }
    if (filterStatus?.value) list = list.filter((a) => a.status === filterStatus.value);
    if (filterAccountType?.value)
      list = list.filter((a) => a.account_type === filterAccountType.value);
    if (filterIsPrimary?.value !== undefined && filterIsPrimary?.value !== '')
      list = list.filter((a) => String(a.is_primary) === String(filterIsPrimary.value));
    return list;
  }, [accounts, debouncedSearch, filterStatus, filterAccountType, filterIsPrimary, totalServerItems]);

  const totalItems = totalServerItems !== null ? totalServerItems : filteredAccounts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  useEffect(() => {
    if (pagination.page > totalPages && totalPages > 0) goToPage(totalPages);
  }, [goToPage, pagination.page, totalPages]);

  const paginatedData = useMemo(() => {
    if (totalServerItems !== null) return filteredAccounts;
    return filteredAccounts.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit
    );
  }, [filteredAccounts, pagination.page, pagination.limit, totalServerItems]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => [
      {
        label: 'Total',
        value: accounts.length,
        icon: FaUniversity,
        color: 'blue',
        iconCls: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Active',
        value: accounts.filter((a) => a.status === 'active').length,
        icon: FaCheck,
        color: 'emerald',
        iconCls: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Bank',
        value: accounts.filter((a) => isBankAccount(a.account_type)).length,
        icon: FaUniversity,
        color: 'indigo',
        iconCls: 'bg-indigo-50 text-indigo-600',
      },
      {
        label: 'UPI / Cash',
        value: accounts.filter(
          (a) => a.account_type === 'cash' || a.account_type === 'upi'
        ).length,
        icon: FaMoneyBillWave,
        color: 'amber',
        iconCls: 'bg-amber-50 text-amber-600',
      },
    ],
    [accounts]
  );

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'account',
      label: 'Account Details',
      visible: true,
      render: (account) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            {account.account_type === 'upi' ? (
              <FaQrcode size={14} />
            ) : account.account_type === 'cash' ? (
              <FaMoneyBillWave size={14} />
            ) : (
              <FaUniversity size={14} />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">
              {account.account_holder_name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono italic truncate">
              {account.account_type === 'upi'
                ? account.upi_id || 'UPI ID'
                : account.bank_name || 'Cash Account'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      visible: true,
      render: (account) => (
        <div className="flex flex-col gap-1 items-start">
          <AccountTypeBadge type={account.account_type} compact />
          {account.is_primary && <PrimaryBadge compact />}
        </div>
      ),
    },
    {
      key: 'account_number',
      label: 'Account / UPI',
      visible: true,
      render: (account) => (
        <span className="font-mono text-sm text-slate-600">
          {account.account_type === 'upi'
            ? account.upi_id || '—'
            : account.account_number
              ? maskAccount(account.account_number)
              : '—'}
        </span>
      ),
    },
    {
      key: 'ifsc',
      label: 'IFSC / Branch',
      visible: true,
      render: (account) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-700">
            {account.ifsc_code || '—'}
          </span>
          <span className="text-[10px] text-slate-400">{account.branch_name || ''}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      visible: true,
      render: (account) => <StatusBadge status={account.status} compact />,
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading && accounts.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-4">
        <FaSpinner className="animate-spin text-blue-500 text-3xl" />
        <p className="text-slate-400 font-medium animate-pulse text-sm">
          Loading bank accounts…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{stat.value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.iconCls}`}
              >
                <stat.icon size={18} />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filters + view switcher */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col lg:flex-row lg:justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
      >
        {/* Search */}
        <div className="relative lg:w-2/5">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by holder name, bank, account number, IFSC…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none shadow-sm transition-all text-sm font-medium"
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <div className="w-full">
            <SelectField 
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filterStatus || { value: '', label: 'All Status' }}
              onChange={(opt) => {
                setFilterStatus(opt.value ? opt : null);
                goToPage(1);
              }}
            />
          </div>

          <div className="w-full">
            <SelectField
              options={[
                { value: '', label: 'All Types' },
                { value: 'savings', label: 'Savings' },
                { value: 'current', label: 'Current' },
                { value: 'upi', label: 'UPI' },
              ]}
              value={filterAccountType || { value: '', label: 'All Types' }}
              onChange={(opt) => {
                setFilterAccountType(opt.value ? opt : null);
                goToPage(1);
              }}
            />
          </div>

          <div className="w-full">
            <SelectField
              options={[
                { value: '', label: 'All Primary' },
                { value: '1', label: 'Primary Only' },
                { value: '0', label: 'Non-Primary' },
              ]}
              value={filterIsPrimary || { value: '', label: 'All Primary' }}
              onChange={(opt) => {
                setFilterIsPrimary(opt.value ? opt : null);
                goToPage(1);
              }}
            />
          </div>

          <div className="flex justify-start lg:justify-end">
            <ManagementViewSwitcher
              viewMode={viewMode}
              onChange={setViewMode}
              accent="blue"
            />
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      {totalItems === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <FaUniversity size={24} />
          </div>
          <p className="text-slate-500 font-bold">No bank accounts found</p>
          <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">
            {searchTerm
              ? `No results matching "${searchTerm}"`
              : 'This employee has not added any bank accounts yet.'}
          </p>
        </motion.div>
      )}

      {/* Table view */}
      {totalItems > 0 && viewMode === 'table' && (
        <ManagementTable
          rows={paginatedData}
          columns={columns}
          rowKey={(row) => row.bank_id ?? row.id}
          onRowClick={(row) => setViewModal(row)}
          getActions={(row) => [
            {
              label: 'View Details',
              icon: <FaEye size={13} />,
              onClick: () => setViewModal(row),
              className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
            },
          ]}
          accent="blue"
        />
      )}

      {/* Grid / Card view */}
      {totalItems > 0 && viewMode !== 'table' && (
        <ManagementGrid viewMode={viewMode}>
          {paginatedData.map((account) => (
            <MobileBankCard
              key={account.bank_id ?? account.id}
              account={account}
              onView={(r) => setViewModal(r)}
            />
          ))}
        </ManagementGrid>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalItems={totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
          showInfo
        />
      )}

      {/* View Modal */}
      <BankAccountViewModal
        account={viewModal}
        onClose={() => setViewModal(null)}
      />
    </div>
  );
};

export default EmployeeBankAccountsTab;
