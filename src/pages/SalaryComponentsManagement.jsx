import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaMoneyBillWave, FaPlus, FaSpinner, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaTimes,
    FaChartBar, FaEdit, FaTrash, FaInfoCircle,
    FaListUl, FaTh, FaPercentage, FaDollarSign,
    FaBuilding, FaBalanceScale, FaTag, FaToggleOn, FaToggleOff, FaEye,
    FaSearch, FaClock, FaBriefcase, FaUserCircle, FaCog
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';
import ModalScrollLock from "../components/ModalScrollLock";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

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

const CONFIRM_MODAL_CLASS = "bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col";

const COMPONENT_TYPES = [
    { value: 'earning', label: 'Earning', color: 'green' },
    { value: 'deduction', label: 'Deduction', color: 'red' },
    { value: 'employer_contribution', label: 'Employer Contribution', color: 'blue' },
];

const CALC_TYPES = [
    { value: 'percentage', label: 'Percentage', icon: '%' },
    { value: 'fixed', label: 'Fixed', icon: '₹' },
];

const getTypeConfig = (type) => {
    const map = {
        earning: { color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', gradient: 'from-green-500 to-emerald-600' },
        deduction: { color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', gradient: 'from-red-500 to-rose-600' },
        employer_contribution: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
    };
    return map[type] || { color: 'gray', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' };
};

const getCardAccentForType = (type) => {
    const map = {
        earning: 'green',
        deduction: 'rose',
        employer_contribution: 'indigo',
    };
    return map[type] || 'slate';
};

const formatTypeLabel = (type) => {
    const map = {
        earning: 'Earning',
        deduction: 'Deduction',
        employer_contribution: 'Employer Contribution',
    };
    return map[type] || type;
};

const formatCalcValue = (calcType, calcValue) => {
    const v = parseFloat(calcValue || 0);
    if (calcType === 'percentage') return `${v.toFixed(2)}%`;
    return `₹${v.toFixed(2)}`;
};

const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
    });
};

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

// ─── Component Detail Modal ───────────────────────────────────────────────────

const ComponentDetailModal = ({ component, onClose, onEdit, onDelete }) => {
    if (!component) return null;
    const tc = getTypeConfig(component.type);

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className={`sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r ${tc.gradient} text-white rounded-t-2xl`}>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaMoneyBillWave /> Component Details
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-6 pb-6 border-b">
                            <div className={`bg-gradient-to-br ${tc.gradient} p-4 rounded-2xl`}>
                                <FaMoneyBillWave className="text-white text-4xl" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{component.name}</h3>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <FaTag className="text-blue-500" size={14} />Code: {component.code}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <InfoItem icon={<FaBriefcase className="text-purple-500" />} label="Component Type" value={formatTypeLabel(component.type)} />
                            <InfoItem icon={<FaPercentage className="text-indigo-500" />} label="Calculation Type" value={<span className="capitalize">{component.calc_type}</span>} />
                            <InfoItem icon={<FaChartBar className="text-emerald-500" />} label="Value" value={formatCalcValue(component.calc_type, component.calc_value)} />
                            <InfoItem
                                icon={<FaBalanceScale className="text-orange-500" />}
                                label="Taxable"
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${component.is_taxable ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {component.is_taxable ? 'Taxable' : 'Non-Taxable'}
                                    </span>
                                }
                            />
                            <InfoItem
                                icon={<FaBuilding className="text-blue-500" />}
                                label="Statutory"
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${component.is_statutory ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {component.is_statutory ? 'Statutory' : 'Non-Statutory'}
                                    </span>
                                }
                            />
                            <InfoItem
                                icon={<FaToggleOn className="text-green-500" />}
                                label="Status"
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${component.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {component.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                }
                            />
                        </div>

                        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                                <FaInfoCircle className="text-blue-400" />
                                Component ID: #{component.id} · Created: {formatDate(component.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={() => { onEdit(component); onClose(); }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium flex items-center justify-center gap-2"
                        >
                            <FaEdit size={14} /> Edit Component
                        </button>
                        <button
                            onClick={() => { onDelete(component); onClose(); }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 font-medium flex items-center justify-center gap-2"
                        >
                            <FaTrash size={14} /> Delete
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

const FormModal = ({ mode, initial, onClose, onSave, saving }) => {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState({
        code: '',
        name: '',
        type: 'earning',
        calc_type: 'percentage',
        calc_value: '',
        is_taxable: false,
        is_statutory: false,
        is_active: true,
        ...initial,
    });
    const [errors, setErrors] = useState({});

    const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.code.trim()) e.code = 'Code is required';
        if (!form.name.trim()) e.name = 'Name is required';
        if (form.calc_value === '' || isNaN(Number(form.calc_value))) e.calc_value = 'Enter a valid value';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const payload = {
            ...form,
            calc_value: Number(form.calc_value),
            is_taxable: form.is_taxable ? 1 : 0,
            is_statutory: form.is_statutory ? 1 : 0,
            is_active: form.is_active ? 1 : 0,
        };
        if (isEdit) payload.id = initial.id;
        onSave(payload);
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            {isEdit ? <FaEdit /> : <FaPlus />} {isEdit ? 'Edit Component' : 'New Component'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Code *</label>
                                <input
                                    value={form.code}
                                    onChange={e => setField('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. HRA"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${errors.code ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    placeholder="e.g. House Rent Allowance"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Component Type *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {COMPONENT_TYPES.map(t => {
                                    const tc = getTypeConfig(t.value);
                                    const active = form.type === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setField('type', t.value)}
                                            className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${active ? `bg-gradient-to-r ${tc.gradient} text-white border-transparent shadow-md` : `${tc.bg} ${tc.text} ${tc.border} hover:shadow-sm`}`}
                                        >
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">Calculation Type *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CALC_TYPES.map(ct => (
                                        <button
                                            key={ct.value}
                                            type="button"
                                            onClick={() => setField('calc_type', ct.value)}
                                            className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1 ${form.calc_type === ct.value ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}
                                        >
                                            <span className="font-bold">{ct.icon}</span> {ct.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                    Value {form.calc_type === 'percentage' ? '(%)' : '(₹)'} *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                        {form.calc_type === 'percentage' ? '%' : '₹'}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.calc_value}
                                        onChange={e => setField('calc_value', e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${errors.calc_value ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                                    />
                                </div>
                                {errors.calc_value && <p className="text-xs text-red-500 mt-1">{errors.calc_value}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'is_taxable', label: 'Taxable', sub: 'Subject to tax', color: 'orange' },
                                { key: 'is_statutory', label: 'Statutory', sub: 'Govt. regulated', color: 'blue' },
                            ].map(toggle => {
                                const colorMap = { orange: 'from-orange-500 to-amber-500', blue: 'from-blue-500 to-indigo-500', green: 'from-green-500 to-emerald-500' };
                                const isOn = form[toggle.key];
                                return (
                                    <button
                                        key={toggle.key}
                                        type="button"
                                        onClick={() => setField(toggle.key, !isOn)}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${isOn ? `bg-gradient-to-br ${colorMap[toggle.color]} text-white border-transparent shadow-md` : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold">{toggle.label}</span>
                                            {isOn ? <FaToggleOn size={16} /> : <FaToggleOff size={16} className="text-gray-400" />}
                                        </div>
                                        <p className={`text-xs ${isOn ? 'text-white/80' : 'text-gray-400'}`}>{toggle.sub}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {saving ? <FaSpinner className="animate-spin" /> : (isEdit ? <FaEdit /> : <FaPlus />)}
                            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Component')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteConfirmModal = ({ component, onClose, onConfirm, deleting }) => {
    if (!component) return null;

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className={CONFIRM_MODAL_CLASS}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaTrash /> Delete Component
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6 text-center">
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
                            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <FaExclamationTriangle className="text-4xl text-red-600" />
                        </motion.div>
                        <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                        <p className="text-gray-500 mb-6">
                            You are about to delete the component{" "}
                            <span className="font-semibold text-red-600">{component.name}</span>.
                            This action cannot be undone.
                        </p>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                            <button onClick={onClose}
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
                                Keep
                            </button>
                            <button onClick={() => onConfirm(component.id)} disabled={deleting}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                                {deleting && <FaSpinner className="animate-spin" />}
                                Delete Component
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalaryComponents = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [formModal, setFormModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    // Mini-sidebar is always 80px wide on desktop (ml-20).
    // Subtract it so breakpoints fire at the real *content* width.
    const SIDEBAR_OFFSET = typeof window !== 'undefined' && window.innerWidth >= 768 ? 80 : 0;
    const contentWidth = windowWidth - SIDEBAR_OFFSET;

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchComponents = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            let url = `/salary/components/list?page=${page}&limit=${pagination.limit}`;
            if (search) url += `&search=${search}`;

            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setComponents(result.data || []);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? true
                });
            } else {
                throw new Error(result.message || 'Failed to fetch components');
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Failed to load components');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // Search trigger
    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchComponents(1, debouncedSearch, true);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchComponents(pagination.page, debouncedSearch, true);
        }
    }, [pagination.page, pagination.limit, debouncedSearch]);

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('company'));
        if (company && isInitialLoad) {
            fetchComponents(1, "", true);
        } else if (!company) {
            toast.error("Company ID not found. Please ensure you're logged in as a company.");
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    const handleSave = async (payload) => {
        setSaving(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));

            const isEdit = !!payload.id;

            const endpoint = `/salary/components/${isEdit ? 'update' : 'create'}`;
            const method = isEdit ? 'PUT' : 'POST'; // ✅ FIXED

            console.log('API DEBUG =>', { endpoint, method, payload });

            const response = await apiCall(
                endpoint,
                method, // ✅ dynamic method
                payload,
                company?.id
            );

            const result = await response.json();

            if (result.success) {
                toast.success(
                    isEdit
                        ? 'Component updated successfully!'
                        : 'Component created successfully!'
                );

                setFormModal(null);
                fetchComponents(1, debouncedSearch, true);
            } else {
                throw new Error(result.message || 'Save failed');
            }

        } catch (e) {
            toast.error(e.message || 'Failed to save component');
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/delete', 'POST', { id }, company?.id);
            const result = await response.json();
            if (result.success) {
                toast.success('Component deleted successfully!');
                setDeleteTarget(null);
                fetchComponents(1, debouncedSearch, true);
            } else {
                throw new Error(result.message || 'Delete failed');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to delete component');
        } finally {
            setDeleting(false);
        }
    };

    const stats = {
        total: pagination.total || 0,
        earningCount: components.filter(c => c.type === 'earning').length,
        deductionCount: components.filter(c => c.type === 'deduction').length,
        employerCount: components.filter(c => c.type === 'employer_contribution').length,
    };

    if (isInitialLoad && loading) return <SkeletonComponent />;

    // Determine which columns to show based on content width (excludes 80px mini-sidebar)
    // On very small screens (< 640px): only show Name and Actions
    // On small screens (640px - 768px): show Name, Type, Value, Actions
    // On medium screens (768px - 1024px): show Name, Type, Calculation, Value, Actions
    // On large screens (> 1024px): show all columns including Code, Flags, Status
    const showCode   = contentWidth >= 1024;
    const showCalc   = contentWidth >= 768;
    const showFlags  = contentWidth >= 1280;
    const showStatus = contentWidth >= 1024;
    const showType   = contentWidth >= 640;
    const showValue  = contentWidth >= 420; // Hide value column under 420px content width
    const componentActions = (comp) => ([
        {
            label: 'View Details',
            icon: <FaEye size={13} />,
            onClick: () => setSelectedComponent(comp),
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        },
        {
            label: 'Edit',
            icon: <FaEdit size={13} />,
            onClick: () => setFormModal({ mode: 'edit', data: comp }),
            className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
        },
        {
            label: 'Delete',
            icon: <FaTrash size={13} />,
            onClick: () => setDeleteTarget(comp),
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
        },
    ]);

    const componentColumns = [
        {
            key: 'code',
            label: 'Code',
            visible: showCode,
            className: 'font-mono',
            render: (comp) => (
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1 font-mono text-xs font-bold text-gray-700">
                    {comp.code}
                </span>
            ),
        },
        {
            key: 'name',
            label: 'Name',
            className: 'font-semibold text-gray-800',
            render: (comp) => comp.name,
        },
        {
            key: 'type',
            label: 'Type',
            visible: showType,
            render: (comp) => {
                const tc = getTypeConfig(comp.type);
                return (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tc.bg} ${tc.text} ${tc.border}`}>
                        {formatTypeLabel(comp.type)}
                    </span>
                );
            },
        },
        {
            key: 'calc_type',
            label: 'Calculation',
            visible: showCalc,
            render: (comp) => <span className="capitalize text-gray-600">{comp.calc_type}</span>,
        },
        {
            key: 'calc_value',
            label: 'Value',
            visible: showValue,
            render: (comp) => (
                <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {formatCalcValue(comp.calc_type, comp.calc_value)}
                </span>
            ),
        },
        {
            key: 'flags',
            label: 'Flags',
            visible: showFlags,
            render: (comp) => (
                <div className="flex flex-wrap gap-1">
                    {comp.is_taxable && (
                        <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                            Tax
                        </span>
                    )}
                    {comp.is_statutory && (
                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                            Stat
                        </span>
                    )}
                    {!comp.is_taxable && !comp.is_statutory && <span className="text-xs text-gray-400">—</span>}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            visible: showStatus,
            render: (comp) => (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${comp.is_active ? 'border-green-200 bg-green-100 text-green-800' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                    {comp.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    const emptyState = (
        <ManagementCard
            accent="blue"
            className="mx-auto max-w-xl"
            hoverable={false}
            bodyClassName="pt-0"
        >
            <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100">
                    <FaMoneyBillWave className="text-4xl text-gray-300" />
                </div>
                <p className="text-xl font-semibold text-gray-700">No components found</p>
                <p className="mt-2 text-sm text-gray-400">
                    {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Click "Add Component" to get started'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {debouncedSearch ? (
                        <ManagementButton tone="blue" variant="soft" onClick={() => setSearchTerm('')}>
                            Clear Search
                        </ManagementButton>
                    ) : (
                        <ManagementButton
                            tone="blue"
                            variant="solid"
                            leftIcon={<FaPlus />}
                            onClick={() => setFormModal({ mode: 'create', data: {} })}
                        >
                            Add Component
                        </ManagementButton>
                    )}
                </div>
            </div>
        </ManagementCard>
    );

    return (
        <ManagementHub
            eyebrow="Salary components"
            title="Salary Components"
            description="Manage earnings, deductions, and employer contribution components from a shared production UI."
            accent="blue"
            summary={(
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                    <FaMoneyBillWave className="h-4 w-4" />
                    <span>{stats.total}</span>
                    <span>components</span>
                </div>
            )}
            actions={(
                <ManagementButton
                    tone="blue"
                    variant="solid"
                    leftIcon={<FaPlus />}
                    onClick={() => setFormModal({ mode: 'create', data: {} })}
                >
                    Add Component
                </ManagementButton>
            )}
            contentClassName="space-y-6"
        >
            <ManagementCard
                accent="slate"
                title="Search"
                subtitle="Find and filter salary components by name or code."
                icon={<FaSearch />}
                hoverable={false}
                bodyClassName="pt-0"
            >
                <div className="relative">
                    <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search by component name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </ManagementCard>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{components.length}</span> of{' '}
                    <span className="font-semibold text-gray-800">{stats.total}</span> components
                    {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                </p>
                <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
            </div>

            {loading && !components.length && <SkeletonComponent />}

            {!loading && components.length === 0 && emptyState}

            {!loading && components.length > 0 && viewMode === "table" && (
                <ManagementTable
                    rows={components}
                    columns={componentColumns}
                    rowKey="id"
                    accent="blue"
                    activeId={activeActionMenu}
                    onToggleAction={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                    onRowClick={(row) => setSelectedComponent(row)}
                    getActions={componentActions}
                    rowClassName="hover:bg-gradient-to-r hover:from-blue-50 hover:to-violet-50 cursor-pointer"
                    headerClassName="xsm:hidden"
                />
            )}

            {!loading && components.length > 0 && viewMode === "card" && (
                <ManagementGrid viewMode={viewMode}>
                    {components.map((comp, index) => {
                        const tc = getTypeConfig(comp.type);
                        const accent = getCardAccentForType(comp.type);

                        return (
                            <ManagementCard
                                key={comp.id}
                                accent={accent}
                                title={comp.name}
                                subtitle={comp.code}
                                icon={<FaMoneyBillWave className="text-gray-600" />}
                                badge={(
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${comp.is_active ? 'border-green-200 bg-green-100 text-green-800' : 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                                        {comp.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                )}
                                actions={componentActions(comp)}
                                menuId={`card-${comp.id}`}
                                activeId={activeActionMenu}
                                onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                onClick={() => setSelectedComponent(comp)}
                                delay={index * 0.05}
                                bodyClassName="space-y-3"
                                footer={(
                                    <span className="text-xs text-gray-400">ID: #{comp.id}</span>
                                )}
                            >
                                <div>
                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tc.bg} ${tc.text} ${tc.border}`}>
                                        {formatTypeLabel(comp.type)}
                                    </span>
                                </div>

                                <div className="text-2xl font-bold text-indigo-600">
                                    {formatCalcValue(comp.calc_type, comp.calc_value)}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-center">
                                        <p className="text-xs text-gray-500">Calculation</p>
                                        <p className="mt-1 text-sm font-semibold capitalize text-gray-700">
                                            {comp.calc_type}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 text-center">
                                        <p className="text-xs text-gray-500">Taxable</p>
                                        <p className={`mt-1 text-sm font-semibold ${comp.is_taxable ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {comp.is_taxable ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50 p-2 text-center">
                                        <p className="text-xs text-gray-500">Statutory</p>
                                        <p className={`mt-1 text-sm font-semibold ${comp.is_statutory ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {comp.is_statutory ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                            </ManagementCard>
                        );
                    })}
                </ManagementGrid>
            )}

            {!loading && components.length > 0 && (
                <Pagination
                    currentPage={pagination.page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    showInfo={true}
                    onLimitChange={changeLimit}
                />
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedComponent && (
                    <ComponentDetailModal
                        component={selectedComponent}
                        onClose={() => setSelectedComponent(null)}
                        onEdit={(comp) => setFormModal({ mode: 'edit', data: comp })}
                        onDelete={(comp) => setDeleteTarget(comp)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {formModal && (
                    <FormModal
                        mode={formModal.mode}
                        initial={formModal.data}
                        onClose={() => setFormModal(null)}
                        onSave={handleSave}
                        saving={saving}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <DeleteConfirmModal
                        component={deleteTarget}
                        onClose={() => setDeleteTarget(null)}
                        onConfirm={handleDelete}
                        deleting={deleting}
                    />
                )}
            </AnimatePresence>
        </ManagementHub>
    );
};

export default SalaryComponents;
