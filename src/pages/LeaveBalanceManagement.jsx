import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch, FaTimes, FaCheck,
  FaExclamationTriangle, FaUser, FaCalendarAlt, FaClock, FaDollarSign,
  FaToggleOn, FaEye, FaSpinner, FaChevronDown, FaTh, FaListUl, FaCog,
  FaEnvelope, FaIdCard, FaChartBar
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import { ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

const ITEMS_PER_PAGE = 10;
const YEAR_OPTIONS = [2024, 2025, 2026, 2027];
const FETCH_BATCH_SIZE = 100;
const employeeBalanceRequests = new Map();

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const STAT_STYLES = {
  violet: {
    iconWrap: 'bg-violet-50 text-violet-600',
    glow: 'bg-violet-100/70',
  },
  orange: {
    iconWrap: 'bg-orange-50 text-orange-600',
    glow: 'bg-orange-100/70',
  },
  emerald: {
    iconWrap: 'bg-emerald-50 text-emerald-600',
    glow: 'bg-emerald-100/70',
  },
  indigo: {
    iconWrap: 'bg-indigo-50 text-indigo-600',
    glow: 'bg-indigo-100/70',
  },
};

const formatDays = (value) => {
  const numericValue = Number.parseFloat(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
};

const getRemainingPercentage = (remaining, total) => {
  const remainingNum = Number.parseFloat(remaining ?? 0);
  const totalNum = Number.parseFloat(total ?? 0);

  if (!Number.isFinite(remainingNum) || !Number.isFinite(totalNum) || totalNum <= 0) {
    return 0;
  }

  return Math.min(100, (remainingNum / totalNum) * 100);
};

const isLowBalance = (remaining) => Number.parseFloat(remaining ?? 0) <= 1;

const getBalanceKey = (balance) =>
  balance.id ?? `${balance.employee_id}-${balance.leave_config_id}-${balance.year}`;

const flattenEmployeeBalances = (data, year) => {
  if (!data || !Array.isArray(data)) return [];
  
  // Robust check for data structure - handles both nested and flat responses
  if (data.length > 0 && !data[0].leaves) {
    return data.map(item => ({
      employee_id: item.employee_id || item.employee?.id || item.id,
      employee_name: item.employee_name || item.employee?.name || 'N/A',
      email: item.email || item.employee?.email,
      employee_code: item.employee_code || item.employee?.employee_code,
      leave_config_id: item.leave_config_id || item.leave_config?.id,
      type: item.type || item.code || item.leave_config?.code || 'N/A',
      code: item.code || item.type || item.leave_config?.code || 'N/A',
      name: item.name || item.leave_config?.name || 'N/A',
      year: item.year || year,
      total_allocated: item.total_allocated ?? 0,
      used: item.used ?? 0,
      remaining: item.remaining ?? ((item.total_allocated ?? 0) - (item.used ?? 0)),
      is_paid: item.is_paid ?? item.leave_config?.is_paid ?? true,
      allow_half_day: item.allow_half_day ?? item.leave_config?.allow_half_day ?? false,
      accrual_type: item.accrual_type || item.leave_config?.accrual_type || 'none',
      accrual_rate: item.accrual_rate ?? item.leave_config?.accrual_rate ?? 0,
      max_balance: item.max_balance ?? item.leave_config?.max_balance ?? 0,
      carry_forward_limit: item.carry_forward_limit ?? item.leave_config?.carry_forward_limit ?? 0,
      allow_negative_balance: item.allow_negative_balance ?? item.leave_config?.allow_negative_balance ?? false,
      exclude_weekends: item.exclude_weekends ?? item.leave_config?.exclude_weekends ?? true,
      is_comp_off: item.is_comp_off ?? item.leave_config?.is_comp_off ?? false,
      is_active: item.is_active ?? true,
    }));
  }

  return data.flatMap((employee) =>
    (employee.leaves || []).map((leave) => ({
      employee_id: employee.employee_id || employee.id,
      employee_name: employee.employee_name || employee.name,
      email: employee.email,
      employee_code: employee.employee_code,
      leave_config_id: leave.leave_config_id,
      type: leave.type || leave.code,
      code: leave.code || leave.type,
      name: leave.name,
      year: leave.year || year,
      total_allocated: leave.total_allocated,
      used: leave.used,
      remaining: leave.remaining,
      is_paid: leave.is_paid,
      allow_half_day: leave.allow_half_day,
      accrual_type: leave.accrual_type,
      accrual_rate: leave.accrual_rate,
      max_balance: leave.max_balance,
      carry_forward_limit: leave.carry_forward_limit,
      allow_negative_balance: leave.allow_negative_balance,
      exclude_weekends: leave.exclude_weekends,
      is_comp_off: leave.is_comp_off,
      is_active: true,
    }))
  );
};

const fetchEmployeeBalanceRows = async (year, companyId) => {
  const requestKey = `${companyId ?? 'no-company'}-${year}`;

  if (employeeBalanceRequests.has(requestKey)) {
    return employeeBalanceRequests.get(requestKey);
  }

  const requestPromise = (async () => {
    let allBalances = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const params = new URLSearchParams({
        year: String(year),
        page: String(currentPage),
        limit: String(FETCH_BATCH_SIZE),
      });

      const response = await apiCall(`/leave/emp-balances?${params.toString()}`, 'GET', null, companyId);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch balances');
      }

      allBalances = allBalances.concat(flattenEmployeeBalances(result.data, year));
      totalPages = Number(result.meta?.total_pages ?? 1);
      currentPage += 1;
    } while (currentPage <= totalPages);

    return allBalances;
  })();

  employeeBalanceRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    employeeBalanceRequests.delete(requestKey);
  }
};

// Searchable Select Component
const SearchableSelect = ({
  value,
  onChange,
  options,
  onSearch,
  placeholder,
  label,
  loading = false,
  renderOption,
  getOptionLabel,
  getOptionValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const selectedOption = options.find(opt => getOptionValue(opt) === value);

  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(searchTerm);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, searchTerm, onSearch]);

  const handleSelect = (option) => {
    onChange(getOptionValue(option));
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div
        className="relative cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className={selectedOption ? 'text-slate-700' : 'text-slate-400'}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
          <FaChevronDown
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            size={12}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="text-violet-500 animate-spin" size={20} />
                </div>
              ) : options.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No results found</div>
              ) : (
                options.map((option) => (
                  <button
                    key={getOptionValue(option)}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    {renderOption ? renderOption(option) : getOptionLabel(option)}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PaidBadge = ({ isPaid, compact = false }) => (
  isPaid ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 ${
        compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs font-semibold'
      }`}
    >
      <FaDollarSign size={compact ? 8 : 10} />
      PAID
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 text-slate-500 ${
        compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs font-semibold'
      }`}
    >
      UNPAID
    </span>
  )
);

const ActionMenuButtons = (balance, onEdit, onDelete, onView, updateAccess, deleteAccess, updateMessage, deleteMessage) => [
    { label: 'View Details', icon: <FaEye size={13} />, onClick: () => onView(balance), className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50' },
    { label: 'Edit Balance', icon: <FaEdit size={13} />, onClick: () => onEdit(balance), disabled: updateAccess.disabled, title: updateAccess.disabled ? updateMessage : '', className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
    { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => onDelete(balance), disabled: deleteAccess.disabled, title: deleteAccess.disabled ? deleteMessage : '', className: 'text-red-600 hover:text-red-700 hover:bg-red-50' }
];

const StatCard = ({ stat }) => {
  const styles = STAT_STYLES[stat.color];

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white bg-white p-5 shadow-lg shadow-slate-200/50 transition duration-300 hover:shadow-xl sm:p-6">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${styles.glow}`} />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-black text-slate-800 sm:text-[1.9rem]">
            {stat.isCount ? stat.value : formatDays(stat.value)}
            {!stat.isCount && <span className="ml-1 text-xs font-bold uppercase text-slate-300">days</span>}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
          <stat.icon size={20} />
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, className = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-4 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
  </div>
);

const MobileBalanceCard = ({
  balance,
  onEdit,
  onDelete,
  onView,
  editDisabled,
  deleteDisabled,
  editMessage,
  deleteMessage,
}) => {
  const lowBalance = isLowBalance(balance.remaining);

  return (
    <motion.div
      key={getBalanceKey(balance)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col"
      onClick={() => onView(balance)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-xl bg-violet-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
              {balance.type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {balance.employee_code || `EMP-${balance.employee_id}`}
            </span>
          </div>
          <h3 className="mt-3 truncate text-lg font-bold text-slate-800">{balance.employee_name}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{balance.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {balance.email || `Employee ID #${balance.employee_id}`} • Year {balance.year}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <PaidBadge isPaid={balance.is_paid} compact />
          <div onClick={(e) => e.stopPropagation()}>
            <ActionMenu
              balance={balance}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              editDisabled={editDisabled}
              deleteDisabled={deleteDisabled}
              editMessage={editMessage}
              deleteMessage={deleteMessage}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Allocated</p>
          <p className="mt-1 font-bold text-slate-800">{formatDays(balance.total_allocated)} days</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Used</p>
          <p className="mt-1 font-bold text-orange-600">{formatDays(balance.used)} days</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Max Balance</p>
          <p className="mt-1 font-bold text-slate-700">{formatDays(balance.max_balance)} days</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
          <p className="mt-1 font-bold text-slate-700">{balance.is_paid ? 'Paid leave' : 'Unpaid leave'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 mt-auto">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Remaining Balance</p>
            <p className={`mt-1 text-xl font-black ${lowBalance ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatDays(balance.remaining)} days
            </p>
          </div>
          {lowBalance && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">
              <FaExclamationTriangle size={10} />
              Low balance
            </span>
          )}
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getRemainingPercentage(balance.remaining, balance.total_allocated)}%` }}
            className={`h-full rounded-full ${lowBalance ? 'bg-rose-500' : 'bg-emerald-500'}`}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-medium">
          <span className="text-orange-600">Used {formatDays(balance.used)}d</span>
          <span className="text-slate-500">Allocated {formatDays(balance.total_allocated)}d</span>
        </div>
      </div>
    </motion.div>
  );
};

const LeaveBalanceManagement = () => {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [balances, setBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewModal, setViewModal] = useState({ open: false, balance: null });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('assign');
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // State for searchable selects
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  
  const [leaveConfigs, setLeaveConfigs] = useState([]);
  const [leaveConfigsLoading, setLeaveConfigsLoading] = useState(false);

  const { pagination, goToPage, changeLimit } = usePagination(1, ITEMS_PER_PAGE);
  const createAccess = checkActionAccess('leaveBalance', 'create');
  const updateAccess = checkActionAccess('leaveBalance', 'update');
  const deleteAccess = checkActionAccess('leaveBalance', 'delete');
  const createMessage = getAccessMessage(createAccess);
  const updateMessage = getAccessMessage(updateAccess);
  const deleteMessage = getAccessMessage(deleteAccess);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_config_id: '', // for edit
    total_allocated: 0,  // for edit
    leaves: [{ leave_config_id: '', total_allocated: 0 }], // for assign
  });

  // Fetch employees with search
  const fetchEmployees = useCallback(async (search = '') => {
    setEmployeesLoading(true);
    try {
      const companyId = getCompanyId();
      const url = search 
        ? `/employees/all-list?search=${encodeURIComponent(search)}`
        : '/employees/all-list';
      const response = await apiCall(url, 'GET', null, companyId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setEmployees(result.data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  // Fetch leave configs with search
  const fetchLeaveConfigs = useCallback(async (search = '') => {
    setLeaveConfigsLoading(true);
    try {
      const companyId = getCompanyId();
      const url = search 
        ? `/leave/company?search=${encodeURIComponent(search)}`
        : '/leave/company';
      const response = await apiCall(url, 'GET', null, companyId);
      const result = await response.json();
      
      if (result.success && result.data) {
        setLeaveConfigs(result.data);
      } else {
        setLeaveConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching leave configs:', error);
      setLeaveConfigs([]);
    } finally {
      setLeaveConfigsLoading(false);
    }
  }, []);

  const handleEmployeeSearch = useCallback((search) => {
    fetchEmployees(search);
  }, [fetchEmployees]);

  const handleLeaveConfigSearch = useCallback((search) => {
    fetchLeaveConfigs(search);
  }, [fetchLeaveConfigs]);

  // Initial fetch of employees and leave configs when modal opens
  useEffect(() => {
    if (showModal && modalMode === 'assign') {
      fetchEmployees();
      fetchLeaveConfigs();
    }
  }, [showModal, modalMode, fetchEmployees, fetchLeaveConfigs]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const companyId = getCompanyId();
      const allBalances = await fetchEmployeeBalanceRows(selectedYear, companyId);
      setBalances(allBalances);
    } catch (error) {
      toast.error(error.message || 'Connection error while fetching balances');
      setBalances([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const parseActionResponse = async (response, fallbackMessage) => {
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || fallbackMessage);
    }

    return result;
  };

  const handleAction = async () => {
    if (modalMode !== 'delete' && (!formData.employee_id || !formData.leave_config_id)) {
      toast.error('Please select both employee and leave type');
      return;
    }

    setSaving(true);

    try {
      let response;

      if (modalMode === 'assign') {
        const payload = {
          employee_id: formData.employee_id,
          leaves: formData.leaves.map(l => ({
            leave_config_id: l.leave_config_id,
            total_allocated: Number(l.total_allocated) || 0
          }))
        };
        response = await apiCall('/leave/assign-balance', 'POST', payload, getCompanyId());
      } else if (modalMode === 'edit') {
        const payload = {
          employee_id: selectedBalance.employee_id,
          leaves: [
            {
              leave_config_id: selectedBalance.leave_config_id,
              total_allocated: Number(formData.total_allocated) || 0,
            },
          ],
        };
        response = await apiCall('/leave/update-balance', 'PUT', payload, getCompanyId());
      } else if (modalMode === 'delete') {
        response = await apiCall('/leave/delete-balance', 'DELETE', {
          employee_id: selectedBalance.employee_id,
          leave_config_id: selectedBalance.leave_config_id,
        }, getCompanyId());
      }

      const result = await parseActionResponse(response, 'Operation failed');
      if (result.success) {
        toast.success(
          result.message ||
            `Balance ${
              modalMode === 'assign' ? 'assigned' : modalMode === 'edit' ? 'updated' : 'deleted'
            } successfully`
        );
        setShowModal(false);
        await fetchData();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      setFilteredBalances(balances);
      return;
    }

    const nextFilteredBalances = balances.filter((balance) =>
      balance.name?.toLowerCase().includes(normalizedSearch) ||
      balance.type?.toLowerCase().includes(normalizedSearch) ||
      balance.employee_name?.toLowerCase().includes(normalizedSearch) ||
      balance.employee_code?.toLowerCase().includes(normalizedSearch) ||
      balance.email?.toLowerCase().includes(normalizedSearch) ||
      String(balance.employee_id ?? '').includes(searchTerm.trim())
    );

    setFilteredBalances(nextFilteredBalances);
  }, [balances, searchTerm]);

  useEffect(() => {
    goToPage(1);
  }, [searchTerm, selectedYear, goToPage]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalItems = filteredBalances.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  useEffect(() => {
    if (pagination.page > totalPages) {
      goToPage(totalPages);
    }
  }, [goToPage, pagination.page, totalPages]);

  const openModal = (mode, balance = null) => {
    if (mode === 'assign' && createAccess.disabled) return;
    if (mode === 'edit' && updateAccess.disabled) return;
    if (mode === 'delete' && deleteAccess.disabled) return;
    setModalMode(mode);

    if (balance) {
      setSelectedBalance(balance);
      setFormData({
        employee_id: balance.employee_id,
        leave_config_id: balance.leave_config_id,
        total_allocated: Number.parseFloat(balance.total_allocated ?? 0),
        leaves: [{ leave_config_id: '', total_allocated: 0 }],
      });
    } else {
      setSelectedBalance(null);
      setFormData({
        employee_id: '',
        leave_config_id: '',
        total_allocated: 0,
        leaves: [{ leave_config_id: '', total_allocated: 0 }],
      });
    }

    setShowModal(true);
  };

  const handlePageChange = useCallback(
    (page) => {
      goToPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [goToPage]
  );

  const closeModal = useCallback(() => {
    if (saving) {
      return;
    }

    setShowModal(false);
  }, [saving]);

  const closeViewModal = useCallback(() => {
    setViewModal({ open: false, balance: null });
  }, []);

  useEffect(() => {
    if (!showModal && !viewModal.open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (viewModal.open) {
          closeViewModal();
          return;
        }
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeModal, closeViewModal, showModal, viewModal.open]);

  const paginatedData = useMemo(
    () =>
      filteredBalances.slice(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit
      ),
    [filteredBalances, pagination.page, pagination.limit]
  );

  const stats = useMemo(
    () => [
      {
        label: 'Total Allocated',
        value: balances.reduce((sum, balance) => sum + Number.parseFloat(balance.total_allocated ?? 0), 0),
        icon: FaCalendarAlt,
        color: 'violet',
      },
      {
        label: 'Total Used',
        value: balances.reduce((sum, balance) => sum + Number.parseFloat(balance.used ?? 0), 0),
        icon: FaClock,
        color: 'orange',
      },
      {
        label: 'Total Remaining',
        value: balances.reduce((sum, balance) => sum + Number.parseFloat(balance.remaining ?? 0), 0),
        icon: FaCheck,
        color: 'emerald',
      },
      {
        label: 'Employees',
        value: new Set(balances.map((balance) => balance.employee_id)).size,
        icon: FaToggleOn,
        color: 'indigo',
        isCount: true,
      },
    ],
    [balances]
  );

  const showEmployee = windowWidth >= 540;
  const showCode = windowWidth >= 768;
  const showYear = windowWidth >= 1024;
  const showUsed = windowWidth >= 640;
  const showPaid = windowWidth >= 1280;
  const showMax = windowWidth >= 1440;
  const desktopColumnCount =
    4 +
    Number(showEmployee) +
    Number(showCode) +
    Number(showYear) +
    Number(showUsed) +
    Number(showPaid) +
    Number(showMax);

  const ActionMenuButtons = (balance, onEdit, onDelete, onView, updateAccess, deleteAccess, updateMessage, deleteMessage) => [
      { label: 'View Details', icon: <FaEye size={13} />, onClick: () => onView(balance), className: 'text-gray-700 hover:text-violet-600 hover:bg-violet-50' },
      { label: 'Edit Balance', icon: <FaEdit size={13} />, onClick: () => onEdit(balance), disabled: updateAccess.disabled, title: updateAccess.disabled ? updateMessage : '', className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
      { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => onDelete(balance), disabled: deleteAccess.disabled, title: deleteAccess.disabled ? deleteMessage : '', className: 'text-red-600 hover:text-red-700 hover:bg-red-50' }
  ];

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (balance) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {balance.employee_name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">{balance.employee_name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{balance.employee_code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'leave_type',
      label: 'Leave Type',
      render: (balance) => (
        <div>
          <div className="font-semibold text-slate-800">{balance.name}</div>
          <span className="inline-flex items-center justify-center rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 mt-1 uppercase tracking-tight">
            {balance.code}
          </span>
        </div>
      )
    },
    { key: 'year', label: 'Year', className: 'font-medium text-slate-500' },
    {
      key: 'allocated',
      label: 'Allocated',
      render: (balance) => (
        <span className="font-bold text-slate-700">{formatDays(balance.total_allocated)} <span className="text-[10px] text-slate-400">DAYS</span></span>
      )
    },
    {
      key: 'used',
      label: 'Used',
      render: (balance) => <span className="font-semibold text-orange-500">{formatDays(balance.used)}</span>
    },
    {
      key: 'remaining',
      label: 'Remaining',
      render: (balance) => {
        const remaining = balance.remaining;
        const low = isLowBalance(remaining);
        return (
          <div className="flex flex-col gap-1 min-w-[110px]">
            <div className={`text-sm font-bold ${low ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatDays(remaining)} <span className="text-[10px] uppercase">left</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getRemainingPercentage(remaining, balance.total_allocated)}%` }}
                className={`h-full rounded-full ${low ? 'bg-rose-500' : 'bg-emerald-500'}`}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'paid',
      label: 'Paid',
      render: (balance) => <PaidBadge isPaid={balance.is_paid} />
    }
  ];

  if (loading && balances.length === 0) return (
    <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-violet-500 text-4xl" />
            <p className="text-slate-400 font-medium animate-pulse">Initializing leave manager...</p>
        </div>
    </div>
  );

  return (
    <ManagementHub
      eyebrow={<><FaChartBar size={11} /> Leave allocation</>}
      title="Leave Balance Management"
      description="Monitor and adjust employee leave quotas and remaining balances."
      accent="violet"
      actions={
        <div className="flex items-center gap-3">
          <ManagementButton
            tone="violet"
            variant="solid"
            leftIcon={<FaPlus />}
            onClick={() => openModal('assign')}
          >
            Assign Balance
          </ManagementButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        {!loading && balances.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stat.isCount ? stat.value : formatDays(stat.value)}</p>
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
              placeholder="Search employee name, code or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center justify-between">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-violet-500/10 transition-all cursor-pointer hover:border-violet-200"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="violet" />
          </div>
        </motion.div>

        {/* Data View */}
        {totalItems === 0 && !loading ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaListUl size={24} /></div>
            <p className="text-slate-500 font-bold">No records found</p>
            <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">{searchTerm ? `We couldn't find anything matching "${searchTerm}"` : "Try assigning a new leave balance to get started."}</p>
          </motion.div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={paginatedData}
            columns={columns}
            rowKey={(row) => `${row.employee_id}-${row.leave_config_id}`}
            onRowClick={(row) => setViewModal({ open: true, balance: row })}
            getActions={(row) => ActionMenuButtons(row, (r) => openModal('edit', r), (r) => openModal('delete', r), (r) => setViewModal({ open: true, balance: r }), updateAccess, deleteAccess, updateMessage, deleteMessage)}
            accent="violet"
          />
        ) : (
          <ManagementGrid>
            {paginatedData.map((balance) => (
              <MobileBalanceCard
                key={getBalanceKey(balance)}
                balance={balance}
                onEdit={(record) => openModal('edit', record)}
                onDelete={(record) => openModal('delete', record)}
                onView={(record) => setViewModal({ open: true, balance: record })}
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
                showInfo={true}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewModal.open && viewModal.balance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeViewModal();
              }
            }}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-5 py-6 text-white sm:px-8 sm:py-8">
                <div className="relative z-10 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-xl bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-100">
                      {viewModal.balance.type}
                    </span>
                    <PaidBadge isPaid={viewModal.balance.is_paid} compact />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{viewModal.balance.name}</h2>
                  <p className="mt-2 text-sm text-slate-200">
                    {viewModal.balance.employee_name} • {viewModal.balance.employee_code || `#${viewModal.balance.employee_id}`} • Year {viewModal.balance.year}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="absolute right-4 top-4 z-10 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-6 sm:top-6"
                >
                  <FaTimes size={16} />
                </button>
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              </div>

              <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-5 custom-scrollbar sm:p-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="Employee" value={viewModal.balance.employee_name} />
                  <DetailItem label="Employee Code" value={viewModal.balance.employee_code || `#${viewModal.balance.employee_id}`} />
                  <DetailItem label="Email" value={viewModal.balance.email || '—'} />
                  <DetailItem label="Leave Config ID" value={viewModal.balance.leave_config_id} />
                  <DetailItem label="Allocated" value={`${formatDays(viewModal.balance.total_allocated)} days`} />
                  <DetailItem label="Used" value={`${formatDays(viewModal.balance.used)} days`} />
                  <DetailItem label="Remaining" value={`${formatDays(viewModal.balance.remaining)} days`} />
                  <DetailItem label="Max Balance" value={`${formatDays(viewModal.balance.max_balance)} days`} />
                  <DetailItem label="Carry Forward" value={`${formatDays(viewModal.balance.carry_forward_limit)} days`} />
                  <DetailItem label="Accrual Type" value={viewModal.balance.accrual_type || 'none'} />
                  <DetailItem label="Accrual Rate" value={`${formatDays(viewModal.balance.accrual_rate)} days`} />
                  <DetailItem
                    label="Half Day"
                    value={
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        viewModal.balance.allow_half_day ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {viewModal.balance.allow_half_day ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        {viewModal.balance.allow_half_day ? 'Allowed' : 'Not allowed'}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Negative Balance"
                    value={
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        viewModal.balance.allow_negative_balance ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {viewModal.balance.allow_negative_balance ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        {viewModal.balance.allow_negative_balance ? 'Allowed' : 'Blocked'}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Exclude Weekends"
                    value={
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        viewModal.balance.exclude_weekends ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {viewModal.balance.exclude_weekends ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        {viewModal.balance.exclude_weekends ? 'Yes' : 'No'}
                      </span>
                    }
                  />
                  <DetailItem
                    label="Comp Off"
                    value={
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        viewModal.balance.is_comp_off ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {viewModal.balance.is_comp_off ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        {viewModal.balance.is_comp_off ? 'Enabled' : 'Disabled'}
                      </span>
                    }
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Balance Progress</p>
                      <p className={`mt-2 text-2xl font-black ${isLowBalance(viewModal.balance.remaining) ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatDays(viewModal.balance.remaining)} days left
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>Used: <span className="font-semibold text-orange-600">{formatDays(viewModal.balance.used)}d</span></p>
                      <p className="mt-1">Allocated: <span className="font-semibold text-slate-700">{formatDays(viewModal.balance.total_allocated)}d</span></p>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getRemainingPercentage(viewModal.balance.remaining, viewModal.balance.total_allocated)}%` }}
                      className={`h-full rounded-full ${isLowBalance(viewModal.balance.remaining) ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeViewModal}
                    className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeViewModal();
                      openModal('edit', viewModal.balance);
                    }}
                    disabled={updateAccess.disabled}
                    title={updateAccess.disabled ? updateMessage : ''}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FaEdit className="mr-2 inline" size={12} />
                    Edit Balance
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full ${
                modalMode === 'delete'
                  ? 'max-w-lg max-h-[90vh] rounded-2xl flex flex-col overflow-y-auto'
                  : 'max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl'
              } bg-white shadow-2xl`}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {modalMode === 'delete' ? (
                <div className="flex flex-1 flex-col justify-center p-6">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="rounded-full bg-red-100 p-4">
                      <FaTrash className="text-2xl text-red-500" />
                    </div>
                  </div>
                  <h3 className="mb-1 text-center text-lg font-bold text-gray-800">
                    Delete Leave Balance
                  </h3>
                  <p className="mb-6 text-center text-sm text-gray-500">
                    Are you sure you want to delete this leave balance? This cannot be undone.
                  </p>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={saving || deleteAccess.disabled}
                      title={deleteAccess.disabled ? deleteMessage : ''}
                      className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-[10] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-3xl px-6 sm:px-8 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          {modalMode === 'assign' ? <FaPlus /> : <FaEdit />}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">
                            {modalMode === 'assign' ? 'Assign Balance' : 'Update Allocation'}
                          </h2>
                          <p className="text-xs text-white/80">
                            {modalMode === 'assign'
                              ? 'Set leave quota for a specific employee'
                              : `Modifying ${selectedBalance?.name}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                        <FaTimes size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <SearchableSelect
                      label="Select Employee"
                      placeholder="Choose an employee..."
                      value={formData.employee_id}
                      onChange={(value) => setFormData({ ...formData, employee_id: value })}
                      options={employees}
                      onSearch={handleEmployeeSearch}
                      loading={employeesLoading}
                      getOptionLabel={(employee) => `${employee.name} (${employee.employee_code})`}
                      getOptionValue={(employee) => employee.id}
                      renderOption={(employee) => (
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              {employee.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                           </div>
                           <div className="min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{employee.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono italic">{employee.employee_code} • {employee.email}</p>
                           </div>
                        </div>
                      )}
                    />

                    {modalMode === 'assign' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Leave Allocations
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                leaves: [...prev.leaves, { leave_config_id: '', total_allocated: 0 }],
                              }))
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                          >
                            <FaPlus size={10} /> Add More
                          </button>
                        </div>

                        {formData.leaves.map((row, idx) => (
                          <div key={idx} className="relative rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                                Leave #{idx + 1}
                              </span>
                              {formData.leaves.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      leaves: prev.leaves.filter((_, i) => i !== idx),
                                    }))
                                  }
                                  className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <FaTimes size={12} />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <SearchableSelect
                                label="Leave Type"
                                placeholder="Choose..."
                                value={row.leave_config_id}
                                onChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    leaves: prev.leaves.map((l, i) =>
                                      i === idx ? { ...l, leave_config_id: value } : l
                                    ),
                                  }))
                                }
                                options={leaveConfigs}
                                onSearch={handleLeaveConfigSearch}
                                loading={leaveConfigsLoading}
                                getOptionLabel={(config) => `${config.name} (${config.code})`}
                                getOptionValue={(config) => config.id}
                                renderOption={(config) => (
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 text-sm truncate">{config.name}</p>
                                      <p className="text-[10px] text-slate-400 font-mono italic">Code: {config.code}</p>
                                    </div>
                                    <PaidBadge isPaid={config.is_paid} compact />
                                  </div>
                                )}
                              />
                              <div className="space-y-2">
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Days</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={row.total_allocated}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      leaves: prev.leaves.map((l, i) =>
                                        i === idx ? { ...l, total_allocated: e.target.value } : l
                                      ),
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <SearchableSelect
                          label="Leave Type"
                          placeholder="Choose a leave type..."
                          value={formData.leave_config_id}
                          onChange={(value) => setFormData({ ...formData, leave_config_id: value })}
                          options={leaveConfigs}
                          onSearch={handleLeaveConfigSearch}
                          loading={leaveConfigsLoading}
                          getOptionLabel={(config) => `${config.name} (${config.code})`}
                          getOptionValue={(config) => config.id}
                          renderOption={(config) => (
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{config.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono italic">Code: {config.code} • Max: {config.max_balance}d</p>
                              </div>
                              <PaidBadge isPaid={config.is_paid} compact />
                            </div>
                          )}
                        />

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">
                            Allocation Details
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                  <FaCalendarAlt size={12} className="text-violet-500" />
                                  Total Allocation (Days)
                               </label>
                               <input
                                type="number"
                                step="0.5"
                                placeholder="e.g. 12.0"
                                value={formData.total_allocated}
                                onChange={(event) =>
                                  setFormData({ ...formData, total_allocated: event.target.value })
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5 font-semibold"
                              />
                            </div>
                            <div className="flex items-center">
                               <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 flex-1">
                                  <p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Preview</p>
                                  <p className="text-sm text-violet-800 font-medium italic">
                                    "{formData.total_allocated || 0} days" will be updated for the selected profile.
                                  </p>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={saving}
                        className="w-full rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleAction}
                        disabled={
                          saving || 
                          !formData.employee_id || 
                          (modalMode === 'assign' 
                            ? (formData.leaves.length === 0 || formData.leaves.some(l => !l.leave_config_id)) 
                            : !formData.leave_config_id) || 
                          (modalMode === 'assign' ? createAccess.disabled : updateAccess.disabled)
                        }
                        title={modalMode === 'assign' ? (createAccess.disabled ? createMessage : '') : (updateAccess.disabled ? updateMessage : '')}
                        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <div className="flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : modalMode === 'assign' ? (
                          'Add Balance'
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
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

export default LeaveBalanceManagement;
