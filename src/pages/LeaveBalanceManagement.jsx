import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSyncAlt, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaToggleOn,
  FaEye,
  FaEllipsisV,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";
import ModalScrollLock from "../components/ModalScrollLock";

// ─── 3-dot Action Menu ────────────────────────────────────────────────────────

const ActionMenu = ({ balance, onEdit, onDelete, onView }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpen(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <FaEllipsisV size={13} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-9 z-30 min-w-[148px] rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
          >
            <button
              type="button"
              onClick={() => { setOpen(false); onView(balance); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-600 transition hover:bg-slate-50"
            >
              <FaEye size={12} className="text-slate-400" /> View Details
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit(balance); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
            >
              <FaEdit size={12} /> Edit Balance
            </button>
            <div className="my-1 border-t border-gray-50" />
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(balance); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <FaTrash size={12} /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const LeaveBalanceManagement = () => {
  const [balances, setBalances] = useState([]);
  const [filteredBalances, setFilteredBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('assign');
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const { pagination, updatePagination } = usePagination(1, ITEMS_PER_PAGE);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_config_id: '',
    total_allocated: 0
  });

  const [visibleColumns, setVisibleColumns] = useState({
    employee_id: true,
    name: true,
    code: true,
    year: true,
    total_allocated: true,
    used: true,
    remaining: true,
    is_paid: true,
    max_balance: true,
    actions: true
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setVisibleColumns({
        employee_id: width >= 1280,
        name: width >= 640,
        code: width >= 480,
        year: width >= 768,
        total_allocated: width >= 640,
        used: width >= 640,
        remaining: width >= 640,
        is_paid: width >= 1024,
        max_balance: width >= 1024,
        actions: true
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedEmployee) params.employee_id = selectedEmployee;
      params.year = selectedYear;
      
      const response = await apiCall('/leave/balance', 'GET', params);
      if (response.success) {
        setBalances(response.data || []);
        setFilteredBalances(response.data || []);
        updatePagination(response.data?.length || 0);
      } else {
        toast.error(response.message || 'Failed to fetch balances');
      }
    } catch (error) {
      toast.error('Connection error while fetching balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEmployee, selectedYear]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBalances(balances);
    } else {
      const filtered = balances.filter(balance => 
        balance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.employee_id.toString().includes(searchTerm)
      );
      setFilteredBalances(filtered);
    }
  }, [searchTerm, balances]);

  const handleAction = async () => {
    setSaving(true);
    try {
      let response;
      if (modalMode === 'assign') {
        response = await apiCall('/leave/assign-balance', 'POST', {
          employee_id: formData.employee_id,
          leaves: [{ leave_config_id: formData.leave_config_id, total_allocated: formData.total_allocated }]
        });
      } else if (modalMode === 'edit') {
        response = await apiCall('/leave/update-balance', 'PUT', {
          employee_id: selectedBalance.employee_id,
          leaves: [{ leave_config_id: selectedBalance.leave_config_id, total_allocated: formData.total_allocated }]
        });
      } else if (modalMode === 'delete') {
        response = await apiCall('/leave/delete-balance', 'DELETE', {
          employee_id: selectedBalance.employee_id,
          leave_config_id: selectedBalance.leave_config_id
        });
      }

      if (response.success) {
        toast.success(response.message || `Balance ${modalMode === 'assign' ? 'assigned' : modalMode === 'edit' ? 'updated' : 'deleted'} successfully`);
        setShowModal(false);
        fetchData();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openModal = (mode, balance = null) => {
    setModalMode(mode);
    if (balance) {
      setSelectedBalance(balance);
      setFormData({
        employee_id: balance.employee_id,
        leave_config_id: balance.leave_config_id,
        total_allocated: parseFloat(balance.total_allocated)
      });
    } else {
      setSelectedBalance(null);
      setFormData({
        employee_id: '',
        leave_config_id: '',
        total_allocated: 0
      });
    }
    setShowModal(true);
  };

  const getRemainingPercentage = (remaining, total) => {
    const remainingNum = parseFloat(remaining);
    const totalNum = parseFloat(total);
    if (totalNum === 0) return 0;
    return Math.min(100, (remainingNum / totalNum) * 100);
  };

  const tableHeaders = [
    { key: 'employee_id', label: 'Emp ID', visible: visibleColumns.employee_id },
    { key: 'name', label: 'Leave Type', visible: visibleColumns.name },
    { key: 'code', label: 'Code', visible: visibleColumns.code },
    { key: 'year', label: 'Year', visible: visibleColumns.year },
    { key: 'total_allocated', label: 'Allocated', visible: visibleColumns.total_allocated },
    { key: 'used', label: 'Used', visible: visibleColumns.used },
    { key: 'remaining', label: 'Remaining', visible: visibleColumns.remaining },
    { key: 'is_paid', label: 'Paid', visible: visibleColumns.is_paid },
    { key: 'max_balance', label: 'Max', visible: visibleColumns.max_balance },
    { key: 'actions', label: 'Actions', visible: visibleColumns.actions }
  ];

  const paginatedData = filteredBalances.slice(
    (pagination.page - 1) * ITEMS_PER_PAGE,
    pagination.page * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">Leave Balance Management</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage employee leave allocations across the company</p>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('assign')}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 active:scale-95 sm:w-auto"
        >
          <FaPlus size={12} /> Assign Balance
        </motion.button>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        <div className="relative lg:col-span-6">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by leave type, code or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          />
        </div>
        
        <div className="flex gap-3 lg:col-span-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          >
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>Year: {year}</option>
            ))}
          </select>
          
          <button
            onClick={fetchData}
            className="flex aspect-square w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-violet-600 active:scale-95"
            title="Refresh"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {tableHeaders.filter(h => h.visible).map(header => (
                  <th key={header.key} className="px-6 py-4">
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={tableHeaders.filter(h => h.visible).length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FaSpinner className="animate-spin text-3xl text-violet-500" />
                      <span className="font-medium text-slate-500">Loading leave balances...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.filter(h => h.visible).length} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="rounded-full bg-slate-50 p-4">
                        <FaSearch size={24} className="text-slate-300" />
                       </div>
                       <p className="font-semibold text-slate-700">No balances found</p>
                       <p className="text-xs text-slate-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((balance, index) => (
                  <motion.tr
                    key={balance.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group transition duration-150 hover:bg-slate-50/60"
                  >
                    {visibleColumns.employee_id && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            #{balance.employee_id}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{balance.name}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{balance.code}</div>
                      </td>
                    )}
                    {visibleColumns.code && (
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                          {balance.code}
                        </span>
                      </td>
                    )}
                    {visibleColumns.year && (
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {balance.year}
                      </td>
                    )}
                    {visibleColumns.total_allocated && (
                      <td className="px-6 py-4">
                        <span className="text-base font-bold text-slate-800">{parseFloat(balance.total_allocated).toFixed(1)}</span>
                        <span className="ml-1 text-[10px] font-bold uppercase text-slate-400">days</span>
                      </td>
                    )}
                    {visibleColumns.used && (
                      <td className="px-6 py-4 text-orange-600 font-semibold">
                        {parseFloat(balance.used).toFixed(1)}
                      </td>
                    )}
                    {visibleColumns.remaining && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className={`text-sm font-bold ${parseFloat(balance.remaining) <= 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {parseFloat(balance.remaining).toFixed(1)} <span className="text-[10px] uppercase">left</span>
                          </div>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${getRemainingPercentage(balance.remaining, balance.total_allocated)}%` }}
                              className={`h-full rounded-full transition-all ${
                                parseFloat(balance.remaining) <= 1 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.is_paid && (
                      <td className="px-6 py-4">
                        {balance.is_paid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <FaDollarSign size={8} /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                            UNPAID
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.max_balance && (
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {parseFloat(balance.max_balance).toFixed(1)}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4">
                        <ActionMenu 
                          balance={balance} 
                          onEdit={(b) => openModal('edit', b)} 
                          onDelete={(b) => openModal('delete', b)}
                          onView={(b) => toast.info(`Viewing details for ${b.name}`)}
                        />
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredBalances.length > ITEMS_PER_PAGE && (
          <div className="border-t border-slate-50 bg-slate-50/30 px-6 py-4">
            <Pagination
              currentPage={pagination.page}
              totalItems={filteredBalances.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(p) => pagination.onPageChange(p)}
            />
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[
          { label: 'Total Allocated', value: balances.reduce((sum, b) => sum + parseFloat(b.total_allocated), 0), icon: FaCalendarAlt, color: 'violet' },
          { label: 'Total Used', value: balances.reduce((sum, b) => sum + parseFloat(b.used), 0), icon: FaClock, color: 'orange' },
          { label: 'Total Remaining', value: balances.reduce((sum, b) => sum + parseFloat(b.remaining), 0), icon: FaCheck, color: 'emerald' },
          { label: 'Active Types', value: balances.filter(b => b.is_active).length, icon: FaToggleOn, color: 'indigo', isCount: true }
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-3xl border border-white bg-white p-6 shadow-lg shadow-slate-200/50 transition duration-300 hover:shadow-xl">
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-${stat.color}-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-black text-slate-800 mt-1`}>
                  {stat.isCount ? stat.value : stat.value.toFixed(1)}
                  {!stat.isCount && <span className="ml-1 text-xs font-bold text-slate-300 uppercase">days</span>}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Action Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => !saving && setShowModal(false)}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full ${modalMode === 'delete' ? 'max-w-sm' : 'max-w-md'} overflow-hidden rounded-[2.5rem] bg-white shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {modalMode === 'delete' ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <FaTrash size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Confirm Deletion</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Are you sure you want to remove this leave balance? This action is permanent and cannot be undone.
                  </p>
                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={saving}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAction}
                      disabled={saving}
                      className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:opacity-50"
                    >
                      {saving ? <FaSpinner className="mx-auto animate-spin" /> : 'Delete Balance'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-8 text-white">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold">
                        {modalMode === 'assign' ? 'Assign New Balance' : 'Update Allocation'}
                      </h2>
                      <p className="mt-1 text-sm text-violet-100 opacity-80">
                        {modalMode === 'assign' ? 'Configure leave quota for an employee' : `Modifying allocation for ${selectedBalance?.name}`}
                      </p>
                    </div>
                    <button 
                      onClick={() => !saving && setShowModal(false)}
                      className="absolute right-6 top-6 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                      <FaTimes size={16} />
                    </button>
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                  </div>

                  <div className="p-8">
                    <div className="space-y-5">
                      {modalMode === 'assign' && (
                        <>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Employee ID</label>
                            <div className="relative">
                              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Enter Employee ID (e.g. 7)"
                                value={formData.employee_id}
                                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Leave Config ID</label>
                            <input
                              type="text"
                              placeholder="Config ID (e.g. 5)"
                              value={formData.leave_config_id}
                              onChange={(e) => setFormData({...formData, leave_config_id: e.target.value})}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Total Allocation (Days)</label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            step="0.5"
                            placeholder="e.g. 12.0"
                            value={formData.total_allocated}
                            onChange={(e) => setFormData({...formData, total_allocated: e.target.value})}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        disabled={saving}
                        className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={handleAction}
                        disabled={saving}
                        className="flex-[2] rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="flex items-center justify-center gap-2">
                             <FaSpinner className="animate-spin" />
                             <span>Processing...</span>
                          </div>
                        ) : (
                          modalMode === 'assign' ? 'Add Balance' : 'Save Changes'
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
    </div>
  );
};

export default LeaveBalanceManagement;