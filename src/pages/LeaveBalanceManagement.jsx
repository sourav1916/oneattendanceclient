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
  if (!Number.isFinite(numericValue)) return '0';
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
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



const normalizeEmployeeBalances = (data, year) => {
  if (!data || !Array.isArray(data)) return [];

  return data.map((employee) => ({
    employee_id: employee.employee_id || employee.employee?.id || employee.id,
    employee_name: employee.employee_name || employee.employee?.name || employee.name || 'N/A',
    email: employee.email || employee.employee?.email,
    employee_code: employee.employee_code || employee.employee?.employee_code,
    leaves: (employee.leaves || []).map(leave => ({
      leave_config_id: leave.leave_config_id || leave.leave_config?.id,
      type: leave.type || leave.code || leave.leave_config?.code || 'N/A',
      code: leave.code || leave.type || leave.leave_config?.code || 'N/A',
      name: leave.name || leave.leave_config?.name || 'N/A',
      year: leave.year || year,
      total_allocated: leave.total_allocated ?? 0,
      used: leave.used ?? 0,
      remaining: leave.remaining ?? ((leave.total_allocated ?? 0) - (leave.used ?? 0)),
      is_paid: leave.is_paid ?? leave.leave_config?.is_paid ?? true,
      allow_half_day: leave.allow_half_day ?? leave.leave_config?.allow_half_day ?? false,
      accrual_type: leave.accrual_type || leave.leave_config?.accrual_type || 'none',
      accrual_rate: leave.accrual_rate ?? leave.leave_config?.accrual_rate ?? 0,
      max_balance: leave.max_balance ?? leave.leave_config?.max_balance ?? 0,
      carry_forward_limit: leave.carry_forward_limit ?? leave.leave_config?.carry_forward_limit ?? 0,
      allow_negative_balance: leave.allow_negative_balance ?? leave.leave_config?.allow_negative_balance ?? false,
      exclude_weekends: leave.exclude_weekends ?? leave.leave_config?.exclude_weekends ?? true,
      is_comp_off: leave.is_comp_off ?? leave.leave_config?.is_comp_off ?? false,
    }))
  }));
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

      allBalances = allBalances.concat(normalizeEmployeeBalances(result.data, year));
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
  disabled = false,
  renderOption,
  getOptionLabel,
  getOptionValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const selectedOption = options.find(opt => String(getOptionValue(opt)) === String(value));

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
        className={`relative cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 transition focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-50 ${disabled ? 'pointer-events-none' : ''}`}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <div className={`flex items-center justify-between px-4 py-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className={selectedOption ? 'text-slate-700' : 'text-slate-400'}>
            {selectedOption ? getOptionLabel(selectedOption) : placeholder}
          </span>
          <FaChevronDown
            className={`text-slate-400 transition-transform duration-200 ${isOpen && !disabled ? 'rotate-180' : ''}`}
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
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
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
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs font-semibold'
        }`}
    >
      <FaDollarSign size={compact ? 8 : 10} />
      PAID
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 text-slate-500 ${compact ? 'px-2 py-0.5 text-[10px] font-bold' : 'px-2.5 py-1 text-xs font-semibold'
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
    <div className="group relative overflow-hidden rounded-xl border border-white bg-white p-5 shadow-lg shadow-slate-200/50 transition duration-300 hover:shadow-xl sm:p-6">
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${styles.glow}`} />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
          <p className="mt-1 text-2xl font-black text-slate-800 sm:text-[1.9rem]">
            {stat.isCount ? stat.value : formatDays(stat.value)}
            {!stat.isCount && <span className="ml-1 text-xs font-bold uppercase text-slate-300">days</span>}
          </p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}>
          <stat.icon size={20} />
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, className = '' }) => (
  <div className={`rounded-xl border border-slate-100 bg-slate-50/80 p-4 ${className}`}>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
  </div>
);

const MobileBalanceCard = ({
  employee,
  onEdit,
  onDelete,
  onView,
  editDisabled,
  deleteDisabled,
  editMessage,
  deleteMessage,
}) => {
  const totalAllocated = employee.leaves.reduce((sum, l) => sum + (Number(l.total_allocated) || 0), 0);
  const totalUsed = employee.leaves.reduce((sum, l) => sum + (Number(l.used) || 0), 0);
  const totalRemaining = employee.leaves.reduce((sum, l) => sum + (Number(l.remaining) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md transition-all duration-300 group h-full flex flex-col"
      onClick={() => onView(employee)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-center text-violet-600 font-bold shrink-0">
            {employee.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-800">{employee.employee_name}</h3>
            <p className="text-[10px] text-slate-400 font-mono italic">{employee.employee_code}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            balance={employee}
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

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          <span>Assigned Leaves</span>
          <span>Rem.</span>
        </div>
        <div className="grid gap-2">
          {employee.leaves.slice(0, 3).map((leave, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-xs font-bold text-slate-700">{leave.code}</span>
              </div>
              <span className={`text-xs font-black ${isLowBalance(leave.remaining) ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatDays(leave.remaining)}d
              </span>
            </div>
          ))}
          {employee.leaves.length > 3 && (
            <div className="text-center py-1 text-[10px] font-bold text-slate-400 uppercase">
              + {employee.leaves.length - 3} more types
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Quota</p>
          <p className="text-xl font-black text-slate-800">{formatDays(totalAllocated)}<span className="text-xs ml-1 text-slate-400">DAYS</span></p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase text-emerald-600">Total Rem.</p>
          <p className="text-xl font-black text-emerald-600">{formatDays(totalRemaining)}<span className="text-xs ml-1 text-emerald-400">DAYS</span></p>
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

  // Fetch lookup data when the modal opens so edit mode can resolve labels too.
  useEffect(() => {
    if (showModal && modalMode !== 'delete') {
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
    if (modalMode === 'assign') {
      if (!formData.employee_id) {
        toast.error('Please select an employee');
        return;
      }
      const hasValidLeave = formData.leaves.some(l => l.leave_config_id);
      if (!hasValidLeave) {
        toast.error('Please select at least one leave type');
        return;
      }
    } else if (modalMode === 'edit') {
      if (!formData.employee_id) {
        toast.error('Please select an employee');
        return;
      }

      const hasValidLeave = formData.leaves.some(l => l.leave_config_id);
      if (!hasValidLeave) {
        toast.error('Please keep at least one leave type');
        return;
      }
    } else if (modalMode === 'delete') {
      if (!formData.leave_config_id) {
        toast.error('Please select a leave type to delete');
        return;
      }
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
          employee_id: formData.employee_id,
          leaves: formData.leaves.map(l => ({
            leave_config_id: l.leave_config_id,
            total_allocated: Number(l.total_allocated) || 0,
          })),
        };
        response = await apiCall('/leave/update-balance', 'PUT', payload, getCompanyId());
      } else if (modalMode === 'delete') {
        response = await apiCall('/leave/delete-balance', 'DELETE', {
          employee_id: selectedBalance.employee_id,
          leave_config_id: formData.leave_config_id,
        }, getCompanyId());
      }

      const result = await parseActionResponse(response, 'Operation failed');
      if (result.success) {
        toast.success(
          result.message ||
          `Balance ${modalMode === 'assign' ? 'assigned' : modalMode === 'edit' ? 'updated' : 'deleted'
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

    const nextFilteredBalances = balances.filter((employee) =>
      employee.employee_name?.toLowerCase().includes(normalizedSearch) ||
      employee.employee_code?.toLowerCase().includes(normalizedSearch) ||
      employee.email?.toLowerCase().includes(normalizedSearch) ||
      employee.leaves.some(leave =>
        leave.name?.toLowerCase().includes(normalizedSearch) ||
        leave.type?.toLowerCase().includes(normalizedSearch) ||
        leave.code?.toLowerCase().includes(normalizedSearch)
      ) ||
      String(employee.employee_id ?? '').includes(searchTerm.trim())
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
        leave_config_id: '',
        total_allocated: 0,
        leaves: (balance.leaves || []).map(l => ({
          leave_config_id: l.leave_config_id,
          total_allocated: l.total_allocated
        })),
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
      render: (employee) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {employee.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 text-sm truncate">{employee.employee_name}</div>
            <div className="text-[10px] text-slate-400 font-mono italic">{employee.employee_code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'leaves_summary',
      label: 'Assigned Leaves',
      render: (employee) => (
        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
          {employee.leaves.length > 0 ? (
            employee.leaves.map((leave, idx) => (
              <div
                key={idx}
                className="group relative flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-violet-200 hover:shadow-sm transition-all"
                title={`${leave.name}: ${formatDays(leave.remaining)}/${formatDays(leave.total_allocated)} remaining`}
              >
                <span className="text-[10px] font-bold text-violet-700">{leave.code}</span>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[9px] font-bold ${isLowBalance(leave.remaining) ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {formatDays(leave.remaining)}d
                  </span>
                </div>
              </div>
            ))
          ) : (
            <span className="text-[10px] text-slate-400 italic">No leaves assigned</span>
          )}
        </div>
      )
    },
    {
      key: 'total_allocation',
      label: 'Total Quota',
      render: (employee) => {
        const total = employee.leaves.reduce((sum, l) => sum + (Number(l.total_allocated) || 0), 0);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-700 text-sm">{formatDays(total)} <span className="text-[10px] text-slate-400">DAYS</span></span>
            <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">{employee.leaves.length} TYPES</span>
          </div>
        );
      }
    },
    {
      key: 'year',
      label: 'Year',
      render: (employee) => (
        <span className="text-sm font-medium text-slate-500">
          {employee.leaves[0]?.year || selectedYear}
        </span>
      )
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
              <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{stat.isCount ? stat.value : formatDays(stat.value)}</p>
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
          {/* Left Section: Search & Result Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search by name, code, or leave type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {YEAR_OPTIONS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${selectedYear === year
                      ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-100'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200 hover:text-violet-600'
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Right Section: Controls */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal('assign')}
              disabled={createAccess.disabled}
              title={createAccess.disabled ? createMessage : ''}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus size={14} />
              <span className="text-sm">Assign Balance</span>
            </motion.button>

            {/* Vertical Separator */}
            <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

            {/* View Switcher */}
            <ManagementViewSwitcher
              viewMode={viewMode}
              onChange={setViewMode}
              accent="violet"
            />
          </div>
        </motion.div>

        {/* Data View */}
        {totalItems === 0 && !loading ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FaCalendarAlt size={24} /></div>
            <p className="text-slate-500 font-bold">No leave balances found</p>
            <p className="text-slate-400 text-sm mt-1 mx-auto max-w-xs">{searchTerm ? `We couldn't find anything matching "${searchTerm}"` : "Employee leave balances will appear here."}</p>
          </motion.div>
        ) : viewMode === 'table' ? (
          <ManagementTable
            rows={paginatedData}
            columns={columns}
            rowKey={(row) => row.employee_id}
            onRowClick={(row) => setViewModal({ open: true, balance: row })}
            getActions={(row) => ActionMenuButtons(row, (r) => openModal('edit', r), (r) => openModal('delete', r), (r) => setViewModal({ open: true, balance: r }), updateAccess, deleteAccess, updateMessage, deleteMessage)}
            accent="violet"
          />
        ) : (
          <ManagementGrid>
            {paginatedData.map((employee) => (
              <MobileBalanceCard
                key={employee.employee_id}
                employee={employee}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto"
            onMouseDown={(event) => event.target === event.currentTarget && closeViewModal()}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-indigo-700 text-white px-6 sm:px-8 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-xl font-black shrink-0">
                      <FaUser size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold truncate leading-tight">{viewModal.balance.employee_name}</h2>
                      <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
                        <span className="font-mono">{viewModal.balance.employee_code}</span>
                        <span>•</span>
                        <span className="truncate">{selectedYear} Balance</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={closeViewModal} className="p-2 hover:bg-white/20 rounded-xl transition-all shrink-0"><FaTimes size={20} /></button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold text-emerald-600">Active Employment</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Year</p>
                    <p className="text-sm font-bold text-slate-700">{viewModal.balance.leaves[0]?.year || selectedYear}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Leaves</p>
                    <p className="text-sm font-bold text-slate-700 underline decoration-violet-200 decoration-2">{viewModal.balance.leaves.length} Assigned Types</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FaIdCard className="text-violet-500" /> Allocated Balances
                    </h3>
                    <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-black uppercase">Summary</span>
                  </div>

                  <div className="grid gap-3">
                    {viewModal.balance.leaves.map((leave, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-violet-200 hover:shadow-md transition-all group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-xl text-[10px] font-bold">{leave.code}</span>
                            <h4 className="font-bold text-slate-800 text-sm truncate">{leave.name}</h4>
                            <PaidBadge isPaid={leave.is_paid} compact />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50/50 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                              <p className="text-xs font-bold text-slate-700">{formatDays(leave.total_allocated)}d</p>
                            </div>
                            <div className="bg-slate-50/50 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Used</p>
                              <p className="text-xs font-bold text-orange-600">{formatDays(leave.used)}d</p>
                            </div>
                            <div className="bg-slate-50/50 rounded-xl p-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Rem.</p>
                              <p className={`text-xs font-black ${isLowBalance(leave.remaining) ? 'text-rose-600' : 'text-emerald-600'}`}>{formatDays(leave.remaining)}d</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-24 shrink-0">
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                            <div
                              className={`h-full rounded-full ${isLowBalance(leave.remaining) ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${getRemainingPercentage(leave.remaining, leave.total_allocated)}%` }}
                            />
                          </div>
                          <p className="text-[9px] font-black text-slate-400 text-center uppercase">{getRemainingPercentage(leave.remaining, leave.total_allocated).toFixed(0)}% Left</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 shrink-0">
                <button onClick={closeViewModal} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">
                  Close Window
                </button>
                <button onClick={() => { closeViewModal(); openModal('edit', viewModal.balance); }} className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-violet-200 transition-all flex items-center justify-center gap-2">
                  <FaEdit /> Edit Balances
                </button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
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
              className={`bg-white backdrop-blur-xl w-full max-h-[90vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden ${modalMode === 'delete' ? 'max-w-md' : 'max-w-3xl'
                }`}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {modalMode === 'delete' ? (
                <>
                  <div className="sticky top-0 z-[10] bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-[10px] px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <FaTrash className="text-white text-sm" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Delete Leave Balance</h2>
                          <p className="text-xs text-white/80">This action cannot be undone</p>
                        </div>
                      </div>
                      <button type="button" onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes size={20} /></button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed text-center">
                      Select the leave balance you want to delete for <span className="font-bold">{selectedBalance?.employee_name}</span>. This cannot be undone.
                    </p>
                    <div className="max-w-xs mx-auto">
                      <SearchableSelect
                        label="Leave Type to Delete"
                        placeholder="Choose..."
                        value={formData.leave_config_id}
                        onChange={(val) => setFormData(prev => ({ ...prev, leave_config_id: val }))}
                        options={selectedBalance?.leaves || []}
                        getOptionLabel={(l) => `${l.name} (${l.code})`}
                        getOptionValue={(l) => l.leave_config_id}
                        renderOption={(l) => (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-sm">{l.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{l.code}</span>
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={saving || !formData.leave_config_id || deleteAccess.disabled}
                      title={deleteAccess.disabled ? deleteMessage : ''}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="sticky top-0 z-[10] bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-t-[10px] px-6 sm:px-8 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          {modalMode === 'assign' ? <FaPlus /> : <FaEdit />}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">
                            {modalMode === 'assign' ? 'Assign Leave Balance' : 'Edit Leave Balance'}
                          </h2>
                          <p className="text-xs text-white/80">
                            {modalMode === 'assign'
                              ? 'Allocate new leave types to employees'
                              : `Editing: ${selectedBalance?.employee_name}`}
                          </p>
                        </div>
                      </div>
                      <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                        <FaTimes size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
                    <SearchableSelect
                      label="Select Employee"
                      placeholder="Choose an employee..."
                      value={formData.employee_id}
                      onChange={(value) => setFormData({ ...formData, employee_id: value })}
                      options={employees}
                      onSearch={handleEmployeeSearch}
                      loading={employeesLoading}
                      disabled={modalMode === 'edit'}
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {modalMode === 'assign' ? 'Leave Allocations' : 'Adjust Balances'}
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

                      <div className="grid gap-4">
                        {formData.leaves.map((row, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                                {modalMode === 'assign' ? `Leave #${idx + 1}` : 'Leave Type'}
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
                                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Total Days</label>
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
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/5"
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 px-6 sm:px-8 pb-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="w-full rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
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
                          : (formData.leaves.length === 0 || formData.leaves.some(l => !l.leave_config_id))) ||
                        (modalMode === 'assign' ? createAccess.disabled : updateAccess.disabled)
                      }
                      title={modalMode === 'assign' ? (createAccess.disabled ? createMessage : '') : (updateAccess.disabled ? updateMessage : '')}
                      className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
