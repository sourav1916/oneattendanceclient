import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaSearch, FaSpinner,
  FaEllipsisV, FaPlus, FaInfoCircle, FaHistory, FaDollarSign,
  FaCalendarAlt, FaMoneyBillWave, FaChevronLeft, FaChevronRight,
  FaUsers, FaClock, FaGlobe, FaBan, FaUserCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
    HISTORY: 'HISTORY'
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const CURRENCY_SYMBOLS = {
    usd: '$', inr: '₹', eur: '€', gbp: '£', jpy: '¥', cad: 'C$', aud: 'A$', chf: 'Fr', cny: '¥'
};

const SALARY_TYPE_LABELS = {
    monthly: 'Monthly', hourly: 'Hourly', yearly: 'Yearly', weekly: 'Weekly', daily: 'Daily'
};

// ─── Salary Form Body Component ───────────────────────────────────────────────
const SalaryFormBody = ({
  onSubmit, isEdit = false, formData, onInputChange, loading, onClose, title
}) => (
  <form onSubmit={onSubmit} className="p-4 sm:p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaDollarSign className="text-emerald-500" /> Base Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number" step="0.01" name="base_amount" value={formData.base_amount}
          onChange={onInputChange} required placeholder="e.g., 50000"
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaClock className="text-purple-500" /> Salary Type <span className="text-red-500">*</span>
        </label>
        <select
          name="salary_type" value={formData.salary_type} onChange={onInputChange} required
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
        >
          <option value="">Select Type</option>
          <option value="monthly">Monthly</option>
          <option value="hourly">Hourly</option>
          <option value="yearly">Yearly</option>
          <option value="weekly">Weekly</option>
          <option value="daily">Daily</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaGlobe className="text-blue-500" /> Currency <span className="text-red-500">*</span>
        </label>
        <select
          name="currency" value={formData.currency} onChange={onInputChange} required
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
        >
          <option value="">Select Currency</option>
          <option value="usd">USD ($)</option>
          <option value="inr">INR (₹)</option>
          <option value="eur">EUR (€)</option>
          <option value="gbp">GBP (£)</option>
          <option value="jpy">JPY (¥)</option>
          <option value="cad">CAD (C$)</option>
          <option value="aud">AUD (A$)</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FaCalendarAlt className="text-orange-500" /> Effective From <span className="text-red-500">*</span>
        </label>
        <input
          type="date" name="effective_from" value={formData.effective_from}
          onChange={onInputChange} required
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
        />
      </div>
      {!isEdit && (
        <div className="sm:col-span-2">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 flex items-center gap-1">
              <FaInfoCircle className="text-amber-500 flex-shrink-0" />
              This will create a new salary record. Previous salary (if any) will be automatically closed.
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
      <button type="button" onClick={onClose} className="px-4 sm:px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-sm">Cancel</button>
      <button type="submit" disabled={loading}
        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm">
        {loading ? <FaSpinner className="animate-spin" /> : <FaCheck size={12} />}
        {isEdit ? 'Update Salary' : 'Assign Salary'}
      </button>
    </div>
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SalaryManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { pagination, updatePagination, goToPage } = usePagination(1, 10);
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  const emptyForm = { employee_id: '', salary_type: 'monthly', base_amount: '', currency: 'usd', effective_from: '' };
  const [formData, setFormData] = useState(emptyForm);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page on new search
  useEffect(() => {
    if (initialFetchDone.current) {
      if (pagination.page !== 1) goToPage(1);
      else fetchEmployees(1);
    }
  }, [debouncedSearch]);

  // ─── API Calls ────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async (page = pagination.page) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const companyId = company?.id ?? null;
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: pagination.limit.toString(),
        history: 'true'
      });
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await apiCall(`/salary/employees-salaries?${params}`, 'GET', null, companyId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      
      if (result.success) {
        setEmployees(result.data);
        updatePagination({ 
          page: result.page, 
          limit: result.limit, 
          total: result.total, 
          total_pages: Math.ceil(result.total / result.limit),
          is_last_page: result.page >= Math.ceil(result.total / result.limit)
        });
      } else throw new Error(result.message || 'Failed to fetch employees');
    } catch (e) {
      console.error('fetchEmployees:', e);
      toast.error(e.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [pagination.limit, debouncedSearch, updatePagination]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchEmployees(1);
    }
  }, [fetchEmployees]);

  useEffect(() => {
    if (initialFetchDone.current && !fetchInProgress.current) {
      fetchEmployees(pagination.page);
    }
  }, [pagination.page, fetchEmployees]);

  // ─── CRUD Operations ─────────────────────────────────────────────────────
  const assignSalary = async (data) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/salary/assign-salary', 'POST', {
        employee_id: data.employee_id,
        salary_type: data.salary_type,
        base_amount: parseFloat(data.base_amount),
        currency: data.currency,
        effective_from: data.effective_from
      }, company?.id);

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);
      if (result.success) return { success: true };
      throw new Error(result.message || 'Assignment failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const updateSalary = async (data) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/salary/update-salary', 'PUT', {
        salary_id: data.salary_id,
        salary_type: data.salary_type,
        base_amount: parseFloat(data.base_amount),
        currency: data.currency
      }, company?.id);

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);
      if (result.success) return { success: true };
      throw new Error(result.message || 'Update failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const reviseSalary = async (data) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/salary/revise-salary', 'POST', {
        employee_id: data.employee_id,
        salary_type: data.salary_type,
        base_amount: parseFloat(data.base_amount),
        currency: data.currency,
        effective_from: data.effective_from
      }, company?.id);

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);
      if (result.success) return { success: true };
      throw new Error(result.message || 'Revision failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const deleteSalary = async (salaryId) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/salary/delete-salary', 'DELETE', {
        salary_id: salaryId
      }, company?.id);

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);
      if (result.success) return { success: true };
      throw new Error(result.message || 'Delete failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const fetchSalaryHistory = async (employee) => {
    setHistoryLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall(`/salary/employees-salaries?history=true&employee_id=${employee.employee_id}`, 'GET', null, company?.id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) {
        const empData = result.data.find(e => e.employee_id === employee.employee_id);
        setHistoryData(empData?.salary || []);
      } else throw new Error(result.message || 'Failed to fetch history');
    } catch (e) {
      console.error('fetchSalaryHistory:', e);
      toast.error(e.message || 'Failed to fetch history');
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── Modal handlers ───────────────────────────────────────────────────────
  const openCreateModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({ 
      employee_id: employee.employee_id, 
      salary_type: 'monthly', 
      base_amount: '', 
      currency: 'usd', 
      effective_from: new Date().toISOString().split('T')[0] 
    });
    setModalType(MODAL_TYPES.CREATE);
    setActiveActionMenu(null);
  };

  const openEditModal = (employee, salary) => {
    setSelectedEmployee(employee);
    setSelectedSalary(salary);
    setFormData({
      salary_id: salary.id,
      salary_type: salary.salary_type,
      base_amount: salary.base_amount,
      currency: salary.currency,
      effective_from: salary.effective_from
    });
    setModalType(MODAL_TYPES.EDIT);
    setActiveActionMenu(null);
  };

  const openReviseModal = (employee) => {
    const activeSalary = employee.salary?.find(s => s.is_active === 1);
    setSelectedEmployee(employee);
    setFormData({ 
      employee_id: employee.employee_id, 
      salary_type: activeSalary?.salary_type || 'monthly', 
      base_amount: '', 
      currency: activeSalary?.currency || 'usd', 
      effective_from: new Date().toISOString().split('T')[0] 
    });
    setModalType(MODAL_TYPES.VIEW); // Reusing VIEW modal for revision
    setActiveActionMenu(null);
  };

  const openViewModal = (employee) => {
    setSelectedEmployee(employee);
    setModalType(MODAL_TYPES.VIEW);
    setActiveActionMenu(null);
  };

  const openHistoryModal = async (employee) => {
    setSelectedEmployee(employee);
    setModalType(MODAL_TYPES.HISTORY);
    setActiveActionMenu(null);
    await fetchSalaryHistory(employee);
  };

  const openDeleteModal = (employee, salary) => {
    setSelectedEmployee(employee);
    setSelectedSalary(salary);
    setModalType(MODAL_TYPES.DELETE_CONFIRM);
    setActiveActionMenu(null);
  };

  const closeModal = () => {
    setModalType(MODAL_TYPES.NONE);
    setSelectedEmployee(null);
    setSelectedSalary(null);
    setFormData(emptyForm);
    setHistoryData([]);
  };

  const toggleActionMenu = (e, id) => {
    e.stopPropagation();
    setActiveActionMenu(activeActionMenu === id ? null : id);
  };

  // ─── Form handlers ────────────────────────────────────────────────────────
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await assignSalary(formData);
    if (result.success) {
      toast.success('Salary assigned successfully!');
      closeModal();
      fetchEmployees(pagination.page);
    } else toast.error(result.error || 'Failed to assign salary');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const result = await updateSalary(formData);
    if (result.success) {
      toast.success('Salary updated successfully!');
      closeModal();
      fetchEmployees(pagination.page);
    } else toast.error(result.error || 'Failed to update salary');
  };

  const handleRevise = async (e) => {
    e.preventDefault();
    const result = await reviseSalary(formData);
    if (result.success) {
      toast.success('Salary revised successfully!');
      closeModal();
      fetchEmployees(pagination.page);
    } else toast.error(result.error || 'Failed to revise salary');
  };

  const handleDelete = async () => {
    const result = await deleteSalary(selectedSalary.id);
    if (result.success) {
      toast.success('Salary deleted successfully!');
      closeModal();
      fetchEmployees(pagination.page);
    } else toast.error(result.error || 'Failed to delete salary');
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getActiveSalary = (employee) => {
    return employee.salary?.find(s => s.is_active === 1);
  };

  const formatCurrency = (amount, currency) => {
    const symbol = CURRENCY_SYMBOLS[currency?.toLowerCase()] || currency?.toUpperCase() || '$';
    return `${symbol} ${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const handler = () => setActiveActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page) goToPage(newPage);
  }, [pagination.page, goToPage]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-6 font-sans bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-center sm:text-left">
          Salary Management
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-2 rounded-full shadow-sm whitespace-nowrap">
            Total: <span className="font-semibold text-emerald-600">{pagination.total}</span> employees
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 sm:mb-6">
        <div className="relative w-full">
          <input
            type="text" placeholder="Search by employee name, email, or code..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none shadow-lg transition-all text-sm"
          />
          <FaSearch className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-sm sm:text-xl" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600">
              <FaTimes size={13} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading && employees.length === 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-100 rounded w-1/6" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="ml-auto h-8 w-20 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-6 bg-gray-100 rounded w-28" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-xl">
          <FaMoneyBillWave className="text-6xl sm:text-8xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg sm:text-xl text-gray-500">No salary records found</p>
          <p className="text-gray-400 mt-2 text-sm">Try adjusting your search</p>
        </motion.div>
      )}

      {/* Desktop Table + Mobile Cards */}
      {!loading && employees.length > 0 && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Current Salary</th>
                    <th className="px-6 py-4">Effective From</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp, index) => {
                    const activeSalary = getActiveSalary(emp);
                    return (
                      <motion.tr key={emp.employee_id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                        className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-300"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl flex-shrink-0">
                              <FaUserCircle className="text-white text-sm" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{emp.name}</p>
                              <p className="text-xs text-gray-400">{emp.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200 capitalize">
                            {emp.designation}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {activeSalary ? (
                            <span className="font-bold text-emerald-600">
                              {formatCurrency(activeSalary.base_amount, activeSalary.currency)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {activeSalary ? formatDate(activeSalary.effective_from) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {activeSalary ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                              {SALARY_TYPE_LABELS[activeSalary.salary_type] || activeSalary.salary_type}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button onClick={e => toggleActionMenu(e, emp.employee_id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md">
                            <FaEllipsisV className="text-gray-600 text-xs" />
                          </button>
                          <AnimatePresence>
                            {activeActionMenu === emp.employee_id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                                onClick={e => e.stopPropagation()}
                              >
                                <button onClick={() => openViewModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-blue-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaEye size={12} /> View Details</button>
                                <button onClick={() => openCreateModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 text-emerald-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaPlus size={12} /> Assign Salary</button>
                                {activeSalary && (
                                  <>
                                    <button onClick={() => openEditModal(emp, activeSalary)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 text-amber-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaEdit size={12} /> Edit Salary</button>
                                    <button onClick={() => openReviseModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 text-purple-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaHistory size={12} /> Revise Salary</button>
                                    <button onClick={() => openDeleteModal(emp, activeSalary)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaTrash size={12} /> Delete Salary</button>
                                  </>
                                )}
                                <button onClick={() => openHistoryModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-600 flex items-center gap-3 transition-all duration-300 text-sm border-t border-gray-100"><FaHistory size={12} /> View History</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Mobile/Tablet Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {employees.map((emp, index) => {
              const activeSalary = getActiveSalary(emp);
              return (
                <motion.div key={emp.employee_id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl flex-shrink-0">
                        <FaUserCircle className="text-white text-base sm:text-lg" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-gray-800 truncate">{emp.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{emp.employee_code}</p>
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200 mt-1 capitalize">
                          {emp.designation}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={e => toggleActionMenu(e, emp.employee_id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <FaEllipsisV className="text-gray-500 text-xs" />
                      </button>
                      <AnimatePresence>
                        {activeActionMenu === emp.employee_id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                          >
                            <button onClick={() => openViewModal(emp)} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-blue-600 flex items-center gap-2 text-xs"><FaEye size={10} /> View Details</button>
                            <button onClick={() => openCreateModal(emp)} className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 text-xs"><FaPlus size={10} /> Assign Salary</button>
                            {activeSalary && (
                              <>
                                <button onClick={() => openEditModal(emp, activeSalary)} className="w-full text-left px-4 py-2.5 hover:bg-amber-50 text-amber-600 flex items-center gap-2 text-xs"><FaEdit size={10} /> Edit</button>
                                <button onClick={() => openReviseModal(emp)} className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-purple-600 flex items-center gap-2 text-xs"><FaHistory size={10} /> Revise</button>
                                <button onClick={() => openDeleteModal(emp, activeSalary)} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 text-xs"><FaTrash size={10} /> Delete</button>
                              </>
                            )}
                            <button onClick={() => openHistoryModal(emp)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-600 flex items-center gap-2 text-xs border-t border-gray-100"><FaHistory size={10} /> History</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Current Salary</span>
                      {activeSalary ? (
                        <span className="font-bold text-emerald-600 text-sm">
                          {formatCurrency(activeSalary.base_amount, activeSalary.currency)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not assigned</span>
                      )}
                    </div>
                    {activeSalary && (
                      <>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Effective From</span>
                          <span className="text-xs text-gray-700">{formatDate(activeSalary.effective_from)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">Type</span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                            {SALARY_TYPE_LABELS[activeSalary.salary_type] || activeSalary.salary_type}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page} totalItems={pagination.total}
            itemsPerPage={pagination.limit} onPageChange={handlePageChange}
            variant="default" showInfo={true}
          />
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalType !== MODAL_TYPES.NONE && (
          <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={closeModal}
          >
            <ModalScrollLock />
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* VIEW / REVISE MODAL */}
              {(modalType === MODAL_TYPES.VIEW && selectedEmployee) && (
                <>
                  <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-t-2xl overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-white/30 flex-shrink-0">
                            <FaUserCircle className="text-white text-2xl sm:text-3xl" />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight break-words">{selectedEmployee.name}</h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 text-white rounded-full text-xs font-semibold">
                                <FaUsers size={9} />{selectedEmployee.employee_code}
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 text-white rounded-full text-xs font-semibold capitalize">
                                {selectedEmployee.designation}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0 text-white"><FaTimes size={16} /></button>
                      </div>
                      <p className="mt-3 text-sm text-emerald-100 leading-relaxed pl-1">{selectedEmployee.email}</p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {(() => {
                      const activeSalary = getActiveSalary(selectedEmployee);
                      const isReviseMode = formData.base_amount !== '';
                      return (
                        <>
                          {activeSalary && !isReviseMode && (
                            <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200">
                              <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                                <FaDollarSign className="text-emerald-600" /> Current Active Salary
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Amount</p>
                                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(activeSalary.base_amount, activeSalary.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Type</p>
                                  <p className="text-sm font-medium">{SALARY_TYPE_LABELS[activeSalary.salary_type]}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Effective From</p>
                                  <p className="text-sm font-medium">{formatDate(activeSalary.effective_from)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Status</p>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <form onSubmit={handleRevise}>
                            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <FaHistory className="text-purple-500" /> {activeSalary ? 'Revise Salary' : 'Assign New Salary'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Base Amount <span className="text-red-500">*</span></label>
                                <input
                                  type="number" step="0.01" name="base_amount" value={formData.base_amount}
                                  onChange={handleInputChange} required placeholder="Enter new amount"
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                                <select name="salary_type" value={formData.salary_type} onChange={handleInputChange} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-gray-50">
                                  <option value="monthly">Monthly</option>
                                  <option value="hourly">Hourly</option>
                                  <option value="yearly">Yearly</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="daily">Daily</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                <select name="currency" value={formData.currency} onChange={handleInputChange} className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none bg-gray-50">
                                  <option value="usd">USD ($)</option>
                                  <option value="inr">INR (₹)</option>
                                  <option value="eur">EUR (€)</option>
                                  <option value="gbp">GBP (£)</option>
                                  <option value="jpy">JPY (¥)</option>
                                </select>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Effective From <span className="text-red-500">*</span></label>
                                <input
                                  type="date" name="effective_from" value={formData.effective_from}
                                  onChange={handleInputChange} required
                                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                              <p className="text-xs text-purple-700 flex items-center gap-1">
                                <FaInfoCircle className="flex-shrink-0" />
                                This will close the current active salary and start a new one from the effective date.
                              </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                              <button type="button" onClick={closeModal} className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium text-sm">Cancel</button>
                              <button type="submit" disabled={loading}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center gap-2 transition-all font-medium disabled:opacity-50 shadow-lg text-sm">
                                {loading ? <FaSpinner className="animate-spin" /> : <FaCheck size={12} />}
                                Revise Salary
                              </button>
                            </div>
                          </form>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* HISTORY MODAL */}
              {modalType === MODAL_TYPES.HISTORY && selectedEmployee && (
                <>
                  <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-t-2xl overflow-hidden">
                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30">
                            <FaHistory className="text-white text-2xl" />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-white">Salary History</h2>
                            <p className="text-sm text-gray-300">{selectedEmployee.name} ({selectedEmployee.employee_code})</p>
                          </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl text-white"><FaTimes size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {historyLoading ? (
                      <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-gray-400" /></div>
                    ) : historyData.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl">
                        <FaBan className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No salary history found</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {historyData.map((salary, idx) => (
                          <motion.div key={salary.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border-2 transition-all ${salary.is_active ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex flex-wrap justify-between items-start gap-2">
                              <div>
                                <p className="font-bold text-lg text-emerald-600">{formatCurrency(salary.base_amount, salary.currency)}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    {SALARY_TYPE_LABELS[salary.salary_type]}
                                  </span>
                                  {salary.is_active && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 flex items-center gap-1"><FaCalendarAlt size={10} /> From: {formatDate(salary.effective_from)}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FaCalendarAlt size={10} /> To: {salary.effective_to ? formatDate(salary.effective_to) : 'Present'}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                      <button onClick={closeModal} className="px-4 sm:px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium text-sm">Close</button>
                    </div>
                  </div>
                </>
              )}

              {/* CREATE MODAL */}
              {modalType === MODAL_TYPES.CREATE && selectedEmployee && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-2xl">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaPlus /> Assign Salary to {selectedEmployee.name}</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl"><FaTimes size={16} /></button>
                  </div>
                  <SalaryFormBody
                    onSubmit={handleCreate} isEdit={false} formData={formData}
                    onInputChange={handleInputChange} loading={loading} onClose={closeModal}
                  />
                </>
              )}

              {/* EDIT MODAL */}
              {modalType === MODAL_TYPES.EDIT && selectedEmployee && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-t-2xl">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaEdit /> Edit Salary for {selectedEmployee.name}</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl"><FaTimes size={16} /></button>
                  </div>
                  <form onSubmit={handleEdit} className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                        <select name="salary_type" value={formData.salary_type} onChange={handleInputChange} className="w-full p-3 border-2 border-gray-200 rounded-xl">
                          <option value="monthly">Monthly</option>
                          <option value="hourly">Hourly</option>
                          <option value="yearly">Yearly</option>
                          <option value="weekly">Weekly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Amount</label>
                        <input type="number" step="0.01" name="base_amount" value={formData.base_amount} onChange={handleInputChange} required className="w-full p-3 border-2 border-gray-200 rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select name="currency" value={formData.currency} onChange={handleInputChange} className="w-full p-3 border-2 border-gray-200 rounded-xl">
                          <option value="usd">USD ($)</option>
                          <option value="inr">INR (₹)</option>
                          <option value="eur">EUR (€)</option>
                          <option value="gbp">GBP (£)</option>
                          <option value="jpy">JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                      <button type="button" onClick={closeModal} className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100">Cancel</button>
                      <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />} Update Salary
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* DELETE CONFIRM MODAL */}
              {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedEmployee && selectedSalary && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaTrash /> Confirm Delete</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl"><FaTimes size={16} /></button>
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaTrash className="text-2xl sm:text-3xl text-red-600" />
                    </div>
                    <p className="text-lg sm:text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                    <p className="text-sm text-gray-500 mb-6">
                      You are about to delete the salary record for <span className="font-semibold text-red-600">{selectedEmployee.name}</span>:<br />
                      {formatCurrency(selectedSalary.base_amount, selectedSalary.currency)} ({SALARY_TYPE_LABELS[selectedSalary.salary_type]})
                    </p>
                    <div className="flex justify-center gap-3">
                      <button onClick={closeModal} className="px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100">Cancel</button>
                      <button onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />} Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalaryManagement;