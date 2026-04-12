import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaMoneyBillWave, FaPlus, FaSpinner, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaTimes,
    FaChartBar, FaEdit, FaTrash, FaInfoCircle,
    FaListUl, FaTh, FaPercentage, FaDollarSign,
    FaBuilding, FaBalanceScale, FaTag, FaToggleOn, FaToggleOff, FaEye,
    FaSearch, FaClock, FaBriefcase, FaUserCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
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

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-pink-600',
        orange: 'from-orange-500 to-amber-500',
        red: 'from-red-500 to-rose-600',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`bg-gradient-to-r ${colorMap[color]} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs opacity-80">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </motion.div>
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

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

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
    }, [pagination.page]);

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

    // Determine which columns to show based on window width - matching Salary Management pattern
    // On very small screens (< 640px): only show Name and Actions
    // On small screens (640px - 768px): show Name, Type, Value, Actions
    // On medium screens (768px - 1024px): show Name, Type, Calculation, Value, Actions
    // On large screens (> 1024px): show all columns including Code, Flags, Status
    const showCode = windowWidth >= 1024;
    const showCalc = windowWidth >= 768;
    const showFlags = windowWidth >= 1280;
    const showStatus = windowWidth >= 1024;
    const showType = windowWidth >= 640;
    const showValue = true; // Always show value

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
                >
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Salary Components
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                            <FaMoneyBillWave className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-700">{stats.total}</span>
                            <span className="text-gray-500">components</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormModal({ mode: 'create', data: {} })}
                            className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600
                                       text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
                                       transition-all duration-300 flex items-center gap-2 overflow-hidden"
                        >
                            <div className="relative z-10">
                                <svg className="w-4 h-4 group-hover:rotate-90 transition-all duration-300"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="relative z-10 text-sm">Add Component</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                           transition-transform duration-700 bg-gradient-to-r
                                           from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                    <SummaryCard icon={<FaMoneyBillWave />} label="Total Components" value={stats.total} color="blue" delay={0.05} />
                    <SummaryCard icon={<FaCheckCircle />} label="Earnings" value={stats.earningCount} color="green" delay={0.1} />
                    <SummaryCard icon={<FaTimesCircle />} label="Deductions" value={stats.deductionCount} color="red" delay={0.15} />
                    <SummaryCard icon={<FaBuilding />} label="Employer Contributions" value={stats.employerCount} color="purple" delay={0.2} />
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6"
                >
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search by component name or code..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* View Toggle & Info */}
                {!loading && components.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-800">{components.length}</span> of{' '}
                            <span className="font-semibold text-gray-800">{stats.total}</span> components
                            {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                        </p>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !components.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && components.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaMoneyBillWave className="text-4xl text-gray-300" />
                        </div>
                        <p className="text-xl font-semibold text-gray-600">No components found</p>
                        <p className="text-gray-400 mt-2 text-sm">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Click "Add Component" to get started'}
                        </p>
                        {debouncedSearch && (
                            <button onClick={() => setSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium">
                                Clear Search
                            </button>
                        )}
                        {!debouncedSearch && (
                            <button onClick={() => setFormModal({ mode: 'create', data: {} })}
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium">
                                Add Component
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Table View */}
                {!loading && components.length > 0 && viewMode === "table" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-visible"
                    >
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        {showCode && <th className="px-6 py-4">Code</th>}
                                        <th className="px-6 py-4">Name</th>
                                        {showType && <th className="px-6 py-4">Type</th>}
                                        {showCalc && <th className="px-6 py-4">Calculation</th>}
                                        <th className="px-6 py-4">Value</th>
                                        {showFlags && <th className="px-6 py-4">Flags</th>}
                                        {showStatus && <th className="px-6 py-4">Status</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {components.map((comp, index) => {
                                        const tc = getTypeConfig(comp.type);
                                        return (
                                            <motion.tr
                                                key={comp.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedComponent(comp)}
                                            >
                                                {showCode && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 font-mono">
                                                            {comp.code}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{comp.name}</div>
                                                </td>
                                                {showType && (
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${tc.bg} ${tc.text} ${tc.border}`}>
                                                            {formatTypeLabel(comp.type)}
                                                        </span>
                                                    </td>
                                                )}
                                                {showCalc && (
                                                    <td className="px-6 py-4">
                                                        <span className="capitalize text-gray-600">{comp.calc_type}</span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                                                        {formatCalcValue(comp.calc_type, comp.calc_value)}
                                                    </span>
                                                </td>
                                                {showFlags && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {comp.is_taxable && (
                                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-xs font-medium">Tax</span>
                                                            )}
                                                            {comp.is_statutory && (
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium">Stat</span>
                                                            )}
                                                            {!comp.is_taxable && !comp.is_statutory && (
                                                                <span className="text-xs text-gray-400">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                {showStatus && (
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${comp.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                            {comp.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <ActionMenu
                                                            menuId={`table-${comp.id}`}
                                                            activeId={activeActionMenu}
                                                            onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                                            actions={[
                                                                {
                                                                    label: 'View Details',
                                                                    icon: <FaEye size={13} />,
                                                                    onClick: () => setSelectedComponent(comp),
                                                                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                                },
                                                                {
                                                                    label: 'Edit',
                                                                    icon: <FaEdit size={13} />,
                                                                    onClick: () => setFormModal({ mode: 'edit', data: comp }),
                                                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                                },
                                                                {
                                                                    label: 'Delete',
                                                                    icon: <FaTrash size={13} />,
                                                                    onClick: () => setDeleteTarget(comp),
                                                                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Card View */}
                {!loading && components.length > 0 && viewMode === "card" && (
                    <ManagementGrid viewMode={viewMode}>
                        {components.map((comp, index) => {
                            const tc = getTypeConfig(comp.type);
                            return (
                                <motion.div
                                    key={comp.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedComponent(comp)}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between gap-2.5 mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                                <FaMoneyBillWave className="text-white text-lg" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 truncate">{comp.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5 font-mono">{comp.code}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${comp.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {comp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${tc.bg} ${tc.text} ${tc.border}`}>
                                            {formatTypeLabel(comp.type)}
                                        </span>
                                    </div>

                                    <div className="text-2xl font-bold text-indigo-600 mb-3">
                                        {formatCalcValue(comp.calc_type, comp.calc_value)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                                            <p className="text-xs text-gray-500">Calculation</p>
                                            <p className="text-sm font-semibold text-gray-700 capitalize mt-1">{comp.calc_type}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                                            <p className="text-xs text-gray-500">Taxable</p>
                                            <p className={`text-sm font-semibold mt-1 ${comp.is_taxable ? 'text-orange-600' : 'text-gray-400'}`}>
                                                {comp.is_taxable ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100 col-span-2">
                                            <p className="text-xs text-gray-500">Statutory</p>
                                            <p className={`text-sm font-semibold mt-1 ${comp.is_statutory ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {comp.is_statutory ? 'Yes' : 'No'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs text-gray-400">
                                            ID: #{comp.id}
                                        </span>
                                        <ActionMenu
                                            menuId={`card-${comp.id}`}
                                            activeId={activeActionMenu}
                                            onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                            actions={[
                                                {
                                                    label: 'View Details',
                                                    icon: <FaEye size={13} />,
                                                    onClick: () => setSelectedComponent(comp),
                                                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                },
                                                {
                                                    label: 'Edit',
                                                    icon: <FaEdit size={13} />,
                                                    onClick: () => setFormModal({ mode: 'edit', data: comp }),
                                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                },
                                                {
                                                    label: 'Delete',
                                                    icon: <FaTrash size={13} />,
                                                    onClick: () => setDeleteTarget(comp),
                                                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                }
                                            ]}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && components.length > 0 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        variant="default"
                        showInfo={true}
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
            </div>
        </div>
    );
};

export default SalaryComponents;