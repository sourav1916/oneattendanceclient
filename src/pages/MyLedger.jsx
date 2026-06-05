import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FaWallet, FaArrowUp, FaArrowDown, FaSearch, FaEye, FaSpinner,
  FaRupeeSign, FaChartLine, FaExchangeAlt, FaUser, FaShieldAlt,
  FaTag, FaInfoCircle, FaFileInvoice, FaMoneyBillWave, FaChartBar,
  FaStar, FaEllipsisV,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import { ManagementHub, ManagementTable, RefreshButton } from '../components/common';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { value: 'bonus', label: 'Bonus', icon: FaStar, color: 'amber' },
  { value: 'reimbursement', label: 'Reimbursement', icon: FaFileInvoice, color: 'blue' },
  { value: 'deduction', label: 'Deduction', icon: FaArrowDown, color: 'rose' },
  { value: 'advance', label: 'Advance', icon: FaMoneyBillWave, color: 'violet' },
  { value: 'fine', label: 'Fine', icon: FaTag, color: 'violet' },
  { value: 'receive', label: 'Receive', icon: FaArrowDown, color: 'blue' },
  { value: 'payment', label: 'Payment', icon: FaArrowUp, color: 'rose' },
  { value: 'opening_balance', label: 'Opening Balance', icon: FaWallet, color: 'gray' },
  { value: 'other', label: 'Other', icon: FaExchangeAlt, color: 'gray' },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount || 0));

const formatNumber = (num) =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Normalize transaction from API ──────────────────────────────────────────
const normalizeTx = (tx) => {
  const entry_type = tx.type || tx.entry_type || (
    (tx.new_balance !== undefined && tx.old_balance !== undefined)
      ? (tx.new_balance > tx.old_balance ? 'credit' : 'debit')
      : 'credit'
  );
  return {
    ...tx,
    entry_type,
    debit:   tx.debit   !== undefined ? tx.debit   : (entry_type === 'debit'  ? tx.amount : 0),
    credit:  tx.credit  !== undefined ? tx.credit  : (entry_type === 'credit' ? tx.amount : 0),
    balance: tx.new_balance !== undefined ? tx.new_balance : (tx.balance || 0),
    remark:  tx.remark || tx.remarks || '',
    created_by: tx.created_by || tx.create_by || null,
    created_at: tx.created_at || tx.create_date || '',
  };
};

// ─── Badges ───────────────────────────────────────────────────────────────────

const colorMap = {
  emerald: 'bg-emerald-100 border-emerald-200 text-emerald-700',
  blue:    'bg-blue-100 border-blue-200 text-blue-700',
  amber:   'bg-amber-100 border-amber-200 text-amber-700',
  rose:    'bg-rose-100 border-rose-200 text-rose-700',
  violet:  'bg-violet-100 border-violet-200 text-violet-700',
  gray:    'bg-gray-100 border-gray-200 text-gray-600',
};

const TransactionTypeBadge = ({ type, compact = false }) => {
  const config = TRANSACTION_TYPES.find(t => t.value === type) || TRANSACTION_TYPES[TRANSACTION_TYPES.length - 1];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${colorMap[config.color]} ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <Icon size={compact ? 8 : 10} />
      {config.label}
    </span>
  );
};

const EntryTypeBadge = ({ entryType, compact = false }) => {
  const isDebit = entryType === 'debit';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${isDebit
      ? 'bg-rose-100 border-rose-200 text-rose-700'
      : 'bg-emerald-100 border-emerald-200 text-emerald-700'
    } ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      {isDebit ? <FaArrowUp size={compact ? 8 : 10} /> : <FaArrowDown size={compact ? 8 : 10} />}
      {isDebit ? 'DEBIT' : 'CREDIT'}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, prefix = '' }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{label}</p>
      <p className="text-2xl font-black text-slate-800 mt-1">{prefix}{formatCurrency(value)}</p>
    </div>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${STAT_STYLES[color].iconWrap}`}>
      <Icon size={18} />
    </div>
  </div>
);

const LedgerSummaryStrip = ({ row }) => {
  const isOpening = row.isOpeningBalance;
  const balanceClass = Number(row.balance) >= 0 ? 'text-blue-600' : 'text-rose-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`xs:col-span-2 sm:col-span-2 lg:col-span-3 xl:col-span-4 rounded-xl border px-4 py-3 shadow-sm ${
        isOpening ? 'border-violet-100 bg-violet-50/70' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
            isOpening ? 'border-violet-200 bg-white text-violet-700' : 'border-slate-200 bg-white text-slate-700'
          }`}>
            <FaWallet size={11} />
            {isOpening ? 'Opening Balance' : 'Total'}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {isOpening ? 'Starting balance' : 'Summary'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-xs sm:min-w-[420px]">
          <div>
            <p className="font-bold uppercase tracking-wide text-slate-400">Debit</p>
            <p className="font-mono font-bold text-blue-600">{formatNumber(row.debit)}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-slate-400">Credit</p>
            <p className="font-mono font-bold text-amber-600">{formatNumber(row.credit)}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wide text-slate-400">Balance</p>
            <p className={`font-mono font-bold ${balanceClass}`}>{formatNumber(row.balance)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Mobile Transaction Card ──────────────────────────────────────────────────

const MobileTransactionCard = ({ transaction, onView }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all duration-300 group"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${transaction.entry_type === 'debit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {transaction.entry_type === 'debit' ? <FaArrowUp size={16} /> : <FaArrowDown size={16} />}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
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
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{transaction.transaction_id || `#${transaction.id}`}</p>
      </div>
    </div>

    <div className="border-t border-slate-50 pt-3 mt-1">
      <div className="grid grid-cols-3 gap-2 text-right text-xs mb-3">
        <div>
          <p className="font-bold uppercase tracking-wide text-slate-400">Old Balance</p>
          <p className="font-mono font-bold text-slate-600">{formatNumber(transaction.old_balance)}</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-slate-400">New Balance</p>
          <p className={`font-mono font-bold ${Number(transaction.new_balance) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{formatNumber(transaction.new_balance)}</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-slate-400">Amount</p>
          <p className={`font-mono font-bold ${transaction.entry_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>{formatNumber(transaction.amount)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {transaction.employee ? (
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <FaUser size={8} /> {transaction.employee.name}
            </p>
          ) : transaction.remark ? (
            <p className="text-xs text-slate-500 line-clamp-1">{transaction.remark}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onView(transaction)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-400 flex items-center justify-center transition-all">
            <FaEye size={12} />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

// ─── View Modal ───────────────────────────────────────────────────────────────

const NarrowLedgerTable = ({ rows, onView, tiny = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    className="overflow-hidden rounded-xl bg-white border border-violet-100 shadow-violet-100/50 shadow-sm w-full"
  >
    <div className={`${tiny ? 'grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.72fr))_1.75rem] px-1.5 text-[7px]' : 'grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.82fr))_2rem] px-2 text-[9px]'} grid bg-gradient-to-r from-gray-100 to-gray-200 py-2 text-center font-bold uppercase leading-tight text-gray-600`}>
      <span>Particulars</span>
      <span>Old</span>
      <span>New</span>
      <span>Amount</span>
      <span />
    </div>
    <div className="divide-y divide-gray-100">
      {rows.map((tx) => {
        const clickable = !tx.isOpeningBalance && !tx.isTotalRow;
        const name = tx.remark || tx.employee?.name || tx.created_by?.name || '—';
        const displayedBalance = tx.isTotalRow ? tx.balance : tx.new_balance;
        const displayedAmount = tx.isTotalRow ? (tx.debit || 0) + (tx.credit || 0) : tx.amount;

        return (
          <div
            key={tx.id}
            onClick={clickable ? () => onView(tx) : undefined}
            className={`${tiny ? 'px-1 py-1.5' : 'px-2 py-2'} ${clickable ? 'cursor-pointer hover:bg-slate-50' : ''}`}
          >
            <div className={`${tiny ? 'grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.72fr))_1.75rem] gap-0.5 text-[8px]' : 'grid-cols-[minmax(0,1.15fr)_repeat(3,minmax(0,0.82fr))_2rem] gap-1 text-[10px]'} grid items-center text-center leading-tight text-gray-700`}>
              <div className="flex min-w-0 flex-col items-center gap-0 text-center">
                {tx.isTotalRow ? (
                  <span className={`${tiny ? 'text-[7px]' : 'text-[9px]'} font-black text-slate-800`}>Total</span>
                ) : tx.isOpeningBalance ? (
                  <span className={`${tiny ? 'text-[7px]' : 'text-[9px]'} font-bold text-slate-800`}>Opening Balance</span>
                ) : (
                  <>
                    <span className={`${tiny ? 'text-[6px]' : 'text-[8px]'} font-medium text-slate-400`}>{formatDate(tx.transaction_date)}</span>
                    <span className={`${tiny ? 'text-[7px]' : 'text-[9px]'} max-w-full truncate font-bold text-slate-800`}>{name}</span>
                    <span className={`${tiny ? 'scale-[0.62]' : 'scale-75'} mt-0.5 origin-top`}><TransactionTypeBadge type={tx.transaction_type} compact /></span>
                  </>
                )}
              </div>
              <span className="break-all font-mono font-bold text-slate-600">
                {tx.isTotalRow ? '—' : formatNumber(tx.old_balance)}
              </span>
              <span className={`break-all font-mono font-bold ${Number(displayedBalance) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {formatNumber(displayedBalance)}
              </span>
              <span className={`break-all font-mono font-bold ${tx.entry_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatNumber(displayedAmount)}
              </span>
              <div className="flex justify-end">
                {clickable ? (
                <ActionMenu
                  menuId={`narrow-my-ledger-${tx.id}`}
                  trigger={
                    <button
                      type="button"
                      className={`${tiny ? 'h-5 w-5 rounded-md' : 'h-6 w-6 rounded-lg'} flex items-center justify-center border border-gray-200 bg-white text-gray-500 transition-all hover:border-violet-300 hover:text-violet-600 hover:shadow-sm active:scale-95`}
                    >
                      <FaEllipsisV size={tiny ? 8 : 10} />
                    </button>
                  }
                  actions={[
                    {
                      label: 'View Details',
                      icon: <FaEye size={13} />,
                      onClick: () => onView(tx),
                      className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50',
                    },
                  ]}
                />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </motion.div>
);

const ViewModal = ({ open, onClose, transaction: tx }) => {
  if (!tx) return null;
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Transaction Details"
      subtitle={tx.transaction_id || `#${tx.id}`}
      icon={<FaInfoCircle size={22} />}
      size="lg"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          Close
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <TransactionTypeBadge type={tx.transaction_type} />
          <EntryTypeBadge entryType={tx.entry_type} />
        </div>

        <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg bg-gradient-to-br ${tx.entry_type === 'debit' ? 'from-rose-600 via-pink-600 to-rose-800' : 'from-emerald-600 via-teal-600 to-emerald-800'}`}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2">Transaction Amount</p>
          <p className="text-3xl font-black tracking-tight">
            {tx.entry_type === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
          </p>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-[9px] text-white/50 uppercase tracking-widest">Balance After</p>
              <p className="text-base font-bold">{formatNumber(tx.balance)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/50 uppercase tracking-widest">Date</p>
              <p className="text-sm font-medium">{formatDate(tx.transaction_date)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
            <p className="text-sm font-mono font-bold text-slate-700">{tx.transaction_id || `#${tx.id}`}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created On</p>
            <p className="text-sm font-bold text-slate-700">{formatDateTime(tx.created_at)}</p>
          </div>
          {tx.remark && (
            <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remark</p>
              <p className="text-sm font-medium text-slate-700">{tx.remark}</p>
            </div>
          )}
          {tx.created_by && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <FaUser size={12} className="text-slate-400" />
                <p className="text-sm font-bold text-slate-700">{tx.created_by.name}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">{tx.created_by.email}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 bg-violet-50/60 border border-violet-100 rounded-xl">
          <FaShieldAlt className="text-violet-400 shrink-0" size={16} />
          <p className="text-xs text-violet-600 font-medium">
            This transaction is recorded in your permanent financial history.
          </p>
        </div>
      </div>
    </Modal>
  );
};

// ─── Window Width Hook (local to this page) ─────────────────────────────────
const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MyLedger = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewModal, setViewModal] = useState({ open: false, transaction: null });
  const [viewMode, setViewMode] = useState('table');
  const [totalItems, setTotalItems] = useState(0);
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });
  const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0, closing_balance: 0 });

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { goToPage(1); }, [debouncedSearchTerm, goToPage]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const params = new URLSearchParams();
      params.append('page_no', pagination.page);
      params.append('limit', pagination.limit);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      const url = `/transactions/my-ledger?${params.toString()}`;
      const res = await apiCall(url, 'GET', null, companyId);
      const result = await res.json();

      if (result.success) {
        let txList = Array.isArray(result.data) ? result.data : (result.data?.list || []);
        const normalized = txList.map(normalizeTx);
        setTransactions(normalized);

        // Opening balance
        const rawOb = result.data?.opening_balance ?? result.opening_balance;
        if (typeof rawOb === 'number') {
          setOpeningBalance({
            balance: rawOb,
            debit:  rawOb < 0 ? Math.abs(rawOb) : 0,
            credit: rawOb > 0 ? rawOb : 0,
          });
        } else if (rawOb) {
          setOpeningBalance(rawOb);
        }

        // Summary
        if (result.meta) {
          if (result.meta.summary) {
            setSummary(result.meta.summary);
          } else {
            setSummary({
              total_credit:    result.meta.credit || 0,
              total_debit:     result.meta.debit  || 0,
              closing_balance: result.meta.net    || 0,
            });
          }
          setTotalItems(result.meta.total ?? txList.length);
        } else {
          const totals = normalized.reduce(
            (acc, t) => { acc.total_debit += t.debit || 0; acc.total_credit += t.credit || 0; return acc; },
            { total_debit: 0, total_credit: 0 }
          );
          const last = normalized[normalized.length - 1];
          setSummary({ ...totals, closing_balance: last?.balance || 0 });
          setTotalItems(txList.length);
        }
      } else {
        toast.error(result.message || 'Failed to fetch ledger');
        setTransactions([]); setTotalItems(0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error while fetching ledger');
      setTransactions([]); setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit]);

  const initialDone = useRef(false);
  const prevDep = useRef('');

  useEffect(() => {
    const dep = `${debouncedSearchTerm}|${pagination.page}|${pagination.limit}`;
    if (!initialDone.current || prevDep.current !== dep) {
      fetchTransactions();
      initialDone.current = true;
      prevDep.current = dep;
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit, fetchTransactions]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));
  useEffect(() => { if (pagination.page > totalPages) goToPage(totalPages); }, [goToPage, pagination.page, totalPages]);

  const handlePageChange = useCallback((page) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [goToPage]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => [
    { label: 'Opening Balance', value: openingBalance.balance, icon: FaChartLine, color: 'violet' },
    { label: 'Total Credit',    value: summary.total_credit,  icon: FaArrowDown,  color: 'emerald', prefix: '+' },
    { label: 'Total Debit',     value: summary.total_debit,   icon: FaArrowUp,    color: 'rose',    prefix: '-' },
    { label: 'Closing Balance', value: summary.closing_balance, icon: FaWallet,   color: summary.closing_balance >= 0 ? 'emerald' : 'rose' },
  ], [openingBalance, summary]);

  // ── Window width for responsive columns ────────────────────────────────────
  const windowWidth = useWindowWidth();
  const isCompactView = windowWidth <= 1423 && windowWidth >= 320;
  const isNarrowLedgerView = windowWidth < 662 && windowWidth >= 320;
  const isTinyLedgerView = windowWidth < 480 && windowWidth >= 320;

  // ── Table Columns ──────────────────────────────────────────────────────────

  const columns = useMemo(() => {
    // ── Shared financial columns (always shown) ──
    const oldBalanceCol = {
      key: 'old_balance',
      label: 'Old Balance',
      render: (tx) => {
        if (tx.isTotalRow) return <span className="text-slate-400 font-semibold">—</span>;
        return <span className="font-bold text-slate-600 font-mono">{formatNumber(tx.old_balance)}</span>;
      },
      className: 'text-center',
    };
    const newBalanceCol = {
      key: 'new_balance',
      label: 'New Balance',
      render: (tx) => {
        if (tx.isTotalRow) return <span className={`font-mono font-bold text-sm ${tx.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{formatNumber(tx.balance)}</span>;
        return (
          <span className={`font-mono font-bold ${tx.new_balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatNumber(tx.new_balance)}
          </span>
        );
      },
      className: 'text-center',
    };
    const amountCol = {
      key: 'amount',
      label: 'Amount',
      render: (tx) => {
        if (tx.isTotalRow) return <span className="font-bold text-slate-800 font-mono text-sm">{formatNumber((tx.debit || 0) + (tx.credit || 0))}</span>;
        return (
          <span className={`font-mono font-bold ${tx.entry_type === 'debit' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatNumber(tx.amount)}
          </span>
        );
      },
      className: 'text-center',
    };

    // ── Compact view (662px – 1423px): merge Date+Particulars+Type into one column ──
    if (isCompactView) {
      return [
        {
          key: 'particulars_merged',
          label: 'Particulars',
          render: (tx) => {
            if (tx.isTotalRow) return <span className="font-black text-slate-800 text-sm">Total</span>;
            if (tx.isOpeningBalance) return <span className="font-bold text-slate-800 text-sm">Opening Balance</span>;
            const name = tx.remark || tx.employee?.name || tx.created_by?.name || '—';
            return (
              <div className="flex flex-col items-center gap-0.5 text-center min-w-0">
                <span className="text-[10px] text-slate-400 font-medium leading-tight">{formatDate(tx.transaction_date)}</span>
                <span className="font-bold text-slate-800 text-xs leading-tight truncate">{name}</span>
                <div className="mt-0.5"><TransactionTypeBadge type={tx.transaction_type} compact /></div>
              </div>
            );
          },
          className: 'text-center',
        },
        oldBalanceCol,
        newBalanceCol,
        amountCol,
      ];
    }

    // ── Full-width view (>= 1424px): all 7 separate columns ──
    return [
      {
        key: 'row_num',
        label: '#',
        render: (tx, idx) => {
          if (tx.isTotalRow) return <span className="font-black text-slate-800 text-sm">Total</span>;
          if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
          const offset = pagination.page === 1 ? -1 : 0;
          return <span className="font-medium text-slate-400">{(pagination.page - 1) * pagination.limit + idx + 1 + offset}</span>;
        },
        className: 'w-12 text-center',
      },
      {
        key: 'transaction_date',
        label: 'Date',
        render: (tx) => {
          if (tx.isTotalRow) return null;
          if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
          return <span className="whitespace-nowrap font-medium text-slate-600">{formatDate(tx.transaction_date)}</span>;
        },
      },
      {
        key: 'particulars',
        label: 'Particulars',
        render: (tx) => {
          if (tx.isTotalRow) return null;
          if (tx.isOpeningBalance) return <span className="font-bold text-slate-800">Opening Balance</span>;
          if (tx.remark) return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800">{tx.remark}</span>
            </div>
          );
          const name = tx.employee?.name || tx.created_by?.name || '—';
          const email = tx.employee?.email || tx.created_by?.email || '';
          return (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800">{name}</span>
              {email && <span className="text-[10px] text-slate-400">{email}</span>}
            </div>
          );
        },
      },
      {
        key: 'type',
        label: 'Type',
        render: (tx) => {
          if (tx.isTotalRow) return null;
          if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
          return <TransactionTypeBadge type={tx.transaction_type} compact />;
        },
      },
      oldBalanceCol,
      newBalanceCol,
      amountCol,
    ];
  }, [pagination.page, pagination.limit, isCompactView, isNarrowLedgerView]);

  // ── Table Rows (with opening balance row + total row) ──────────────────────

  const tableRows = useMemo(() => {
    let rows = [];
    if (pagination.page === 1) {
      rows.push({
        isOpeningBalance: true,
        id: 'opening-balance',
        transaction_date: '',
        remark: 'Opening Balance',
        transaction_type: 'opening_balance',
        entry_type: openingBalance.debit > 0 ? 'debit' : 'credit',
        amount: Math.abs(openingBalance.balance || 0),
        old_balance: 0,
        new_balance: openingBalance.balance || 0,
        debit:  openingBalance.debit  || 0,
        credit: openingBalance.credit || 0,
        balance: openingBalance.balance || 0,
      });
    }
    rows = [...rows, ...transactions];
    rows.push({
      isTotalRow: true,
      id: 'total-row',
      debit:   summary.total_debit    || 0,
      credit:  summary.total_credit   || 0,
      balance: summary.closing_balance || 0,
    });
    return rows;
  }, [transactions, pagination.page, openingBalance, summary]);

  // ── Loading ────────────────────────────────────────────────────────────────

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
      <div className="space-y-6">
        {/* Stats */}
        {!loading && transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map(s => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} prefix={s.prefix || ''} />
            ))}
          </motion.div>
        )}

        {/* Balance Banner */}
        {!loading && summary.closing_balance !== 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-xl ${summary.closing_balance >= 0 ? STAT_STYLES.emerald.gradient : STAT_STYLES.rose.gradient}`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-6 right-16 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FaWallet size={11} className="text-white/60" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Current Balance</span>
                  </div>
                  <p className="text-3xl font-black tracking-tight">{formatCurrency(Math.abs(summary.closing_balance))}</p>
                  <p className="text-sm text-white/70 mt-1">{summary.closing_balance >= 0 ? 'In Credit' : 'In Debit'}</p>
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

        {/* Search + View Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
        >
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search by ID, remark, or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center justify-end">
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* Transaction List */}
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
              {searchTerm ? 'No matches for your search' : 'No transactions recorded yet'}
            </p>
          </motion.div>
        ) : viewMode === 'table' && isNarrowLedgerView ? (
          <NarrowLedgerTable
            rows={tableRows}
            onView={(row) => setViewModal({ open: true, transaction: row })}
            tiny={isTinyLedgerView}
          />
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={tableRows}
            columns={columns}
            rowKey={row => row.id}
            onRowClick={(row) => {
              if (row.isOpeningBalance || row.isTotalRow) return;
              setViewModal({ open: true, transaction: row });
            }}
            getActions={(row) => {
              if (row.isOpeningBalance || row.isTotalRow) return [];
              return [
                {
                  label: 'View Details',
                  icon: <FaEye size={13} />,
                  onClick: () => setViewModal({ open: true, transaction: row }),
                  className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50',
                },
              ];
            }}
            accent="violet"
          />
        ) : (
          <ManagementGrid viewMode={viewMode}>
            {tableRows.map(tx => (
              tx.isOpeningBalance || tx.isTotalRow ? (
                <LedgerSummaryStrip key={tx.id} row={tx} />
              ) : (
                <MobileTransactionCard
                  key={tx.id}
                  transaction={tx}
                  onView={t => setViewModal({ open: true, transaction: t })}
                />
              )
            ))}
          </ManagementGrid>
        )}

        {/* Pagination */}
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
      <ViewModal
        open={viewModal.open && !!viewModal.transaction}
        onClose={() => setViewModal({ open: false, transaction: null })}
        transaction={viewModal.transaction}
      />
    </ManagementHub>
  );
};

export default MyLedger;
