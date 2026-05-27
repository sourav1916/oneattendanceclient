import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaWallet, FaArrowUp, FaArrowDown, FaSearch, FaEye, FaSpinner,
  FaTimes, FaCalendarAlt, FaFilter, FaRupeeSign, FaChartLine,
  FaDownload, FaExchangeAlt, FaUser, FaShieldAlt, FaTag, FaInfoCircle,
  FaFileInvoice, FaMoneyBillWave, FaChartBar, FaStar, FaPlus, FaEdit,
  FaTrash, FaCheck, FaUniversity, FaMobileAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import Modal from '../components/Modal';
import { ManagementButton, ManagementHub, ManagementTable, RefreshButton } from '../components/common';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import SelectField from '../components/SelectField';
import BankAccountSelectField from '../components/BankAccountSelectField';
import { DatePickerField } from '../components/DatePicker';

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

// Valid transaction types for Add Transaction (opening_balance excluded — handled separately)
const TRANSACTION_TYPES = [
  { value: 'salary', label: 'Salary', icon: FaMoneyBillWave, color: 'emerald' },
  { value: 'bonus', label: 'Bonus', icon: FaStar, color: 'amber' },
  { value: 'receive', label: 'Receive', icon: FaArrowDown, color: 'blue' },
  { value: 'payment', label: 'Payment', icon: FaArrowUp, color: 'rose' },
  { value: 'fine', label: 'Fine', icon: FaTag, color: 'violet' },
  { value: 'opening_balance', label: 'Opening Balance', icon: FaWallet, color: 'gray' },
];

// Types shown inside Add Transaction dropdown (no opening_balance)
const ADD_TRANSACTION_TYPES = TRANSACTION_TYPES.filter(t => t.value !== 'opening_balance');

const ENTRY_TYPES = [
  { value: 'debit', label: 'Debit (Payment Out)', icon: FaArrowUp, color: 'rose' },
  { value: 'credit', label: 'Credit (Payment In)', icon: FaArrowDown, color: 'emerald' },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount || 0));

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num || 0);
};

const renderParticulars = (tx) => {
  if (tx.remark) {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-slate-800">{tx.remark}</span>
      </div>
    );
  }
  const name = tx.employee?.name || tx.created_by?.name || '—';
  const sub = tx.employee?.email || tx.created_by?.email || '';
  return (
    <div className="flex flex-col">
      <span className="font-bold text-slate-800">{name}</span>
      {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
    </div>
  );
};


const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

// ─── Badges & Select Formatters ────────────────────────────────────────────────

const colorMap = {
  emerald: 'bg-emerald-100 border-emerald-200 text-emerald-700',
  blue: 'bg-blue-100 border-blue-200 text-blue-700',
  amber: 'bg-amber-100 border-amber-200 text-amber-700',
  rose: 'bg-rose-100 border-rose-200 text-rose-700',
  violet: 'bg-violet-100 border-violet-200 text-violet-700',
  gray: 'bg-gray-100 border-gray-200 text-gray-600',
};

const formatTransactionOption = (option) => {
  const config = TRANSACTION_TYPES.find(t => t.value === option.value);
  if (!config) return option.label;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${colorMap[config.color]}`}>
        <Icon size={10} />
      </span>
      <span className="font-semibold text-sm text-slate-700">{option.label}</span>
    </div>
  );
};

const formatEntryOption = (option) => {
  const config = ENTRY_TYPES.find(t => t.value === option.value);
  if (!config) return option.label;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${colorMap[config.color]}`}>
        <Icon size={10} />
      </span>
      <span className="font-semibold text-sm text-slate-700">{option.label}</span>
    </div>
  );
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

// ─── Mobile Card ──────────────────────────────────────────────────────────────

const MobileTransactionCard = ({ transaction, onView, onEdit, onDelete }) => (
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
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{transaction.transaction_id}</p>
      </div>
    </div>

    <div className="border-t border-slate-50 pt-3 mt-1 flex items-center justify-between">
      <div>
        <span className="text-xs text-slate-400">Balance: </span>
        <span className={`text-xs font-bold ${Number(transaction.balance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(transaction.balance)}
        </span>
        {transaction.employee && (
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <FaUser size={8} /> {transaction.employee.name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onView(transaction)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-violet-50 hover:text-violet-600 text-slate-400 flex items-center justify-center transition-all">
          <FaEye size={12} />
        </button>
        <button onClick={() => onEdit(transaction)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all">
          <FaEdit size={12} />
        </button>
        <button onClick={() => onDelete(transaction)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-all">
          <FaTrash size={12} />
        </button>
      </div>
    </div>
  </motion.div>
);

// ─── Field Components ─────────────────────────────────────────────────────────

const FormField = ({ label, children, required }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none text-sm font-medium text-slate-700 transition-all";
const selectClass = `${inputClass} cursor-pointer appearance-none`;

// ─── Helper: does this transaction type need account IDs? ─────────────────────
// payment → employee_account + company_account
// receive → employee_account + company_account
const typeNeedsAccounts = (type) => ['payment', 'receive'].includes(type);

// salary / bonus / fine / receive / payment → no entry_type field (always inferred server-side)
// opening_balance → entry_type required
const typeNeedsEntryType = (type) => type === 'opening_balance';

// ─── Add Transaction Modal ────────────────────────────────────────────────────

const EMPTY_FORM = {
  transaction_type: 'salary',
  amount: '',
  transaction_date: new Date().toISOString().split('T')[0],
  employee_account: '',
  company_account: '',
  remark: '',
};

const AddTransactionModal = ({ open, onClose, onSuccess, employeeId }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const needsAccounts = typeNeedsAccounts(form.transaction_type);

  const handleSubmit = async () => {
    if (!employeeId || !form.amount || !form.transaction_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      // Build payload according to transaction type
      const body = {
        employee_id: Number(employeeId),
        transaction_type: form.transaction_type,
        amount: parseFloat(form.amount),
        transaction_date: form.transaction_date,
      };

      // payment & receive: optionally include account IDs
      if (needsAccounts) {
        if (form.employee_account) body.employee_account = Number(form.employee_account);
        if (form.company_account) body.company_account = Number(form.company_account);
      }

      // remark is optional for all types
      if (form.remark.trim()) body.remark = form.remark.trim();

      const companyId = getCompanyId();
      const res = await apiCall('/transactions/add', 'POST', body, companyId);
      const data = await res.json();
      if (data.success) {
        toast.success('Transaction added successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to add transaction');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add Transaction"
      subtitle="Record a new financial transaction"
      icon={<FaPlus size={20} />}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={13} /> : <FaCheck size={13} />}
            {saving ? 'Saving...' : 'Add Transaction'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          {/* Transaction Type */}
          <FormField label="Transaction Type" required>
            <SelectField
              options={ADD_TRANSACTION_TYPES}
              value={ADD_TRANSACTION_TYPES.find(t => t.value === form.transaction_type)}
              onChange={opt => set('transaction_type', opt.value)}
              formatOptionLabel={formatTransactionOption}
            />
          </FormField>

          {/* Amount */}
          <FormField label="Amount" required>
            <div className="relative">
              <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`${inputClass} pl-9`}
                value={form.amount}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) set('amount', val);
                }}
              />
            </div>
          </FormField>

          {/* Transaction Date */}
          <FormField label="Transaction Date" required>
            <DatePickerField
              mode="single"
              initialTab="single"
              showQuickSelect={false}
              value={form.transaction_date}
              onChange={val => set('transaction_date', val)}
              buttonClassName={`${inputClass} text-left font-normal`}
            />
          </FormField>

          {/* Account IDs — only for payment & receive */}
          {needsAccounts && (
            <>
              <FormField label="Employee Account">
                <BankAccountSelectField
                  ownerType="employee"
                  employeeId={employeeId}
                  value={form.employee_account}
                  onChange={(val) => set('employee_account', val)}
                  placeholder="Search employee account..."
                />
              </FormField>
              <FormField label="Company Account">
                <BankAccountSelectField
                  ownerType="company"
                  value={form.company_account}
                  onChange={(val) => set('company_account', val)}
                  placeholder="Search company account..."
                />
              </FormField>
            </>
          )}
        </div>

        {/* Remark — available for all types */}
        <FormField label="Remark">
          <textarea
            rows={3}
            placeholder="Optional note..."
            className={`${inputClass} resize-none`}
            value={form.remark}
            onChange={e => set('remark', e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

// ─── Opening Balance Modal ────────────────────────────────────────────────────
// Used for both Create (isEdit=false) and Edit (isEdit=true) opening balance.

const EMPTY_OB_FORM = {
  entry_type: 'credit',
  amount: '',
  transaction_date: new Date().toISOString().split('T')[0],
  remark: '',
};

const OpeningBalanceModal = ({ open, onClose, onSuccess, employeeId, isEdit, existingBalance }) => {
  const [form, setForm] = useState(EMPTY_OB_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEdit && existingBalance) {
        setForm({
          entry_type: existingBalance.entry_type || 'credit',
          amount: existingBalance.amount || '',
          transaction_date: toInputDate(existingBalance.transaction_date) || new Date().toISOString().split('T')[0],
          remark: existingBalance.remark || '',
        });
      } else {
        setForm(EMPTY_OB_FORM);
      }
    }
  }, [open, isEdit, existingBalance]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.amount || !form.transaction_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const body = {
        employee_id: Number(employeeId),
        transaction_type: 'opening_balance',
        entry_type: form.entry_type,
        amount: parseFloat(form.amount),
        transaction_date: form.transaction_date,
      };
      if (form.remark.trim()) body.remark = form.remark.trim();

      // If editing, include the existing transaction id
      if (isEdit && existingBalance?.id) body.id = existingBalance.id;

      const companyId = getCompanyId();
      const endpoint = isEdit ? '/transactions/update' : '/transactions/add';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await apiCall(endpoint, method, body, companyId);
      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Opening balance updated' : 'Opening balance created');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to save opening balance');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? 'Edit Opening Balance' : 'Create Opening Balance'}
      subtitle={isEdit ? 'Update the initial balance entry' : 'Set the initial balance for this employee'}
      icon={<FaWallet size={20} />}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={13} /> : <FaCheck size={13} />}
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Opening Balance'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {!isEdit && (
          <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-700 font-medium flex items-center gap-2">
            <FaInfoCircle size={12} /> Opening balance is the starting financial position for this employee's ledger.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Entry Type */}
          <FormField label="Entry Type" required>
            <SelectField
              options={ENTRY_TYPES}
              value={ENTRY_TYPES.find(t => t.value === form.entry_type)}
              onChange={opt => set('entry_type', opt.value)}
              formatOptionLabel={formatEntryOption}
            />
          </FormField>

          {/* Amount */}
          <FormField label="Amount" required>
            <div className="relative">
              <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`${inputClass} pl-9`}
                value={form.amount}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val)) set('amount', val);
                }}
              />
            </div>
          </FormField>

          {/* Transaction Date */}
          <FormField label="Effective Date" required>
            <DatePickerField
              mode="single"
              initialTab="single"
              showQuickSelect={false}
              value={form.transaction_date}
              onChange={val => set('transaction_date', val)}
              buttonClassName={`${inputClass} text-left font-normal`}
            />
          </FormField>
        </div>

        {/* Remark */}
        <FormField label="Remark">
          <textarea
            rows={3}
            placeholder="Optional note about this opening balance..."
            className={`${inputClass} resize-none`}
            value={form.remark}
            onChange={e => set('remark', e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

// ─── Edit Transaction Modal ───────────────────────────────────────────────────

const EditTransactionModal = ({ open, onClose, onSuccess, transaction }) => {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        id: transaction.id,
        amount: transaction.amount || '',
        transaction_date: toInputDate(transaction.transaction_date),
        entry_type: transaction.entry_type || 'credit',
        employee_account: transaction.accounts?.employee_account?.id || '',
        company_account: transaction.accounts?.company_account?.id || '',
        remark: transaction.remark || '',
      });
    }
  }, [transaction]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.amount || !form.transaction_date) {
      toast.error('Please fill in required fields');
      return;
    }
    setSaving(true);
    try {
      const body = {
        id: form.id,
        amount: parseFloat(form.amount),
        transaction_date: form.transaction_date,
        entry_type: form.entry_type,
      };
      if (form.employee_account) body.employee_account = Number(form.employee_account);
      if (form.company_account) body.company_account = Number(form.company_account);
      if (form.remark) body.remark = form.remark;

      const companyId = getCompanyId();
      const res = await apiCall('/transactions/update', 'PUT', body, companyId);
      const data = await res.json();
      if (data.success) {
        toast.success('Transaction updated successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open && !!transaction}
      onClose={onClose}
      title="Edit Transaction"
      subtitle={transaction?.transaction_id}
      icon={<FaEdit size={20} />}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={13} /> : <FaCheck size={13} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      {transaction && (
        <div className="space-y-4">
          {/* Read-only info */}
          <div className="flex gap-2 flex-wrap">
            <TransactionTypeBadge type={transaction.transaction_type} />
            <EntryTypeBadge entryType={transaction.entry_type} />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium flex items-center gap-2">
            <FaInfoCircle size={12} /> Transaction type and employee cannot be changed after creation.
          </div>

          <div className="flex flex-col gap-3">
            <FormField label="Amount" required>
              <div className="relative">
                <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${inputClass} pl-9`}
                  value={form.amount}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      set('amount', val);
                    }
                  }}
                />
              </div>
            </FormField>

            <FormField label="Transaction Date" required>
              <DatePickerField
                mode="single"
                initialTab="single"
                showQuickSelect={false}
                value={form.transaction_date}
                onChange={val => set('transaction_date', val)}
                buttonClassName={`${inputClass} text-left font-normal`}
              />
            </FormField>

            <FormField label="Entry Type">
              <SelectField
                options={ENTRY_TYPES}
                value={ENTRY_TYPES.find(t => t.value === form.entry_type)}
                onChange={opt => set('entry_type', opt.value)}
                formatOptionLabel={formatEntryOption}
              />
            </FormField>

            <FormField label="Employee Account">
              <BankAccountSelectField
                ownerType="employee"
                employeeId={transaction?.employee?.id || transaction?.employee_id}
                value={form.employee_account}
                onChange={(val) => set('employee_account', val)}
                initialAccount={transaction?.accounts?.employee_account}
                placeholder="Search employee account..."
              />
            </FormField>

            <FormField label="Company Account">
              <BankAccountSelectField
                ownerType="company"
                value={form.company_account}
                onChange={(val) => set('company_account', val)}
                initialAccount={transaction?.accounts?.company_account}
                placeholder="Search company account..."
              />
            </FormField>
          </div>

          <FormField label="Remark">
            <textarea
              rows={3}
              placeholder="Optional note..."
              className={`${inputClass} resize-none`}
              value={form.remark}
              onChange={e => set('remark', e.target.value)}
            />
          </FormField>
        </div>
      )}
    </Modal>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ open, onClose, onSuccess, transaction }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const companyId = getCompanyId();
      const res = await apiCall('/transactions/delete', 'DELETE', { id: transaction.id }, companyId);
      const data = await res.json();
      if (data.success) {
        toast.success('Transaction deleted');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={open && !!transaction}
      onClose={onClose}
      title="Delete Transaction"
      subtitle="This action cannot be undone"
      icon={<FaTrash size={18} />}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-200 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting ? <FaSpinner className="animate-spin" size={13} /> : <FaTrash size={13} />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      }
    >
      {transaction && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TransactionTypeBadge type={transaction.transaction_type} />
              <EntryTypeBadge entryType={transaction.entry_type} />
            </div>
            <p className="text-2xl font-black text-rose-700 mt-2">
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-rose-400 font-mono mt-1">{transaction.transaction_id}</p>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Are you sure you want to permanently delete this transaction? All associated balance entries will be recalculated.
          </p>
        </div>
      )}
    </Modal>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewModal = ({ open, onClose, transaction }) => (
  <Modal
    isOpen={open && !!transaction}
    onClose={onClose}
    title="Transaction Details"
    subtitle={transaction?.transaction_id}
    icon={<FaInfoCircle size={22} />}
    size="lg"
    footer={
      <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
        Close
      </button>
    }
  >
    {transaction && (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <TransactionTypeBadge type={transaction.transaction_type} />
          <EntryTypeBadge entryType={transaction.entry_type} />
        </div>

        {/* Amount Card */}
        <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg bg-gradient-to-br ${transaction.entry_type === 'debit' ? 'from-rose-600 via-pink-600 to-rose-800' : 'from-emerald-600 via-teal-600 to-emerald-800'}`}>
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2">Transaction Amount</p>
          <p className="text-3xl font-black tracking-tight">
            {transaction.entry_type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
          </p>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-[9px] text-white/50 uppercase tracking-widest">Balance After</p>
              <p className="text-base font-bold">{formatCurrency(transaction.balance)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/50 uppercase tracking-widest">Date</p>
              <p className="text-sm font-medium">{formatDate(transaction.transaction_date)}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
            <p className="text-sm font-mono font-bold text-slate-700">{transaction.transaction_id}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created On</p>
            <p className="text-sm font-bold text-slate-700">{formatDateTime(transaction.created_at)}</p>
          </div>

          {transaction.employee && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee</p>
              <div className="flex items-center gap-2">
                <FaUser size={12} className="text-slate-400" />
                <p className="text-sm font-bold text-slate-700">{transaction.employee.name}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">{transaction.employee.employee_code}</p>
            </div>
          )}

          {transaction.created_by && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Created By</p>
              <div className="flex items-center gap-2">
                <FaUser size={12} className="text-slate-400" />
                <p className="text-sm font-bold text-slate-700">{transaction.created_by.name}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">{transaction.created_by.email}</p>
            </div>
          )}

          {/* Bank Accounts */}
          {transaction.accounts?.employee_account && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Employee Account</p>
              <div className="flex items-start gap-2">
                <FaUniversity size={12} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-700">{transaction.accounts.employee_account.bank_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{transaction.accounts.employee_account.account_number}</p>
                  <p className="text-xs text-slate-400">{transaction.accounts.employee_account.ifsc_code}</p>
                </div>
              </div>
            </div>
          )}

          {transaction.accounts?.company_account && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Company Account</p>
              <div className="flex items-start gap-2">
                <FaUniversity size={12} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-700">{transaction.accounts.company_account.account_holder_name}</p>
                  {transaction.accounts.company_account.account_number && (
                    <p className="text-xs text-slate-500 font-mono">{transaction.accounts.company_account.account_number}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {transaction.remark && (
            <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remark</p>
              <p className="text-sm font-medium text-slate-700">{transaction.remark}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 bg-violet-50/60 border border-violet-100 rounded-xl">
          <FaShieldAlt className="text-violet-400 shrink-0" size={16} />
          <p className="text-xs text-violet-600 font-medium">
            This transaction is permanently recorded in the company's financial ledger.
          </p>
        </div>
      </div>
    )}
  </Modal>
);

// ─── Helper: is opening_balance all zeros? ────────────────────────────────────
const isOpeningBalanceEmpty = (ob) =>
  !ob || (Number(ob.debit) === 0 && Number(ob.credit) === 0 && Number(ob.balance) === 0);

// ─── Main Component ───────────────────────────────────────────────────────────

const CompanyLedger = ({ employeeId }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [filterEntry, setFilterEntry] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const [viewModal, setViewModal] = useState({ open: false, transaction: null });
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, transaction: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, transaction: null });

  // Opening balance modal state
  const [obModal, setObModal] = useState(false);

  const [summary, setSummary] = useState({ total_debit: 0, total_credit: 0, closing_balance: 0 });
  const [openingBalance, setOpeningBalance] = useState({ debit: 0, credit: 0, balance: 0 });

  // The actual opening_balance transaction row (if it exists in data, for edit)
  const [openingBalanceTx, setOpeningBalanceTx] = useState(null);

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch ledger
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const id = employeeId || 19;
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (filterType?.value) params.append('transaction_type', filterType.value);
      if (filterEntry?.value) params.append('entry_type', filterEntry.value);
      const qs = params.toString();
      const url = `/transactions/company-ledger/${id}${qs ? `?${qs}` : ''}`;
      const res = await apiCall(url, 'GET', null, companyId);
      const result = await res.json();
      if (result.success) {
        const txList = result.data || [];
        setTransactions(txList);
        setOpeningBalance(result.opening_balance || { debit: 0, credit: 0, balance: 0 });

        // Find the opening_balance transaction row if present, for edit purposes
        const obTx = txList.find(t => t.transaction_type === 'opening_balance') || null;
        setOpeningBalanceTx(obTx);

        if (result.meta?.summary) {
          setSummary(result.meta.summary);
        } else {
          const totals = txList.reduce(
            (acc, t) => { acc.total_debit += t.debit || 0; acc.total_credit += t.credit || 0; return acc; },
            { total_debit: 0, total_credit: 0 }
          );
          const last = txList[txList.length - 1];
          setSummary({ ...totals, closing_balance: last?.balance || 0 });
        }
      } else {
        toast.error(result.message || 'Failed to fetch transactions');
        setTransactions([]);
      }
    } catch {
      toast.error('Connection error');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filterType, filterEntry, employeeId]);

  const initialDone = useRef(false);
  const prevDep = useRef('');

  useEffect(() => {
    const dep = `${debouncedSearchTerm}|${filterType?.value || ''}|${filterEntry?.value || ''}`;
    if (!initialDone.current || prevDep.current !== dep) {
      fetchTransactions();
      initialDone.current = true;
      prevDep.current = dep;
    }
  }, [debouncedSearchTerm, filterType, filterEntry, fetchTransactions]);

  // Local filter (client-side fallback)
  useEffect(() => {
    const q = debouncedSearchTerm.trim().toLowerCase();
    let list = [...transactions];
    if (q) {
      list = list.filter(t =>
        t.transaction_id?.toLowerCase().includes(q) ||
        t.remark?.toLowerCase().includes(q) ||
        t.transaction_type?.toLowerCase().includes(q) ||
        t.employee?.name?.toLowerCase().includes(q)
      );
    }
    setFilteredTransactions(list);
    goToPage(1);
  }, [transactions, debouncedSearchTerm, goToPage]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  useEffect(() => {
    if (pagination.page > totalPages) goToPage(totalPages);
  }, [goToPage, pagination.page, totalPages]);

  const paginatedData = useMemo(
    () => filteredTransactions.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit),
    [filteredTransactions, pagination.page, pagination.limit]
  );

  const stats = useMemo(() => [
    { label: 'Opening Balance', value: openingBalance.balance, icon: FaChartLine, color: 'violet' },
    { label: 'Total Credit', value: summary.total_credit, icon: FaArrowDown, color: 'emerald', prefix: '+' },
    { label: 'Total Debit', value: summary.total_debit, icon: FaArrowUp, color: 'rose', prefix: '-' },
    { label: 'Closing Balance', value: summary.closing_balance, icon: FaWallet, color: summary.closing_balance >= 0 ? 'emerald' : 'rose' },
  ], [openingBalance, summary]);

  const handlePageChange = useCallback((page) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [goToPage]);

  // Determine opening balance button label & behaviour
  const obIsEmpty = isOpeningBalanceEmpty(openingBalance);

  const columns = useMemo(() => [
    {
      key: 'row_num',
      label: '#',
      render: (tx, idx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
        const offset = pagination.page === 1 ? -1 : 0;
        const rowNum = (pagination.page - 1) * pagination.limit + idx + 1 + offset;
        return <span className="font-medium text-slate-400">{rowNum}</span>;
      },
      className: 'w-12 text-center',
    },
    {
      key: 'transaction_date',
      label: 'Date',
      render: (tx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
        return <span className="whitespace-nowrap font-medium text-slate-600">{formatDate(tx.transaction_date)}</span>;
      },
    },
    {
      key: 'particulars',
      label: 'Particulars',
      render: (tx) => {
        if (tx.isOpeningBalance) {
          return <span className="font-bold text-slate-800">Opening Balance</span>;
        }
        return renderParticulars(tx);
      },
    },
    {
      key: 'type',
      label: 'Type',
      render: (tx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
        return <TransactionTypeBadge type={tx.transaction_type} compact />;
      },
    },
    {
      key: 'transaction_id',
      label: 'Voucher No',
      render: (tx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-semibold">—</span>;
        return <span className="font-mono text-xs text-slate-500">{tx.transaction_id}</span>;
      },
    },
    {
      key: 'debit',
      label: 'Debit',
      render: (tx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-mono">0.00</span>;
        return tx.debit > 0 ? (
          <span className="font-bold text-blue-600 font-mono">{formatNumber(tx.debit)}</span>
        ) : (
          <span className="text-slate-400 font-mono">0.00</span>
        );
      },
      className: 'text-right',
    },
    {
      key: 'credit',
      label: 'Credit',
      render: (tx) => {
        if (tx.isOpeningBalance) return <span className="text-slate-400 font-mono">0.00</span>;
        return tx.credit > 0 ? (
          <span className="font-bold text-amber-600 font-mono">{formatNumber(tx.credit)}</span>
        ) : (
          <span className="text-slate-400 font-mono">0.00</span>
        );
      },
      className: 'text-right',
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (tx) => {
        return (
          <span className={`font-mono font-bold ${tx.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatNumber(tx.balance)}
          </span>
        );
      },
      className: 'text-right',
    },
  ], [pagination.page, pagination.limit]);

  const tableRows = useMemo(() => {
    if (pagination.page === 1) {
      return [
        {
          isOpeningBalance: true,
          id: 'opening-balance',
          transaction_date: '',
          remark: 'Opening Balance',
          transaction_type: 'opening_balance',
          entry_type: 'credit',
          amount: 0,
          debit: 0,
          credit: 0,
          balance: openingBalance.balance,
        },
        ...paginatedData,
      ];
    }
    return paginatedData;
  }, [paginatedData, pagination.page, openingBalance.balance]);

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-violet-500 text-4xl" />
          <p className="text-slate-400 font-medium animate-pulse">Loading company ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <ManagementHub
      eyebrow={<><FaChartBar size={11} /> Company Ledger</>}
      title="Transaction Management"
      description="View, add, edit, and delete all financial transactions across employees."
      accent="violet"
      actions={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {/* Opening Balance button — Create if empty, Edit if exists */}
          <button
            onClick={() => setObModal(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${obIsEmpty
                ? 'bg-white border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
          >
            <FaWallet size={13} />
            {obIsEmpty ? 'Create Opening Balance' : 'Edit Opening Balance'}
          </button>

          <ManagementButton
            icon={<FaPlus size={13} />}
            onClick={() => setAddModal(true)}
            tone="violet"
          >
            <div className="flex items-center gap-2">
              <FaPlus size={12}/> Create
            </div>
          </ManagementButton>
          <RefreshButton loading={loading} onClick={fetchTransactions}>Refresh</RefreshButton>
        </div>
      }
    >
      <div className="space-y-6 p-2 lg:p-0">
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

        {/* Search + Filters + View Switcher */}
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
              placeholder="Search by ID, name, remark, or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-[180px]">
              <SelectField
                options={[{ value: '', label: 'All Types' }, ...TRANSACTION_TYPES]}
                value={filterType || { value: '', label: 'All Types' }}
                onChange={opt => { setFilterType(opt.value ? opt : null); goToPage(1); }}
                formatOptionLabel={opt => opt.value === '' ? opt.label : formatTransactionOption(opt)}
              />
            </div>
            <div className="w-[160px]">
              <SelectField
                options={[{ value: '', label: 'All Entries' }, ...ENTRY_TYPES]}
                value={filterEntry || { value: '', label: 'All Entries' }}
                onChange={opt => { setFilterEntry(opt.value ? opt : null); goToPage(1); }}
                formatOptionLabel={opt => opt.value === '' ? opt.label : formatEntryOption(opt)}
              />
            </div>
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* List */}
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
            <button
              onClick={() => setAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-200 transition-all"
            >
              <FaPlus size={12} /> Add First Transaction
            </button>
          </motion.div>
        ) : viewMode === 'table' ? (
          <>
            {pagination.page === 1 && (
              <style dangerouslySetInnerHTML={{
                __html: `
                .company-ledger-table tbody tr:first-child td:last-child div {
                  display: none !important;
                  pointer-events: none !important;
                }
              ` }} />
            )}
            <ManagementTable
              className="company-ledger-table"
              rows={tableRows}
              columns={columns}
              rowKey={row => row.id}
              onRowClick={(row) => {
                if (row.isOpeningBalance) return;
                setViewModal({ open: true, transaction: row });
              }}
              getActions={(row) => {
                if (row.isOpeningBalance) return [];
                return [
                  {
                    label: 'View Details',
                    icon: <FaEye size={13} />,
                    onClick: () => setViewModal({ open: true, transaction: row }),
                    className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50',
                  },
                  {
                    label: 'Edit',
                    icon: <FaEdit size={13} />,
                    onClick: () => setEditModal({ open: true, transaction: row }),
                    className: 'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                  },
                  {
                    label: 'Delete',
                    icon: <FaTrash size={13} />,
                    onClick: () => setDeleteModal({ open: true, transaction: row }),
                    className: 'text-gray-700 hover:text-rose-600 hover:bg-rose-50',
                  },
                ];
              }}
              accent="violet"
            />
          </>
        ) : (
          <ManagementGrid>
            {paginatedData.map(tx => (
              <MobileTransactionCard
                key={tx.id}
                transaction={tx}
                onView={t => setViewModal({ open: true, transaction: t })}
                onEdit={t => setEditModal({ open: true, transaction: t })}
                onDelete={t => setDeleteModal({ open: true, transaction: t })}
              />
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

      {/* Modals */}
      <AddTransactionModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={fetchTransactions}
        employeeId={employeeId || 19}
      />

      <OpeningBalanceModal
        open={obModal}
        onClose={() => setObModal(false)}
        onSuccess={fetchTransactions}
        employeeId={employeeId || 19}
        isEdit={!obIsEmpty}
        existingBalance={openingBalanceTx}
      />

      <EditTransactionModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        onSuccess={fetchTransactions}
        transaction={editModal.transaction}
      />

      <DeleteModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, transaction: null })}
        onSuccess={fetchTransactions}
        transaction={deleteModal.transaction}
      />

      <ViewModal
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, transaction: null })}
        transaction={viewModal.transaction}
      />
    </ManagementHub>
  );
};

export default CompanyLedger;
