import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaMoneyBillWave, FaChevronLeft, FaChevronRight,
    FaPlus, FaSpinner, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaTimes,
    FaChartBar, FaEdit, FaTrash, FaInfoCircle,
    FaListUl, FaTh, FaPercentage, FaDollarSign,
    FaBuilding, FaBalanceScale, FaTag, FaToggleOn, FaToggleOff, FaEye
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPONENT_TYPES = [
    { value: 'earning', label: 'Earning', color: 'green' },
    { value: 'deduction', label: 'Deduction', color: 'red' },
    { value: 'employer_contribution', label: 'Employer Contribution', color: 'blue' },
];

const CALC_TYPES = [
    { value: 'percentage', label: 'Percentage', icon: '%' },
    { value: 'fixed', label: 'Fixed', icon: '₹' },
];

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTypeConfig = (type) => {
    const map = {
        earning: { color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', gradient: 'from-green-500 to-emerald-600' },
        deduction: { color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', gradient: 'from-red-500 to-rose-600' },
        employer_contribution: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
        employer_contributio: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', gradient: 'from-blue-500 to-indigo-600' },
    };
    return map[type] || { color: 'gray', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' };
};

const formatTypeLabel = (type) => {
    const map = {
        earning: 'Earning',
        deduction: 'Deduction',
        employer_contribution: 'Employer Contribution',
        employer_contributio: 'Employer Contribution',
    };
    return map[type] || type;
};

const formatCalcValue = (calcType, calcValue) => {
    const v = parseFloat(calcValue || 0);
    if (calcType === 'percentage') return `${v.toFixed(2)}%`;
    return `₹${v.toFixed(2)}`;
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-amber-500',
        red: 'from-red-500 to-rose-600',
        indigo: 'from-indigo-500 to-indigo-600',
    };
    const textMap = {
        blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700',
        orange: 'text-orange-700', red: 'text-red-700', indigo: 'text-indigo-700',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex items-center gap-3 hover:shadow-lg transition-all duration-300"
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-sm">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
                <p className={`text-lg font-bold ${textMap[color]}`}>{value}</p>
            </div>
        </motion.div>
    );
};

// ─── Detail Row ───────────────────────────────────────────────────────────────

const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">{icon}{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
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
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${tc.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                                    <FaMoneyBillWave className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{component.name}</h2>
                                    <p className="text-xs text-gray-400">Code: {component.code}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`${tc.bg} border ${tc.border} rounded-xl p-4`}>
                                <p className={`text-xs font-semibold ${tc.text} uppercase tracking-wide mb-1`}>Type</p>
                                <p className={`text-base font-bold ${tc.text}`}>{formatTypeLabel(component.type)}</p>
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Value</p>
                                <p className="text-xl font-bold text-indigo-700">{formatCalcValue(component.calc_type, component.calc_value)}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                            <DetailRow icon={<FaTag className="text-blue-500" />} label="Calc Type" value={<span className="capitalize">{component.calc_type}</span>} />
                            <DetailRow
                                icon={<FaBalanceScale className="text-purple-500" />}
                                label="Taxable"
                                value={<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${component.is_taxable ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {component.is_taxable ? 'Taxable' : 'Non-Taxable'}
                                </span>}
                            />
                            <DetailRow
                                icon={<FaBuilding className="text-indigo-500" />}
                                label="Statutory"
                                value={<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${component.is_statutory ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {component.is_statutory ? 'Statutory' : 'Non-Statutory'}
                                </span>}
                            />
                            <DetailRow
                                icon={component.is_active ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-gray-400" />}
                                label="Status"
                                value={<span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${component.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                    {component.is_active ? 'Active' : 'Inactive'}
                                </span>}
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <FaInfoCircle />
                            <span>ID: #{component.id} · Created by user #{component.created_by}</span>
                        </div>
                    </div>

                    <div className="px-6 pb-5 flex gap-2">
                        <button
                            onClick={() => { onEdit(component); onClose(); }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <FaEdit size={12} /> Edit
                        </button>
                        <button
                            onClick={() => { onDelete(component); onClose(); }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-red-50 to-red-100 text-red-600 border border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <FaTrash size={12} /> Delete
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

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

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
        const payload = isEdit
            ? { id: initial.id, ...form, calc_value: Number(form.calc_value), is_taxable: form.is_taxable ? 1 : 0, is_statutory: form.is_statutory ? 1 : 0 }
            : { ...form, calc_value: Number(form.calc_value), is_taxable: form.is_taxable ? 1 : 0, is_statutory: form.is_statutory ? 1 : 0 };
        onSave(payload);
    };

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                    {isEdit ? <FaEdit className="text-white text-sm" /> : <FaPlus className="text-white text-sm" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Component' : 'New Component'}</h2>
                                    <p className="text-xs text-gray-400">{isEdit ? 'Update salary component details' : 'Add a new salary component'}</p>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Code & Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Code *</label>
                                <input
                                    value={form.code}
                                    onChange={e => set('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. HRA"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-blue-200 ${errors.code ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400'}`}
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    placeholder="e.g. House Rent"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-blue-200 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400'}`}
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Component Type *</label>
                            <div className="grid grid-cols-3 gap-2">
                                {COMPONENT_TYPES.map(t => {
                                    const tc = getTypeConfig(t.value);
                                    const active = form.type === t.value;
                                    return (
                                        <button key={t.value} onClick={() => set('type', t.value)}
                                            className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${active ? `bg-gradient-to-r ${tc.gradient} text-white border-transparent shadow-md` : `${tc.bg} ${tc.text} ${tc.border} hover:shadow-sm`}`}>
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calc Type & Value */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">Calculation Type *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CALC_TYPES.map(ct => (
                                        <button key={ct.value} onClick={() => set('calc_type', ct.value)}
                                            className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center justify-center gap-1 ${form.calc_type === ct.value ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'}`}>
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
                                        type="number" min="0"
                                        value={form.calc_value}
                                        onChange={e => set('calc_value', e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-blue-200 ${errors.calc_value ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400'}`}
                                    />
                                </div>
                                {errors.calc_value && <p className="text-xs text-red-500 mt-1">{errors.calc_value}</p>}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'is_taxable', label: 'Taxable', sub: 'Subject to tax', color: 'orange' },
                                { key: 'is_statutory', label: 'Statutory', sub: 'Govt. regulated', color: 'blue' },
                                { key: 'is_active', label: 'Active', sub: 'Currently active', color: 'green' },
                            ].map(toggle => {
                                const colorMap = { orange: 'from-orange-500 to-amber-500', blue: 'from-blue-500 to-indigo-500', green: 'from-green-500 to-emerald-500' };
                                const isOn = form[toggle.key];
                                return (
                                    <button key={toggle.key} onClick={() => set(toggle.key, !isOn)}
                                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${isOn ? `bg-gradient-to-br ${colorMap[toggle.color]} text-white border-transparent shadow-md` : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
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

                    <div className="px-6 pb-5 flex gap-2">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={saving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                            {saving ? <FaSpinner className="animate-spin" size={13} /> : (isEdit ? <FaEdit size={13} /> : <FaPlus size={13} />)}
                            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Component')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ component, onClose, onConfirm, deleting }) => {
    if (!component) return null;
    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaExclamationTriangle className="text-red-500 text-2xl" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Delete Component?</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-gray-800">{component.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm transition-all">Cancel</button>
                            <button onClick={() => onConfirm(component.id)} disabled={deleting}
                                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {deleting ? <FaSpinner className="animate-spin" size={13} /> : <FaTrash size={13} />}
                                {deleting ? 'Deleting...' : 'Delete'}
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
    const [formModal, setFormModal] = useState(null); // null | { mode: 'create'|'edit', data }
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);

    const fetchComponents = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall(
                `/salary/components/list?page=${page}&limit=${pagination.limit}`,
                'GET', null, company?.id
            );
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
            } else throw new Error(result.message || 'Failed to fetch');
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Failed to fetch components');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [pagination.page, pagination.limit, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchComponents(1);
            initialFetchDone.current = true;
        }
    }, [fetchComponents]);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchComponents(pagination.page);
        }
    }, [pagination.page]);

    const handleSave = async (payload) => {
        setSaving(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const isEdit = !!payload.id;
            const response = await apiCall(
                `/salary/components/${isEdit ? 'update' : 'create'}`,
                'POST', payload, company?.id
            );
            const result = await response.json();
            if (result.success) {
                toast.success(isEdit ? 'Component updated!' : 'Component created!');
                setFormModal(null);
                fetchComponents(1);
            } else throw new Error(result.message || 'Save failed');
        } catch (e) {
            toast.error(e.message || 'Failed to save');
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
                toast.success('Component deleted!');
                setDeleteTarget(null);
                fetchComponents(1);
            } else throw new Error(result.message || 'Delete failed');
        } catch (e) {
            toast.error(e.message || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // Summary counts
    const earningCount = components.filter(c => c.type === 'earning').length;
    const deductionCount = components.filter(c => c.type === 'deduction').length;
    const employerCount = components.filter(c => c.type?.startsWith('employer')).length;
    const activeCount = components.filter(c => c.is_active).length;

    return (
        <div className="max-w-7xl m-auto min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Salary Components
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage earnings, deductions & contributions</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setFormModal({ mode: 'create', data: {} })}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                    <FaPlus size={12} /> Add Component
                </motion.button>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <SummaryCard icon={<FaMoneyBillWave />} label="Total" value={pagination.total} color="blue" delay={0.05} />
                <SummaryCard icon={<FaCheckCircle />} label="Earnings" value={earningCount} color="green" delay={0.1} />
                <SummaryCard icon={<FaTimesCircle />} label="Deductions" value={deductionCount} color="red" delay={0.15} />
                <SummaryCard icon={<FaBuilding />} label="Employer" value={employerCount} color="purple" delay={0.2} />
            </div>

            {/* View Toggle + Count */}
            {!loading && components.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-800">{components.length}</span> of <span className="font-semibold text-gray-800">{pagination.total}</span> components
                    </p>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                </div>
            )}

            {/* Loading */}
            {loading && <SkeletonComponent />}

            {/* Empty */}
            {!loading && components.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaMoneyBillWave className="text-4xl text-gray-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-600">No components found</p>
                    <p className="text-gray-400 mt-2 text-sm mb-6">Get started by adding a salary component</p>
                    <button
                        onClick={() => setFormModal({ mode: 'create', data: {} })}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                        <FaPlus className="inline mr-2" size={12} />Add Component
                    </button>
                </motion.div>
            )}

            {/* List View */}
            {!loading && components.length > 0 && viewMode === 'table' && (
                <>
                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-4"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Calc</th>
                                        <th className="px-6 py-4">Value</th>
                                        <th className="px-6 py-4">Flags</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {components.map((comp, index) => {
                                        const tc = getTypeConfig(comp.type);
                                        return (
                                            <motion.tr
                                                key={comp.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedComponent(comp)}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 font-mono">
                                                        {comp.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{comp.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${tc.bg} ${tc.text} ${tc.border}`}>
                                                        {formatTypeLabel(comp.type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 capitalize">{comp.calc_type}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                                                        {formatCalcValue(comp.calc_type, comp.calc_value)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1">
                                                        {comp.is_taxable && (
                                                            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-xs font-medium">Tax</span>
                                                        )}
                                                        {comp.is_statutory && (
                                                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-medium">Stat</span>
                                                        )}
                                                        {!comp.is_taxable && !comp.is_statutory && (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${comp.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {comp.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
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
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                </>
            )}

            {/* Grid View */}
            {!loading && components.length > 0 && viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode}>
                    {components.map((comp, index) => {
                        const tc = getTypeConfig(comp.type);
                        return (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => setSelectedComponent(comp)}
                                className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-12 h-12 bg-gradient-to-br ${tc.gradient} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                                            <FaMoneyBillWave className="text-white text-base" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate text-sm">{comp.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{comp.code}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${comp.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {comp.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border mb-3 ${tc.bg} ${tc.text} ${tc.border}`}>{formatTypeLabel(comp.type)}</span>

                                <div className="text-2xl font-bold text-indigo-600 mb-4">{formatCalcValue(comp.calc_type, comp.calc_value)}</div>

                                <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
                                    <div className="rounded-xl bg-gray-50 p-2.5">
                                        <span className="text-gray-400">Calc Type</span>
                                        <div className="font-semibold text-gray-700 capitalize mt-1">{comp.calc_type}</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-2.5">
                                        <span className="text-gray-400">Taxable</span>
                                        <div className={`font-semibold mt-1 ${comp.is_taxable ? 'text-orange-600' : 'text-gray-400'}`}>{comp.is_taxable ? 'Yes' : 'No'}</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-2.5">
                                        <span className="text-gray-400">Statutory</span>
                                        <div className={`font-semibold mt-1 ${comp.is_statutory ? 'text-blue-600' : 'text-gray-400'}`}>{comp.is_statutory ? 'Yes' : 'No'}</div>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-2.5">
                                        <span className="text-gray-400">Type</span>
                                        <div className="font-semibold text-gray-700 mt-1">{formatTypeLabel(comp.type)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                                    <ActionMenu
                                        menuId={`grid-${comp.id}`}
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

            {/* Detail Modal */}
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

            {/* Form Modal */}
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

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <DeleteModal
                        component={deleteTarget}
                        onClose={() => setDeleteTarget(null)}
                        onConfirm={handleDelete}
                        deleting={deleting}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .active\\:scale-98:active { transform: scale(0.98); }
                @media (min-width: 475px) {
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default SalaryComponents;
