import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    FaPlus, FaSearch, FaSpinner, FaFileInvoiceDollar,
    FaCalendarAlt, FaDollarSign, FaEye, FaCalculator,
    FaTimes, FaFilter, FaMoneyBillWave, FaCoins
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import Modal from '../components/Modal';
import usePermissionAccess from '../hooks/usePermissionAccess';
import { EmployeeSelect } from '../components/common';

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

export default function PayrollAdjustment() {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const createAccess = checkActionAccess('payrollManagement', 'create');

    const [adjustments, setAdjustments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    
    // Filters
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [adjustmentType, setAdjustmentType] = useState('');
    const [usageType, setUsageType] = useState('');
    
    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    
    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        adjustment_type: 'bonus',
        usage_type: 'payroll',
        name: '',
        remark: '',
        amount: '',
        currency: 'INR',
        adjustment_period: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
    });

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchAdjustments = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                month: selectedMonth.toString(),
                year: selectedYear.toString()
            });

            if (adjustmentType) params.append('adjustment_type', adjustmentType);
            if (usageType) params.append('usage_type', usageType);

            const response = await apiCall(`/payroll/adjustments/list?${params}`, 'GET', null, company?.id);
            const result = await response.json();

            if (result.success) {
                setAdjustments(result.data || []);
                setSummary(result.meta?.summary || null);
                updatePagination({
                    page: result.meta?.page || page,
                    limit: result.meta?.limit || pagination.limit,
                    total: result.meta?.total || 0,
                    total_pages: result.meta?.total_pages || 1,
                    is_last_page: page >= (result.meta?.total_pages || 1)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch adjustments');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch adjustments');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [pagination.page, pagination.limit, selectedMonth, selectedYear, adjustmentType, usageType, updatePagination]);

    useEffect(() => {
        if (isMounted.current) {
            fetchAdjustments(pagination.page);
        }
    }, [pagination.page, pagination.limit, selectedMonth, selectedYear, adjustmentType, usageType]);

    const handleCreate = async (e) => {
        e.preventDefault();
        
        if (!formData.employee_id || !formData.name || !formData.amount || !formData.adjustment_period) {
            toast.warning('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/payroll/adjustments', 'POST', {
                ...formData,
                amount: parseFloat(formData.amount),
                employee_id: parseInt(formData.employee_id)
            }, company?.id);
            
            const result = await response.json();
            if (result.success) {
                toast.success('Adjustment created successfully!');
                setIsCreateModalOpen(false);
                setFormData({
                    ...formData,
                    name: '',
                    remark: '',
                    amount: '',
                });
                fetchAdjustments(1);
            } else {
                throw new Error(result.message || 'Failed to create adjustment');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to create adjustment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return '₹0.00';
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-6">
            
            {/* Header & Controls */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Payroll Adjustments</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage bonuses, fines, and ledger adjustments.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={createAccess.disabled}
                    title={createAccess.disabled ? getAccessMessage(createAccess) : ''}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                    <FaPlus size={14} /> Create Adjustment
                </button>
            </motion.div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Payroll Bonus
                        </p>
                        <p className="text-xl font-black text-green-600">{formatCurrency(summary.payroll?.bonus)}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Payroll Fine
                        </p>
                        <p className="text-xl font-black text-red-600">{formatCurrency(summary.payroll?.fine)}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span> Ledger Bonus
                        </p>
                        <p className="text-xl font-black text-teal-600">{formatCurrency(summary.ledger?.bonus)}</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Ledger Fine
                        </p>
                        <p className="text-xl font-black text-orange-600">{formatCurrency(summary.ledger?.fine)}</p>
                    </motion.div>
                </div>
            )}

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between"
            >
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        {Array.from({ length: 5 }, (_, i) => {
                            const year = currentDate.getFullYear() - 2 + i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>

                    <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

                    <select
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        <option value="">All Types</option>
                        <option value="bonus">Bonus</option>
                        <option value="fine">Fine</option>
                    </select>

                    <select
                        value={usageType}
                        onChange={(e) => setUsageType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                        <option value="">All Usages</option>
                        <option value="payroll">Payroll</option>
                        <option value="ledger">Ledger</option>
                    </select>
                </div>

                <div className="flex justify-end">
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                </div>
            </motion.div>

            {loading && !adjustments.length ? (
                <SkeletonComponent />
            ) : !loading && adjustments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <FaCalculator className="text-6xl text-gray-200 mx-auto mb-4" />
                    <p className="text-xl text-gray-500 font-medium">No adjustments found</p>
                    <p className="text-gray-400 mt-2 text-sm">Try changing your filters or create a new adjustment.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'table' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Adjustment Name</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Usage</th>
                                            <th className="px-6 py-4">Period</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {adjustments.map((adj) => (
                                            <tr key={adj.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-800">{adj.employee?.name}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-800 font-medium">{adj.name}</p>
                                                    {adj.remark && <p className="text-xs text-gray-500 truncate max-w-xs">{adj.remark}</p>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                                        adj.adjustment_type === 'bonus' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {adj.adjustment_type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 uppercase">
                                                        {adj.usage_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {formatDate(adj.adjustment_period)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold ${
                                                        adj.adjustment_type === 'bonus' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {adj.adjustment_type === 'bonus' ? '+' : '-'}{formatCurrency(adj.amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {viewMode === 'card' && (
                        <ManagementGrid viewMode={viewMode}>
                            {adjustments.map((adj) => (
                                <div key={adj.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{adj.employee?.name}</h3>
                                            <p className="text-xs text-gray-500">{formatDate(adj.adjustment_period)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                            adj.adjustment_type === 'bonus' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {adj.adjustment_type}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-800">{adj.name}</p>
                                        {adj.remark && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{adj.remark}</p>}
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <span className="text-xs font-semibold text-gray-400 uppercase">{adj.usage_type}</span>
                                        <span className={`text-lg font-black ${
                                            adj.adjustment_type === 'bonus' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {adj.adjustment_type === 'bonus' ? '+' : '-'}{formatCurrency(adj.amount)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </ManagementGrid>
                    )}

                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={goToPage}
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
                </>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                        onClick={() => !submitting && setIsCreateModalOpen(false)}
                    >
                        <ModalScrollLock />
                        <motion.div variants={modalVariants}
                            className="bg-white relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <FaCoins className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Create Adjustment</h2>
                                        <p className="text-xs text-gray-500">Add a new bonus or fine</p>
                                    </div>
                                </div>
                                <button onClick={() => !submitting && setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-5 bg-gray-50/50">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Employee *</label>
                                    <EmployeeSelect 
                                        value={formData.employee_id} 
                                        onChange={(id) => setFormData({ ...formData, employee_id: id })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Type *</label>
                                        <select
                                            value={formData.adjustment_type}
                                            onChange={(e) => setFormData({ ...formData, adjustment_type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        >
                                            <option value="bonus">Bonus (+)</option>
                                            <option value="fine">Fine (-)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Usage *</label>
                                        <select
                                            value={formData.usage_type}
                                            onChange={(e) => setFormData({ ...formData, usage_type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                                        >
                                            <option value="payroll">Payroll</option>
                                            <option value="ledger">Ledger</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Adjustment Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Performance Bonus"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Remark</label>
                                    <textarea
                                        placeholder="Add any context or details..."
                                        rows="2"
                                        value={formData.remark}
                                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Amount ({formData.currency}) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Period *</label>
                                        <input
                                            type="date"
                                            value={formData.adjustment_period}
                                            onChange={(e) => setFormData({ ...formData, adjustment_period: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => !submitting && setIsCreateModalOpen(false)}
                                    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <FaSpinner className="animate-spin" /> : null}
                                    {submitting ? 'Saving...' : 'Save Adjustment'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
