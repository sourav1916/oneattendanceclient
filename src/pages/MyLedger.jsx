import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaWallet, FaArrowUp, FaArrowDown, FaSearch, FaEye, FaSpinner,
  FaTimes, FaCalendarAlt, FaFilter, FaRupeeSign, FaChartLine,
  FaDownload, FaExchangeAlt, FaUser, FaShieldAlt, FaTag, FaInfoCircle,
  FaFileInvoice, FaMoneyBillWave, FaChartBar, FaStar,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import { ManagementButton, ManagementHub, ManagementTable, RefreshButton } from '../components/common';
import usePermissionAccess from '../hooks/usePermissionAccess';
import { useAuth } from '../context/AuthContext';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

const ITEMS_PER_PAGE = 15;

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const STAT_STYLES = {
  violet: { iconWrap: 'bg-violet-50 text-violet-600', gradient: 'from-violet-600 to-indigo-600' },
  emerald: { iconWrap: 'bg-emerald-50 text-emerald-600', gradient: 'from-emerald-600 to-teal-600' },
  rose: { iconWrap: 'bg-rose-50 text-rose-600', gradient: 'from-rose-600 to-pink-600' },
  blue: { iconWrap: 'bg-blue-50 text-blue-600', gradient: 'from-blue-600 to-cyan-600' },
  amber: { iconWrap: 'bg-amber-50 text-amber-600', gradient: 'from-amber-600 to-orange-600' },
};

const TRANSACTION_TYPES = [
  { value: 'salary', label: 'Salary', icon: FaMoneyBillWave, color: 'emerald' },
  { value: 'reimbursement', label: 'Reimbursement', icon: FaFileInvoice, color: 'blue' },
  { value: 'bonus', label: 'Bonus', icon: FaStar, color: 'amber' },
  { value: 'deduction', label: 'Deduction', icon: FaArrowDown, color: 'rose' },
  { value: 'advance', label: 'Advance', icon: FaMoneyBillWave, color: 'violet' },
  { value: 'other', label: 'Other', icon: FaExchangeAlt, color: 'gray' },
];

const ENTRY_TYPES = [
  { value: 'debit', label: 'Debit (Payment Out)', icon: FaArrowUp, color: 'rose' },
  { value: 'credit', label: 'Credit (Payment In)', icon: FaArrowDown, color: 'emerald' },
];

// ─── Badges ───────────────────────────────────────────────────────────────────

const TransactionTypeBadge = ({ type, compact = false }) => {
  const config = TRANSACTION_TYPES.find(t => t.value === type) || TRANSACTION_TYPES[TRANSACTION_TYPES.length - 1];
  const Icon = config.icon;
  const colorMap = {
    emerald: 'bg-emerald-100 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-100 border-blue-200 text-blue-700',
    amber: 'bg-amber-100 border-amber-200 text-amber-700',
    rose: 'bg-rose-100 border-rose-200 text-rose-700',
    violet: 'bg-violet-100 border-violet-200 text-violet-700',
    gray: 'bg-gray-100 border-gray-200 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${colorMap[config.color]} ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <Icon size={compact ? 8 : 10} />
      {config.label}
    </span>
  );
};

const EntryTypeBadge = ({ entryType, compact = false }) => {
  const isDebit = entryType === 'debit';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${isDebit
      ? 'bg-rose-100 border border-rose-200 text-rose-700'
      : 'bg-emerald-100 border border-emerald-200 text-emerald-700'
      } ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {isDebit ? <FaArrowUp size={compact ? 8 : 10} /> : <FaArrowDown size={compact ? 8 : 10} />}
      {isDebit ? 'DEBIT' : 'CREDIT'}
    </span>
  );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount || 0));
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Mobile Transaction Card ─────────────────────────────────────────────────

const MobileTransactionCard = ({ transaction, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all duration-300 group"
    onClick={() => onView(transaction)}
  >
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${transaction.entry_type === 'debit'
          ? 'bg-rose-50 text-rose-600'
          : 'bg-emerald-50 text-emerald-600'
          }`}>
          {transaction.entry_type === 'debit' ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <TransactionTypeBadge type={transaction.transaction_type} compact />
            <EntryTypeBadge entryType={transaction.entry_type} compact />
          </div>
          <p className="text-xs text-slate-400 mt-1">{formatDate(transaction.transaction_date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-base font-black ${transaction.entry_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {transaction.entry_type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
        </p>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{transaction.transaction_id}</p>
      </div>
    </div>

    {/* Details */}
    <div className="border-t border-slate-50 pt-3 mt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Balance after</span>
        <span className={`font-bold ${Number(transaction.balance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(transaction.balance)}
        </span>
      </div>
      {transaction.remark && (
        <p className="text-xs text-slate-500 mt-2 line-clamp-1">{transaction.remark}</p>
      )}
    </div>
  </motion.div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, prefix = '', suffix = '' }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-800 mt-1">
        {prefix}{typeof value === 'number' ? formatCurrency(value) : value}{suffix}
      </p>
    </div>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[color].iconWrap}`}>
      <Icon size={18} />
    </div>
  </div>
);


// ─── Main Component ──────────────────────────────────────────────────────────

const MyLedger = () => {
  const { employee, user, company } = useAuth();
  const isMountedRef = useRef(true);

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, transaction: null });
  const [viewMode, setViewMode] = useState('table');
  const [summary, setSummary] = useState({
    total_debit: 0,
    total_credit: 0,
    closing_balance: 0,
  });
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });
  const [totalItems, setTotalItems] = useState(0);

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Fetch Transactions ─────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const queryParams = new URLSearchParams();
      queryParams.append('page_no', pagination.page);
      queryParams.append('limit', pagination.limit);
      if (debouncedSearchTerm) {
        queryParams.append('search', debouncedSearchTerm);
      }
      const queryString = queryParams.toString();
      const url = `/transactions/my-ledger${queryString ? `?${queryString}` : ''}`;
      const response = await apiCall(url, 'GET', null, companyId);
      const result = await response.json();

      if (result.success) {
        let txList = [];
        if (Array.isArray(result.data)) {
          txList = result.data;
        } else if (result.data?.list) {
          txList = result.data.list;
        }
        
        const normalizedTxList = txList.map(tx => {
           let entry_type = tx.type || tx.entry_type;
           if (!entry_type && tx.amount) {
              if (tx.new_balance !== undefined && tx.old_balance !== undefined) {
                 entry_type = tx.new_balance > tx.old_balance ? 'credit' : 'debit';
              }
           }
           return {
              ...tx,
              entry_type: entry_type || 'credit',
              debit: tx.debit !== undefined ? tx.debit : (entry_type === 'debit' ? tx.amount : 0),
              credit: tx.credit !== undefined ? tx.credit : (entry_type === 'credit' ? tx.amount : 0),
              balance: tx.new_balance !== undefined ? tx.new_balance : (tx.balance || 0),
           };
        });
        
        setTransactions(normalizedTxList);

        let ob = { debit: 0, credit: 0, balance: 0 };
        const rawOb = result.data?.opening_balance ?? result.opening_balance;
        if (typeof rawOb === 'number') {
          ob = {
            balance: rawOb,
            debit: rawOb < 0 ? Math.abs(rawOb) : 0,
            credit: rawOb > 0 ? rawOb : 0
          };
        } else if (rawOb) {
          ob = rawOb;
        }
        setOpeningBalance(ob);

        if (result.meta) {
          if (result.meta.summary) {
            setSummary(result.meta.summary);
          } else if (result.meta.credit !== undefined && result.meta.debit !== undefined) {
            setSummary({
              total_credit: result.meta.credit || 0,
              total_debit: result.meta.debit || 0,
              closing_balance: result.meta.net || 0
            });
          }
          if (result.meta.total !== undefined) {
            setTotalItems(result.meta.total);
          } else {
            setTotalItems(txList.length);
          }
        } else {
          setTotalItems(txList.length);
          const totals = normalizedTxList.reduce(
            (acc, t) => {
              acc.total_debit += t.debit || 0;
              acc.total_credit += t.credit || 0;
              return acc;
            },
            { total_debit: 0, total_credit: 0 }
          );
          const lastTx = normalizedTxList[normalizedTxList.length - 1];
          setSummary({
            total_debit: totals.total_debit,
            total_credit: totals.total_credit,
            closing_balance: lastTx?.balance || 0,
          });
        }
      } else {
        toast.error(result.message || 'Failed to fetch ledger');
        setTransactions([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Connection error while fetching ledger');
      setTransactions([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit]);

  const initialFetchDone = useRef(false);
  const prevDep = useRef('');

  useEffect(() => {
    const dep = `${debouncedSearchTerm}|${pagination.page}|${pagination.limit}`;
    if (!initialFetchDone.current || prevDep.current !== dep) {
      fetchTransactions();
      initialFetchDone.current = true;
      prevDep.current = dep;
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit, fetchTransactions]);

  useEffect(() => {
    goToPage(1);
  }, [debouncedSearchTerm, goToPage]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  useEffect(() => {
    if (pagination.page > totalPages) goToPage(totalPages);
  }, [goToPage, pagination.page, totalPages]);

  const paginatedData = transactions;

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(
    () => [
      {
        label: 'Opening Balance',
        value: openingBalance.balance,
        icon: FaChartLine,
        color: 'violet',
        prefix: '',
      },
      {
        label: 'Total Credit',
        value: summary.total_credit,
        icon: FaArrowDown,
        color: 'emerald',
        prefix: '+',
      },
      {
        label: 'Total Debit',
        value: summary.total_debit,
        icon: FaArrowUp,
        color: 'rose',
        prefix: '-',
      },
      {
        label: 'Closing Balance',
        value: summary.closing_balance,
        icon: FaWallet,
        color: summary.closing_balance >= 0 ? 'emerald' : 'rose',
        prefix: '',
      },
    ],
    [openingBalance, summary]
  );

  const handlePageChange = useCallback(
    (page) => {
      goToPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [goToPage]
  );

  // ── Table Columns ──────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'transaction_id',
      label: 'Transaction ID',
      render: (tx) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-slate-600">{tx.transaction_id}</span>
          <span className="text-[10px] text-slate-400">{formatDate(tx.transaction_date)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (tx) => (
        <div className="flex flex-col gap-1">
          <TransactionTypeBadge type={tx.transaction_type} compact />
          <EntryTypeBadge entryType={tx.entry_type} compact />
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (tx) => (
        <span className={`font-bold text-sm ${tx.entry_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
          {tx.entry_type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
        </span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (tx) => (
        <span className={`font-mono font-bold text-sm ${Number(tx.balance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(tx.balance)}
        </span>
      ),
    },
    {
      key: 'remark',
      label: 'Remark',
      render: (tx) => (
        <p className="text-xs text-slate-500 max-w-[200px] truncate">
          {tx.remark || '—'}
        </p>
      ),
    },
  ];

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-violet-500 text-4xl" />
          <p className="text-slate-400 font-medium animate-pulse">Loading your ledger...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ManagementHub
      eyebrow={<><FaChartBar size={11} /> Financial Ledger</>}
      title="My Ledger"
      description="Track all your salary, reimbursements, and other financial transactions in one place."
      accent="violet"
      actions={
        <RefreshButton loading={loading} onClick={fetchTransactions}>
          Refresh
        </RefreshButton>
      }
    >
      <div className="space-y-6 p-2 lg:p-0">
        {/* ── Stats ── */}
        {!loading && transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                prefix={stat.prefix}
              />
            ))}
          </motion.div>
        )}

        {/* ── Balance Summary Card ── */}
        {!loading && summary.closing_balance !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-xl ${summary.closing_balance >= 0
              ? STAT_STYLES.emerald.gradient
              : STAT_STYLES.rose.gradient
              }`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-6 right-16 h-28 w-28 rounded-full bg-white/5" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaWallet size={11} className="text-white/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                      Current Balance
                    </span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">
                    {formatCurrency(Math.abs(summary.closing_balance))}
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {summary.closing_balance >= 0 ? 'In Credit' : 'In Debit'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-300" />
                      <span className="text-[10px] text-white/60 uppercase">Total Credit</span>
                    </div>
                    <span className="font-bold">{formatCurrency(summary.total_credit)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-300" />
                      <span className="text-[10px] text-white/60 uppercase">Total Debit</span>
                    </div>
                    <span className="font-bold">{formatCurrency(summary.total_debit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}



        {/* ── Search & View Switcher Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search by transaction ID, remark, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* ── Transaction List ── */}
        {totalItems === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <FaExchangeAlt size={24} />
            </div>
            <p className="text-slate-500 font-bold">No transactions found</p>
            <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">
              {searchTerm
                ? `No matching transactions for your search`
                : 'No transactions recorded'}
            </p>
          </motion.div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={paginatedData}
            columns={columns}
            rowKey={(row) => row.id}
            onRowClick={(row) => setViewModal({ open: true, transaction: row })}
            getActions={(row) => [
              {
                label: 'View Details',
                icon: <FaEye size={13} />,
                onClick: () => setViewModal({ open: true, transaction: row }),
                className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50',
              },
            ]}
            accent="violet"
          />
        ) : (
          <ManagementGrid>
            {paginatedData.map((transaction) => (
              <MobileTransactionCard
                key={transaction.id}
                transaction={transaction}
                onView={(t) => setViewModal({ open: true, transaction: t })}
              />
            ))}
          </ManagementGrid>
        )}

        {/* ── Pagination ── */}
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

      {/* ── View Transaction Modal ── */}
      <Modal
        isOpen={viewModal.open && !!viewModal.transaction}
        onClose={() => setViewModal({ open: false, transaction: null })}
        title="Transaction Details"
        subtitle={viewModal.transaction?.transaction_id}
        icon={<FaInfoCircle size={22} />}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setViewModal({ open: false, transaction: null })}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
            >
              Close
            </button>
          </>
        }
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <TransactionTypeBadge type={viewModal.transaction.transaction_type} />
              <EntryTypeBadge entryType={viewModal.transaction.entry_type} />
            </div>

            {/* Amount Card */}
            <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg bg-gradient-to-br ${viewModal.transaction.entry_type === 'debit'
              ? 'from-rose-600 via-pink-600 to-rose-800'
              : 'from-emerald-600 via-teal-600 to-emerald-800'
              }`}>
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2">
                Transaction Amount
              </p>
              <p className="text-3xl font-black tracking-tight">
                {viewModal.transaction.entry_type === 'debit' ? '-' : '+'}{formatCurrency(viewModal.transaction.amount)}
              </p>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-white/50 uppercase tracking-widest">Balance After</p>
                  <p className="text-base font-bold">{formatCurrency(viewModal.transaction.balance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-medium">{formatDate(viewModal.transaction.transaction_date)}</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                <p className="text-sm font-mono font-bold text-slate-700">{viewModal.transaction.transaction_id}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created On</p>
                <p className="text-sm font-bold text-slate-700">{formatDateTime(viewModal.transaction.created_at)}</p>
              </div>
              {viewModal.transaction.remark && (
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remark</p>
                  <p className="text-sm font-medium text-slate-700">{viewModal.transaction.remark}</p>
                </div>
              )}
              {viewModal.transaction.employee && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee</p>
                  <div className="flex items-center gap-2">
                    <FaUser size={12} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">{viewModal.transaction.employee.name}</p>
                  </div>
                </div>
              )}
              {viewModal.transaction.created_by && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
                  <div className="flex items-center gap-2">
                    <FaUser size={12} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">{viewModal.transaction.created_by.name}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{viewModal.transaction.created_by.email}</p>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="flex items-center gap-3 p-4 bg-violet-50/60 border border-violet-100 rounded-xl">
              <FaShieldAlt className="text-violet-400 shrink-0" size={16} />
              <p className="text-xs text-violet-600 font-medium">
                This transaction is recorded in your permanent financial history.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </ManagementHub>
  );
};

export default MyLedger;