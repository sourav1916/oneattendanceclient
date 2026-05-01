import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaUserCircle, FaSpinner, FaBriefcase, FaCheckCircle,
    FaTimesCircle, FaSearch, FaTimes, FaChartBar,
    FaInfoCircle, FaEnvelope, FaPhone, FaIdCard, FaUserTag,
    FaDollarSign, FaHandPaper, FaTag, FaEye,
    FaTh, FaListUl, FaShieldAlt, FaPlus, FaEdit,
    FaTrash, FaHistory, FaMoneyBillWave, FaPercentage,
    FaCalculator, FaCalendarPlus, FaCalendarCheck,
    FaExchangeAlt, FaSave, FaBan, FaExclamationCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';
import { toast } from 'react-toastify';
import ModalScrollLock from "../components/ModalScrollLock";
import { DatePickerField } from '../components/DatePicker';

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const AVATAR_GRADIENTS = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-500',
];

const avatarGradient = (id) => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

const getInitials = (name = '') =>
    name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (s) => {
    if (!s) return 'Present';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateFull = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
};

const formatDisplay = (str) => str ? str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";

const getStatusBadge = (effectiveTo) => {
    const isActive = !effectiveTo || new Date(effectiveTo) > new Date();
    if (isActive) {
        return { icon: FaCheckCircle, text: "Active", className: "bg-green-100 text-green-800 border border-green-200" };
    }
    return { icon: FaTimesCircle, text: "Expired", className: "bg-gray-100 text-gray-800 border border-gray-200" };
};

const getVisibleSalaryColumns = (width) => ({
    showEmployee: true,
    showBaseAmount: width >= 420,
    showNetSalary: width >= 640,
    showStatus: width >= 768,
    showPackage: width >= 1024,
    showEffectivePeriod: width >= 1280,
});

const formatFilterLabel = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const salaryOverlapsDateFilter = (salary, filter) => {
    if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return true;

    const effectiveFrom = salary.effective_from ? new Date(salary.effective_from) : null;
    const effectiveTo = salary.effective_to ? new Date(salary.effective_to) : null;

    if (filter.date) {
        const selected = new Date(`${filter.date}T00:00:00`);
        const dayEnd = new Date(`${filter.date}T23:59:59.999`);
        const start = effectiveFrom || selected;
        const end = effectiveTo || dayEnd;
        return start <= dayEnd && end >= selected;
    }

    const filterStart = new Date(`${filter.from_date}T00:00:00`);
    const filterEnd = new Date(`${filter.to_date}T23:59:59.999`);
    const start = effectiveFrom || filterStart;
    const end = effectiveTo || filterEnd;
    return start <= filterEnd && end >= filterStart;
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const SalaryBadge = ({ type, value }) => {
    const colors = {
        earning: 'text-green-700 bg-green-50 border-green-200',
        deduction: 'text-red-700 bg-red-50 border-red-200',
        employer_contribution: 'text-purple-700 bg-purple-50 border-purple-200'
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[type] || colors.earning}`}>
            {type === 'earning' ? '+' : type === 'deduction' ? '-' : '↑'}
            {value}
        </span>
    );
};

const ComponentRow = ({ component, currency }) => {
    const typeColors = {
        earning: 'bg-green-50 border-green-100',
        deduction: 'bg-red-50 border-red-100',
        employer_contribution: 'bg-purple-50 border-purple-100'
    };
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${typeColors[component.type] || 'bg-gray-50 border-gray-100'}`}>
            <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{component.name}</p>
                    <span className="text-xs text-gray-400 font-mono">{component.code}</span>
                    {component.is_overridden === 1 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Overridden</span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                    {component.calc_type}: {component.calc_value}{component.calc_type === 'percentage' ? '%' : ''}
                </p>
            </div>
            <div className="text-right">
                <p className="font-bold text-gray-800">{formatCurrency(component.amount, currency)}</p>
                <SalaryBadge type={component.type} value={component.calc_type} />
            </div>
        </div>
    );
};

// ─── Salary Detail Modal ─────────────────────────────────────────────────────

const SalaryDetailModal = ({ salary, onClose }) => {
    if (!salary) return null;

    const status = getStatusBadge(salary.effective_to);
    const StatusIcon = status.icon;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} shadow-lg shadow-slate-200`}>
                                <span className="text-xl font-bold text-white">{getInitials(salary.employee?.name)}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{salary.employee?.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">{salary.employee?.employee_code}</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${status.className}`}>
                                        <StatusIcon size={10} />{status.text}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all border border-transparent hover:border-slate-100">
                            <FaTimes className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="p-6 space-y-6">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Amount</p>
                                    <p className="text-lg font-black text-slate-900">{formatCurrency(salary.base_amount, salary.currency)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Salary</p>
                                    <p className="text-lg font-black text-green-600">{formatCurrency(salary.net_salary, salary.currency)}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gross Salary</p>
                                    <p className="text-lg font-black text-blue-600">{formatCurrency(salary.gross_salary, salary.currency)}</p>
                                </div>
                                <div className="bg-indigo-600 p-4 rounded-2xl border border-indigo-700 shadow-lg shadow-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Total CTC</p>
                                    <p className="text-lg font-black text-white">{formatCurrency(salary.ctc, salary.currency)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Details Table */}
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Configuration Details</p>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {[
                                            { label: 'Salary Package', value: salary.package?.name || 'Custom', icon: <FaBriefcase className="text-indigo-500" /> },
                                            { label: 'Effective From', value: formatDateFull(salary.effective_from), icon: <FaCalendarAlt className="text-blue-500" /> },
                                            { label: 'Effective To', value: formatDateFull(salary.effective_to), icon: <FaCalendarCheck className="text-amber-500" /> },
                                            { label: 'Deductions', value: formatCurrency(salary.total_deductions, salary.currency), icon: <FaChartBar className="text-rose-500" /> },
                                            { label: 'Employer Contribution', value: formatCurrency(salary.employer_contributions, salary.currency), icon: <FaHandPaper className="text-purple-500" /> },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-xs">
                                                        {item.icon}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Components List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Salary Components</p>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{salary.components?.length || 0} Total</span>
                                    </div>
                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                                        {salary.components?.map((comp, idx) => (
                                            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-300">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-8 rounded-full ${comp.type === 'earning' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : comp.type === 'deduction' ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]' : 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]'}`} />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-800 leading-none">{comp.name}</p>
                                                            {comp.is_overridden === 1 && (
                                                                <span className="text-[8px] font-black uppercase tracking-tighter bg-amber-100 text-amber-700 px-1 py-0.5 rounded border border-amber-200">Overridden</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{comp.code} · {comp.calc_type}: {comp.calc_value}{comp.calc_type === 'percentage' ? '%' : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">{formatCurrency(comp.amount, salary.currency)}</p>
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${comp.type === 'earning' ? 'text-green-600' : comp.type === 'deduction' ? 'text-red-600' : 'text-purple-600'}`}>
                                                        {comp.type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                        <button onClick={onClose} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Close Details
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Edit Salary Modal ────────────────────────────────────────────────────────

const EditSalaryModal = ({ isOpen, onClose, onSuccess, salary }) => {
    const [availableComponents, setAvailableComponents] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);

    const [formData, setFormData] = useState({
        base_amount: '',
        currency: 'USD',
        effective_from: '',
        effective_to: '',
        overrides: []
    });

    const [overrideForm, setOverrideForm] = useState({
        component_id: '', calc_type: 'percentage', calc_value: '',
        effective_from: '', effective_to: '', reason: ''
    });

    useEffect(() => {
        if (isOpen && salary) {
            setFormData({
                base_amount: salary.base_amount || '',
                currency: salary.currency || 'USD',
                effective_from: salary.effective_from ? salary.effective_from.split('T')[0] : '',
                effective_to: salary.effective_to ? salary.effective_to.split('T')[0] : '',
                overrides: (salary.components || [])
                    .filter(c => c.is_overridden === 1)
                    .map(c => ({
                        component_id: c.id,
                        calc_type: c.calc_type,
                        calc_value: c.calc_value,
                        effective_from: salary.effective_from ? salary.effective_from.split('T')[0] : '',
                        effective_to: salary.effective_to ? salary.effective_to.split('T')[0] : '',
                        reason: c.reason || ''
                    }))
            });
            loadComponents();
            loadCurrencies();
        }
    }, [isOpen, salary]);

    const loadComponents = async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/list', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) setAvailableComponents(result.data || []);
        } catch (e) { console.error(e); }
    };

    const loadCurrencies = async () => {
        try {
            const response = await apiCall('/constants/?type=currency', 'GET');
            const result = await response.json();
            if (result.success && result.data?.currency_types) setCurrencies(result.data.currency_types);
        } catch (e) { console.error(e); }
    };

    const addOverride = () => {
        if (!overrideForm.component_id || !overrideForm.calc_value) {
            toast.warning('Please fill component and value'); return;
        }
        const newOverride = {
            component_id: parseInt(overrideForm.component_id),
            calc_type: overrideForm.calc_type,
            calc_value: parseFloat(overrideForm.calc_value),
            effective_from: overrideForm.effective_from || formData.effective_from,
            effective_to: overrideForm.effective_to || null,
            reason: overrideForm.reason || ''
        };
        if (editingOverride !== null) {
            const updated = [...formData.overrides];
            updated[editingOverride] = newOverride;
            setFormData({ ...formData, overrides: updated });
            setEditingOverride(null);
        } else {
            setFormData({ ...formData, overrides: [...formData.overrides, newOverride] });
        }
        setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' });
        setShowOverrideForm(false);
    };

    const editOverride = (index) => {
        const o = formData.overrides[index];
        setOverrideForm({
            component_id: o.component_id, calc_type: o.calc_type, calc_value: o.calc_value,
            effective_from: o.effective_from || '', effective_to: o.effective_to || '', reason: o.reason || ''
        });
        setEditingOverride(index);
        setShowOverrideForm(true);
    };

    const removeOverride = (index) => {
        setFormData({ ...formData, overrides: formData.overrides.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.base_amount || !formData.effective_from) {
            toast.warning('Please fill required fields');
            return;
        }
        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
                salary_id: salary.salary_id,
                employee_id: salary.employee?.id,
                component_package_id: salary.package?.id,
                base_amount: parseFloat(formData.base_amount),
                currency: formData.currency.toLowerCase(),
                effective_from: formData.effective_from,
                effective_to: formData.effective_to || null,
                overrides: formData.overrides.map(o => ({ ...o, effective_to: o.effective_to || null }))
            };
            const response = await apiCall('/salary/update-salary', 'PUT', payload, company?.id);
            const result = await response.json();
            if (result.success) { toast.success('Salary updated successfully!'); onSuccess(); onClose(); }
            else { toast.error(result.message || 'Failed to update salary'); }
        } catch (e) { console.error(e); toast.error('Failed to update salary'); } finally { setSubmitting(false); }
    };

    if (!isOpen || !salary) return null;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden m-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                                <FaEdit className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Edit Salary</h2>
                                <p className="text-sm text-slate-500">{salary.employee?.name} · {salary.employee?.employee_code}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-5">
                            {/* Base Amount */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Amount *</label>
                                <div className="flex gap-2">
                                    <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold">
                                        {currencies.length > 0 ? currencies.map(c => <option key={c.key} value={c.key}>{c.value.symbol} {c.key}</option>) : <option value="USD">$ USD</option>}
                                    </select>
                                    <input type="text" inputMode="decimal" placeholder="Enter amount" value={formData.base_amount}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) { setFormData({ ...formData, base_amount: val }); }
                                        }}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-semibold" />
                                </div>
                            </div>

                            {/* Package Visualization (Read-only in Edit) */}
                            {salary.package && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salary Package: {salary.package.name}</label>
                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase">Locked</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-white p-2.5 rounded-lg border border-slate-100">
                                        <FaInfoCircle className="text-slate-400" /> Package cannot be changed during Edit. Use "Revise Package" for a new structure.
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective From *</label>
                                    <DatePickerField value={formData.effective_from} onChange={(value) => setFormData({ ...formData, effective_from: value })} placeholder="Select date" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective To</label>
                                    <DatePickerField value={formData.effective_to} onChange={(value) => setFormData({ ...formData, effective_to: value })} placeholder="Optional" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FaCalculator className="text-blue-500" /> Component Overrides
                                    </label>
                                    <button type="button"
                                        onClick={() => { setEditingOverride(null); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: formData.effective_from, effective_to: '', reason: '' }); setShowOverrideForm(true); }}
                                        className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold border border-blue-200 shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                                        <FaPlus size={8} /> Add Override
                                    </button>
                                </div>

                                {formData.overrides.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {formData.overrides.map((override, idx) => {
                                            const component = availableComponents.find(c => c.id === override.component_id);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-100/50">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-slate-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${override.calc_type === 'percentage' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                                                                {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                            </span>
                                                        </div>
                                                        {override.reason && <p className="text-[11px] text-slate-400 mt-1 italic">"{override.reason}"</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => editOverride(idx)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><FaEdit size={12} /></button>
                                                        <button type="button" onClick={() => removeOverride(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTimes size={12} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {showOverrideForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-4 bg-white rounded-xl border-2 border-blue-100 shadow-xl shadow-blue-100/50">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                            <p className="text-sm font-bold text-blue-900 flex items-center gap-2 uppercase tracking-widest">{editingOverride !== null ? 'Edit Override' : 'New Override'}</p>
                                            <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Component *</label>
                                                <select value={overrideForm.component_id} onChange={e => {
                                                    const compId = e.target.value;
                                                    const comp = availableComponents.find(c => String(c.id) === String(compId));
                                                    setOverrideForm(prev => ({
                                                        ...prev,
                                                        component_id: compId,
                                                        calc_type: comp ? comp.calc_type : prev.calc_type,
                                                        calc_value: comp ? String(comp.calc_value) : prev.calc_value,
                                                    }));
                                                }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                                                    <option value="">Select component</option>
                                                    {availableComponents.map(comp => (
                                                        <option key={comp.id} value={comp.id}>{comp.name} ({comp.code})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Calc Type</label>
                                                    <select value={overrideForm.calc_type} onChange={e => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all">
                                                        <option value="percentage">Percentage (%)</option>
                                                        <option value="fixed">Fixed Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Value *</label>
                                                    <input type="text" inputMode="decimal" placeholder="Value" value={overrideForm.calc_value}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                                            if (val === '' || /^\d*\.?\d*$/.test(val)) { setOverrideForm({ ...overrideForm, calc_value: val }); }
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason</label>
                                                <input type="text" placeholder="Reason" value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={addOverride} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200">
                                                    {editingOverride !== null ? 'Update' : 'Add Override'}
                                                </button>
                                                <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Cancel</button>
                        <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Revise Salary Modal ──────────────────────────────────────────────────────

const ReviseSalaryModal = ({ isOpen, onClose, onSuccess, salary }) => {
    const [packages, setPackages] = useState([]);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);

    const [formData, setFormData] = useState({ component_package_id: '', base_amount: '', currency: 'USD', effective_from: '', effective_to: '', overrides: [] });
    const [overrideForm, setOverrideForm] = useState({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' });

    // Derived: Selected package details
    const selectedPackage = useMemo(() =>
        packages.find(p => String(p.id) === String(formData.component_package_id)),
        [packages, formData.component_package_id]
    );

    // Derived: Components in selected package
    const packageComponentIds = useMemo(() =>
        selectedPackage?.items?.map(item => item.component_id) || [],
        [selectedPackage]
    );

    // Filtered components for override dropdown
    const filteredAvailableComponents = useMemo(() =>
        availableComponents.filter(comp => !packageComponentIds.includes(comp.id)),
        [availableComponents, packageComponentIds]
    );

    useEffect(() => {
        if (isOpen && salary) {
            setFormData({ component_package_id: salary.package?.id || '', base_amount: salary.base_amount || '', currency: salary.currency || 'USD', effective_from: '', effective_to: '', overrides: [] });
            loadPackages(); loadComponents(); loadCurrencies();
        }
    }, [isOpen, salary]);

    const handlePackageChange = (packageId) => {
        const pkg = packages.find(p => String(p.id) === String(packageId));
        const pkgCompIds = pkg?.items?.map(item => item.component_id) || [];

        setFormData(prev => ({
            ...prev,
            component_package_id: packageId,
            // Remove overrides that now conflict with the new package
            overrides: prev.overrides.filter(o => !pkgCompIds.includes(o.component_id))
        }));
    };

    const loadPackages = async () => {
        setLoadingPackages(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/packages', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) setPackages(result.data || []);
        } catch (e) { console.error(e); } finally { setLoadingPackages(false); }
    };
    const loadComponents = async () => { try { const company = JSON.parse(localStorage.getItem('company')); const response = await apiCall('/salary/components/list', 'GET', null, company?.id); const result = await response.json(); if (result.success) setAvailableComponents(result.data || []); } catch (e) { console.error(e); } };
    const loadCurrencies = async () => { try { const response = await apiCall('/constants/?type=currency', 'GET'); const result = await response.json(); if (result.success && result.data?.currency_types) setCurrencies(result.data.currency_types); } catch (e) { console.error(e); } };

    const addOverride = () => {
        if (!overrideForm.component_id || !overrideForm.calc_value) { toast.warning('Please fill component and value'); return; }
        const newOverride = { component_id: parseInt(overrideForm.component_id), calc_type: overrideForm.calc_type, calc_value: parseFloat(overrideForm.calc_value), effective_from: overrideForm.effective_from || formData.effective_from, effective_to: overrideForm.effective_to || null, reason: overrideForm.reason || '' };
        if (editingOverride !== null) { const updated = [...formData.overrides]; updated[editingOverride] = newOverride; setFormData({ ...formData, overrides: updated }); setEditingOverride(null); }
        else { setFormData({ ...formData, overrides: [...formData.overrides, newOverride] }); }
        setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' });
        setShowOverrideForm(false);
    };

    const editOverride = (index) => { const o = formData.overrides[index]; setOverrideForm({ component_id: o.component_id, calc_type: o.calc_type, calc_value: o.calc_value, effective_from: o.effective_from || '', effective_to: o.effective_to || '', reason: o.reason || '' }); setEditingOverride(index); setShowOverrideForm(true); };
    const removeOverride = (index) => { setFormData({ ...formData, overrides: formData.overrides.filter((_, i) => i !== index) }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.base_amount || !formData.effective_from || !formData.component_package_id) {
            toast.warning('Please fill required fields');
            return;
        }
        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
                salary_id: salary.salary_id,
                employee_id: salary.employee?.id,
                component_package_id: parseInt(formData.component_package_id),
                base_amount: parseFloat(formData.base_amount),
                currency: formData.currency.toLowerCase(),
                effective_from: formData.effective_from,
                effective_to: formData.effective_to || null,
                overrides: formData.overrides.map(o => ({ ...o, effective_to: o.effective_to || null }))
            };
            const response = await apiCall('/salary/revise-salary', 'POST', payload, company?.id);
            const result = await response.json();
            if (result.success) { toast.success('Salary structure revised successfully!'); onSuccess(); onClose(); }
            else { toast.error(result.message || 'Failed to revise salary'); }
        } catch (error) { console.error(error); toast.error('Failed to revise salary'); }
        finally { setSubmitting(false); }
    };

    if (!isOpen || !salary) return null;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl border border-slate-200 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                                <FaLayerGroup className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Revise Salary Structure</h2>
                                <p className="text-sm text-slate-500">{salary.employee?.name} · {salary.employee?.employee_code}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Salary Package */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Salary Package *</label>
                                    <select value={formData.component_package_id} onChange={(e) => handlePackageChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm">
                                        {loadingPackages ? <option value="">Loading packages...</option>
                                            : packages.length === 0 ? <option value="">No packages found</option>
                                                : packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.code})</option>)}
                                    </select>
                                </div>

                                {/* Base Amount */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Amount *</label>
                                    <div className="flex gap-2">
                                        <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold">
                                            {currencies.length > 0 ? currencies.map(c => <option key={c.key} value={c.key}>{c.value.symbol} {c.key}</option>) : <option value="USD">$ USD</option>}
                                        </select>
                                        <input type="text" inputMode="decimal" placeholder="Enter amount" value={formData.base_amount}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) { setFormData({ ...formData, base_amount: val }); }
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold" />
                                    </div>
                                </div>
                            </div>

                            {/* Package Preview Visualization */}
                            <AnimatePresence>
                                {selectedPackage && selectedPackage.items?.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Package Preview: {selectedPackage.name}</label>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">{selectedPackage.items.length} Components</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedPackage.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-1.5 h-6 rounded-full ${item.type === 'earning' ? 'bg-green-400' : item.type === 'deduction' ? 'bg-red-400' : 'bg-purple-400'}`} />
                                                        <div className="truncate">
                                                            <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">{item.code}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[11px] font-bold text-indigo-600">
                                                            {item.calc_type === 'percentage' ? `${item.calc_value}%` : `${item.calc_value}`}
                                                        </p>
                                                        <p className="text-[8px] text-slate-400 uppercase font-bold">{item.calc_type}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective From *</label>
                                    <DatePickerField value={formData.effective_from} onChange={(value) => setFormData({ ...formData, effective_from: value })} placeholder="Select date" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective To</label>
                                    <DatePickerField value={formData.effective_to} onChange={(value) => setFormData({ ...formData, effective_to: value })} placeholder="Optional" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FaCalculator className="text-indigo-500" /> Component Overrides
                                    </label>
                                    <button type="button"
                                        onClick={() => { setEditingOverride(null); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: formData.effective_from, effective_to: '', reason: '' }); setShowOverrideForm(true); }}
                                        className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-bold border border-indigo-200 shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                                        <FaPlus size={8} /> Add Override
                                    </button>
                                </div>

                                {formData.overrides.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {formData.overrides.map((override, idx) => {
                                            const component = availableComponents.find(c => c.id === override.component_id);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-100/50">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-slate-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${override.calc_type === 'percentage' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                                {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                            </span>
                                                        </div>
                                                        {override.reason && <p className="text-[11px] text-slate-400 mt-1 italic">"{override.reason}"</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => editOverride(idx)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"><FaEdit size={12} /></button>
                                                        <button type="button" onClick={() => removeOverride(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTimes size={12} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {showOverrideForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-4 bg-white rounded-xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/50">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                            <p className="text-sm font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-widest">{editingOverride !== null ? 'Edit Override' : 'New Override'}</p>
                                            <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Component *</label>
                                                <select value={overrideForm.component_id} onChange={e => {
                                                    const compId = e.target.value;
                                                    const comp = filteredAvailableComponents.find(c => String(c.id) === String(compId));
                                                    setOverrideForm(prev => ({
                                                        ...prev,
                                                        component_id: compId,
                                                        calc_type: comp ? comp.calc_type : prev.calc_type,
                                                        calc_value: comp ? String(comp.calc_value) : prev.calc_value,
                                                    }));
                                                }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                                    <option value="">Select component</option>
                                                    {filteredAvailableComponents.map(comp => (
                                                        <option key={comp.id} value={comp.id}>{comp.name} ({comp.code})</option>
                                                    ))}
                                                </select>
                                                {filteredAvailableComponents.length === 0 && availableComponents.length > 0 && (
                                                    <p className="text-[10px] text-amber-600 mt-1 italic flex items-center gap-1">
                                                        <FaInfoCircle size={10} /> All available components are already in the selected package.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Calc Type</label>
                                                    <select value={overrideForm.calc_type} onChange={e => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                                        <option value="percentage">Percentage (%)</option>
                                                        <option value="fixed">Fixed Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Value *</label>
                                                    <input type="text" inputMode="decimal" placeholder="Value" value={overrideForm.calc_value}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                                            if (val === '' || /^\d*\.?\d*$/.test(val)) { setOverrideForm({ ...overrideForm, calc_value: val }); }
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason</label>
                                                <input type="text" placeholder="Reason" value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={addOverride} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200">
                                                    {editingOverride !== null ? 'Update' : 'Add Override'}
                                                </button>
                                                <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Cancel</button>
                        <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                            {submitting ? <FaSpinner className="animate-spin" /> : <FaHistory />}
                            {submitting ? 'Revising...' : 'Revise Structure'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Assign Salary Modal ──────────────────────────────────────────────────────

const AssignSalaryModal = ({ isOpen, onClose, onSuccess, submitDisabled, submitTitle }) => {
    const [employees, setEmployees] = useState([]);
    const [packages, setPackages] = useState([]);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPackages, setLoadingPackages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);
    const [formData, setFormData] = useState({ component_package_id: '', base_amount: '', currency: 'USD', effective_from: '', effective_to: '', overrides: [] });
    const [overrideForm, setOverrideForm] = useState({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' });

    // Derived: Selected package details
    const selectedPackage = useMemo(() =>
        packages.find(p => String(p.id) === String(formData.component_package_id)),
        [packages, formData.component_package_id]
    );

    // Derived: Components in selected package (to filter overrides)
    const packageComponentIds = useMemo(() =>
        selectedPackage?.items?.map(item => item.component_id) || [],
        [selectedPackage]
    );

    // Filtered components for the override dropdown
    const filteredAvailableComponents = useMemo(() =>
        availableComponents.filter(comp => !packageComponentIds.includes(comp.id)),
        [availableComponents, packageComponentIds]
    );

    useEffect(() => {
        if (isOpen) { loadEmployeesWithoutSalary(); loadSalaryPackages(); loadSalaryComponents(); loadCurrencies(); }
    }, [isOpen]);

    // Handle package change and clean up conflicting overrides
    const handlePackageChange = (packageId) => {
        const pkg = packages.find(p => String(p.id) === String(packageId));
        const pkgCompIds = pkg?.items?.map(item => item.component_id) || [];

        setFormData(prev => ({
            ...prev,
            component_package_id: packageId,
            // Remove overrides that are now in the package
            overrides: prev.overrides.filter(o => !pkgCompIds.includes(o.component_id))
        }));
    };

    const loadEmployeesWithoutSalary = async () => { setLoading(true); try { const company = JSON.parse(localStorage.getItem('company')); const response = await apiCall('/salary/employees-without-salary', 'GET', null, company?.id); const result = await response.json(); if (result.success) setEmployees(result.data || []); } catch (error) { console.error('Failed to load employees:', error); } finally { setLoading(false); } };
    const loadSalaryPackages = async () => {
        setLoadingPackages(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/packages', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setPackages(result.data || []);
                if (result.data?.length > 0 && !formData.component_package_id) {
                    setFormData(prev => ({ ...prev, component_package_id: result.data[0].id }));
                }
            }
        } catch (error) { console.error('Failed to load packages:', error); } finally { setLoadingPackages(false); }
    };
    const loadSalaryComponents = async () => { try { const company = JSON.parse(localStorage.getItem('company')); const response = await apiCall('/salary/components/list', 'GET', null, company?.id); const result = await response.json(); if (result.success) setAvailableComponents(result.data || []); } catch (error) { console.error('Failed to load salary components:', error); } };
    const loadCurrencies = async () => { try { const response = await apiCall('/constants/?type=currency', 'GET'); const result = await response.json(); if (result.success && result.data?.currency_types) { setCurrencies(result.data.currency_types); const keys = result.data.currency_types.map(c => c.key); setFormData(prev => ({ ...prev, currency: keys.includes(prev.currency) ? prev.currency : (keys[0] || 'USD') })); } } catch (error) { console.error('Failed to load currencies:', error); } };

    const filteredEmployees = employees.filter(emp => emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    const addOverride = () => {
        if (!overrideForm.component_id || !overrideForm.calc_value) { toast.warning('Please fill component and value'); return; }
        const newOverride = { component_id: parseInt(overrideForm.component_id), calc_type: overrideForm.calc_type, calc_value: parseFloat(overrideForm.calc_value), effective_from: overrideForm.effective_from || formData.effective_from, effective_to: overrideForm.effective_to || null, reason: overrideForm.reason || '' };
        if (editingOverride !== null) { const updated = [...formData.overrides]; updated[editingOverride] = newOverride; setFormData({ ...formData, overrides: updated }); setEditingOverride(null); }
        else { setFormData({ ...formData, overrides: [...formData.overrides, newOverride] }); }
        setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' });
        setShowOverrideForm(false);
    };

    const editOverride = (index) => { const o = formData.overrides[index]; setOverrideForm({ component_id: o.component_id, calc_type: o.calc_type, calc_value: o.calc_value, effective_from: o.effective_from || '', effective_to: o.effective_to || '', reason: o.reason || '' }); setEditingOverride(index); setShowOverrideForm(true); };
    const removeOverride = (index) => { setFormData({ ...formData, overrides: formData.overrides.filter((_, i) => i !== index) }); };

    const resetForm = () => { setSelectedEmployee(null); setSearchTerm(''); setFormData({ component_package_id: packages[0]?.id || '', base_amount: '', currency: 'USD', effective_from: '', effective_to: '', overrides: [] }); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: '', effective_to: '', reason: '' }); setShowOverrideForm(false); setEditingOverride(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitDisabled) return;
        if (!selectedEmployee) { toast.warning('Please select an employee'); return; }
        if (!formData.base_amount || !formData.effective_from || !formData.component_package_id) { toast.warning('Please fill all required fields'); return; }
        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
                employee_id: selectedEmployee.employee_id,
                component_package_id: parseInt(formData.component_package_id),
                base_amount: parseFloat(formData.base_amount),
                currency: formData.currency.toLowerCase(),
                effective_from: formData.effective_from,
                effective_to: formData.effective_to || null,
                overrides: formData.overrides.map(o => ({ ...o, effective_to: o.effective_to || null }))
            };
            const response = await apiCall('/salary/assign-salary', 'POST', payload, company?.id);
            const result = await response.json();
            if (result.success) { toast.success('Salary assigned successfully!'); onSuccess(); onClose(); resetForm(); }
            else { toast.error(result.message || 'Failed to assign salary'); }
        } catch (error) { console.error('Error assigning salary:', error); toast.error('Failed to assign salary'); }
        finally { setSubmitting(false); }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-4xl max-h-[80vh] rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden m-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200">
                                <FaPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Assign Salary</h2>
                                <p className="text-sm text-slate-500">Configure salary profile for employee</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-5">
                            {/* Employee Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Employee *</label>
                                <div className="relative">
                                    <input type="text" placeholder="Search employee by name, code or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm" disabled={!!selectedEmployee} />
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                </div>
                                {!selectedEmployee && searchTerm && (
                                    <div className="mt-2 max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white shadow-lg z-20">
                                        {loading ? (<div className="p-4 text-center text-slate-400 text-sm"><FaSpinner className="animate-spin inline mr-2" />Loading...</div>)
                                            : filteredEmployees.length === 0 ? (<div className="p-4 text-center text-slate-400 text-sm">No employees found</div>)
                                                : filteredEmployees.map(emp => (
                                                    <button key={emp.employee_id} type="button" onClick={() => setSelectedEmployee(emp)} className="w-full p-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0`}><span className="text-white font-bold text-xs">{getInitials(emp.name)}</span></div>
                                                        <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm">{emp.name}</p><p className="text-[11px] text-slate-400">{emp.employee_code} • {emp.email}</p></div>
                                                    </button>
                                                ))}
                                    </div>
                                )}
                                {selectedEmployee && (
                                    <div className="mt-2 p-3 bg-green-50/50 border border-green-100 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarGradient(selectedEmployee.employee_id)} flex items-center justify-center shadow-sm`}><span className="text-white font-bold text-xs">{getInitials(selectedEmployee.name)}</span></div>
                                            <div><p className="font-bold text-slate-800 text-sm">{selectedEmployee.name}</p><p className="text-[11px] text-slate-500">{selectedEmployee.employee_code}</p></div>
                                        </div>
                                        <button type="button" onClick={() => setSelectedEmployee(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={12} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Salary Package */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Salary Package *</label>
                                    <select value={formData.component_package_id} onChange={(e) => handlePackageChange(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm">
                                        {loadingPackages ? <option value="">Loading packages...</option>
                                            : packages.length === 0 ? <option value="">No packages found</option>
                                                : packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.code})</option>)}
                                    </select>
                                </div>

                                {/* Base Amount */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Amount *</label>
                                    <div className="flex gap-2">
                                        <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-semibold">
                                            {currencies.length > 0 ? currencies.map(c => <option key={c.key} value={c.key}>{c.value.symbol} {c.key}</option>) : <option value="USD">$ USD</option>}
                                        </select>
                                        <input type="text" inputMode="decimal" placeholder="Enter amount" value={formData.base_amount}
                                            onChange={e => {
                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) { setFormData({ ...formData, base_amount: val }); }
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-semibold" />
                                    </div>
                                </div>
                            </div>

                            {/* Package Preview Visualization */}
                            <AnimatePresence>
                                {selectedPackage && selectedPackage.items?.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Package Preview: {selectedPackage.name}</label>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">{selectedPackage.items.length} Components</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedPackage.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-1.5 h-6 rounded-full ${item.type === 'earning' ? 'bg-green-400' : item.type === 'deduction' ? 'bg-red-400' : 'bg-purple-400'}`} />
                                                        <div className="truncate">
                                                            <p className="text-[11px] font-bold text-slate-700 leading-tight">{item.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">{item.code}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[11px] font-bold text-indigo-600">
                                                            {item.calc_type === 'percentage' ? `${item.calc_value}%` : `${item.calc_value}`}
                                                        </p>
                                                        <p className="text-[8px] text-slate-400 uppercase font-bold">{item.calc_type}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective From *</label>
                                    <DatePickerField value={formData.effective_from} onChange={(value) => setFormData({ ...formData, effective_from: value })} placeholder="Select date" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Effective To</label>
                                    <DatePickerField value={formData.effective_to} onChange={(value) => setFormData({ ...formData, effective_to: value })} placeholder="Optional" mode="single" buttonClassName="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none text-left text-sm" popoverClassName="mt-2" />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <FaCalculator className="text-indigo-500" /> Component Overrides
                                    </label>
                                    <button type="button"
                                        onClick={() => { setEditingOverride(null); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: formData.effective_from, effective_to: '', reason: '' }); setShowOverrideForm(true); }}
                                        className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-bold border border-indigo-200 shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                                        <FaPlus size={8} /> Add Override
                                    </button>
                                </div>

                                {formData.overrides.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {formData.overrides.map((override, idx) => {
                                            const component = availableComponents.find(c => c.id === override.component_id);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-100/50">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-slate-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider ${override.calc_type === 'percentage' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                                {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                            </span>
                                                        </div>
                                                        {override.reason && <p className="text-[11px] text-slate-400 mt-1 italic">"{override.reason}"</p>}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => editOverride(idx)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"><FaEdit size={12} /></button>
                                                        <button type="button" onClick={() => removeOverride(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FaTimes size={12} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {showOverrideForm && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-4 bg-white rounded-xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/50">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                            <p className="text-sm font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-widest">{editingOverride !== null ? 'Edit Override' : 'New Override'}</p>
                                            <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Component *</label>
                                                <select value={overrideForm.component_id} onChange={e => {
                                                    const compId = e.target.value;
                                                    const comp = filteredAvailableComponents.find(c => String(c.id) === String(compId));
                                                    setOverrideForm(prev => ({
                                                        ...prev,
                                                        component_id: compId,
                                                        calc_type: comp ? comp.calc_type : prev.calc_type,
                                                        calc_value: comp ? String(comp.calc_value) : prev.calc_value,
                                                    }));
                                                }}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                                    <option value="">Select component</option>
                                                    {filteredAvailableComponents.map(comp => (
                                                        <option key={comp.id} value={comp.id}>{comp.name} ({comp.code})</option>
                                                    ))}
                                                </select>
                                                {filteredAvailableComponents.length === 0 && availableComponents.length > 0 && (
                                                    <p className="text-[10px] text-amber-600 mt-1 italic flex items-center gap-1">
                                                        <FaInfoCircle size={10} /> All available components are already in the selected package.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Calc Type</label>
                                                    <select value={overrideForm.calc_type} onChange={e => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all">
                                                        <option value="percentage">Percentage (%)</option>
                                                        <option value="fixed">Fixed Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Value *</label>
                                                    <input type="text" inputMode="decimal" placeholder={overrideForm.calc_type === 'percentage' ? '30%' : '5000'}
                                                        value={overrideForm.calc_value}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                                            if (val === '' || /^\d*\.?\d*$/.test(val)) { setOverrideForm({ ...overrideForm, calc_value: val }); }
                                                        }}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason</label>
                                                <input type="text" placeholder="e.g., Performance Bonus" value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button type="button" onClick={addOverride} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200">
                                                    {editingOverride !== null ? 'Update' : 'Add Override'}
                                                </button>
                                                <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Cancel</button>
                        <button onClick={handleSubmit} disabled={submitting || submitDisabled} title={submitDisabled ? submitTitle : ""} className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                            {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {submitting ? 'Assigning...' : 'Assign Salary'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, salary, processingId }) => {
    if (!isOpen || !salary) return null;
    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm border border-red-100">
                                <FaTrash className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Delete Salary Record</h2>
                                <p className="text-sm text-slate-500 font-medium">Confirmation required</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-8 text-center space-y-6">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-gradient-to-br from-red-50 to-rose-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-red-100/50">
                            <FaExclamationCircle className="text-4xl text-red-500" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                                You are about to permanently delete the salary record for <span className="font-bold text-slate-900 underline decoration-red-200 underline-offset-4">{salary.employee?.name}</span>. This action cannot be undone and will affect historical payroll data.
                            </p>
                        </div>

                        {/* Summary of record to be deleted */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Amount</p>
                                <p className="text-sm font-bold text-slate-800">{formatCurrency(salary.base_amount, salary.currency)}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Effective From</p>
                                <p className="text-sm font-bold text-slate-800">{formatDate(salary.effective_from)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Keep Record
                        </button>
                        <button onClick={onConfirm} disabled={processingId === salary.salary_id} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                            {processingId === salary.salary_id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                            {processingId === salary.salary_id ? 'Deleting...' : 'Delete Permanently'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Salary Card (Grid) ───────────────────────────────────────────────────────

const SalaryCard = ({ salary, index, onClick, onDelete, activeId, onToggle, onEdit, onRevise }) => {
    const status = getStatusBadge(salary.effective_to);
    const StatusIcon = status.icon;

    const actions = [
        { label: 'View Details', icon: <FaEye size={13} />, onClick: () => onClick(salary), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
        { label: 'Edit Salary', icon: <FaEdit size={13} />, onClick: () => onEdit(salary), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' },
        { label: 'Revise Salary', icon: <FaExchangeAlt size={13} />, onClick: () => onRevise(salary), className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' },
        { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => onDelete(salary), className: 'text-red-600 hover:text-red-700 hover:bg-red-50' }
    ];

    return (
        <ManagementCard
            key={salary.salary_id}
            accent="green"
            delay={index * 0.05}
            onClick={() => onClick(salary)}
            activeId={activeId}
            onToggle={onToggle}
            menuId={`card-${salary.salary_id}`}
            actions={actions}
            hoverable
            title={salary.employee?.name || 'No name'}
            subtitle={`${salary.employee?.employee_code || 'N/A'} • ${salary.employee?.email || 'N/A'}`}
            eyebrow={salary.package?.name || 'Salary package'}
            badge={
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                    <StatusIcon size={10} />{status.text}
                </span>
            }
            footer={
                <div className="flex w-full items-center justify-between gap-3 text-xs text-gray-400">
                    <span>{formatCurrency(salary.ctc, salary.currency)} CTC</span>
                    <span>{salary.components?.length || 0} components</span>
                </div>
            }
        >
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                        <p className="text-sm font-bold text-blue-700">{formatCurrency(salary.base_amount, salary.currency)}</p>
                        <p className="text-xs text-blue-500">Base</p>
                    </div>
                    <div className="rounded-xl border border-purple-100 bg-purple-50 p-3 text-center">
                        <p className="text-sm font-bold text-purple-700">{formatCurrency(salary.net_salary, salary.currency)}</p>
                        <p className="text-xs text-purple-500">Net</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><FaCalendarPlus size={9} />{formatDate(salary.effective_from)}</span>
                    <span className="flex items-center gap-1"><FaCalendarCheck size={9} />{formatDate(salary.effective_to)}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                    {salary.components?.slice(0, 2).map((comp, idx) => (<SalaryBadge key={idx} type={comp.type} value={comp.code} />))}
                    {(salary.components?.length || 0) > 2 && (<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">+{salary.components.length - 2} more</span>)}
                </div>
            </div>
        </ManagementCard>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalaryManagement = () => {
    const [salaries, setSalaries] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showHistory, setShowHistory] = useState(false);
    const [dateFilterLabel, setDateFilterLabel] = useState('Filter by date');
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [salaryToDelete, setSalaryToDelete] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState(() => ({ ...getVisibleSalaryColumns(window.innerWidth - (window.innerWidth >= 768 ? 80 : 0)) }));
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [salaryToEdit, setSalaryToEdit] = useState(null);
    const [salaryToRevise, setSalaryToRevise] = useState(null);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const salaryDateFilterRef = useRef({});

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() => {
                const width = window.innerWidth;
                const offset = width >= 1024 ? 280 : (width >= 768 ? 80 : 0);
                setVisibleColumns(getVisibleSalaryColumns(width - offset));
            }, 150);
        };
        window.addEventListener("resize", onResize);
        return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
    }, []);

    const fetchSalaries = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true, dateParams = salaryDateFilterRef.current) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const queryParams = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
            if (showHistory) queryParams.append('history', 'true');
            if (search) queryParams.append('search', search);
            Object.entries(dateParams || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && String(value).trim() !== '') queryParams.append(key, String(value)); });
            const url = `/salary/employees-salaries?${queryParams.toString()}`;
            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setSalaries(result.data || []);
                setMeta(result);
                const total = Number(result.pagination?.total ?? result.meta?.total ?? result.total ?? result.data?.length ?? 0);
                const pageCount = Number(result.pagination?.total_pages ?? result.meta?.total_pages ?? Math.max(1, Math.ceil(total / pagination.limit)));
                const currentPage = Number(result.pagination?.page ?? result.meta?.page ?? result.page ?? page);
                const perPage = Number(result.pagination?.limit ?? result.meta?.limit ?? result.limit ?? pagination.limit);
                updatePagination({ page: currentPage, limit: perPage, total, total_pages: pageCount, is_last_page: result.pagination?.is_last_page ?? result.meta?.is_last_page ?? (currentPage >= pageCount) });
            } else { throw new Error(result.message || "Failed to fetch salaries"); }
        } catch (e) { toast.error(e.message || "Failed to load salary records."); console.error(e); }
        finally { setLoading(false); fetchInProgress.current = false; setIsInitialLoad(false); }
    }, [pagination.page, pagination.limit, debouncedSearch, showHistory, updatePagination]);

    const handlePageChange = useCallback((newPage) => { if (newPage !== pagination.page) goToPage(newPage); }, [pagination.page, goToPage]);

    const handleDateFilterApply = useCallback((result) => {
        let nextParams = {};
        let nextLabel = 'Filter by date';
        if (typeof result === 'string' && result) { nextParams = { date: result }; nextLabel = formatFilterLabel(result); }
        else if (result?.start && result?.end) { nextParams = { from_date: result.start, to_date: result.end }; nextLabel = result.start === result.end ? formatFilterLabel(result.start) : `${formatFilterLabel(result.start)} - ${formatFilterLabel(result.end)}`; }
        salaryDateFilterRef.current = nextParams;
        setDateFilterLabel(nextLabel);
        if (pagination.page !== 1) goToPage(1);
        else fetchSalaries(1, debouncedSearch, true, nextParams);
    }, [debouncedSearch, fetchSalaries, goToPage, pagination.page]);

    const clearDateFilter = useCallback(() => {
        salaryDateFilterRef.current = {};
        setDateFilterLabel('Filter by date');
        if (pagination.page !== 1) goToPage(1);
        else fetchSalaries(1, debouncedSearch, true, {});
    }, [debouncedSearch, fetchSalaries, goToPage, pagination.page]);

    const visibleSalaries = useMemo(() => {
        const filter = salaryDateFilterRef.current;
        if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return salaries;
        return salaries.filter((salary) => salaryOverlapsDateFilter(salary, filter));
    }, [salaries, dateFilterLabel]);

    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchSalaries(1, debouncedSearch, true);
        }
    }, [debouncedSearch, showHistory]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) fetchSalaries(pagination.page, debouncedSearch, true);
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('company'));
        if (company && isInitialLoad) fetchSalaries(1, "", true);
        else if (!company) { toast.error("Company ID not found."); setLoading(false); setIsInitialLoad(false); }
    }, []);

    const handleDeleteSalary = async () => {
        if (!salaryToDelete) return;
        setProcessingId(salaryToDelete.salary_id);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/delete-salary', 'DELETE', { salary_id: salaryToDelete.salary_id }, company?.id);
            const result = await response.json();
            if (result.success) { toast.success('Salary record deleted successfully.'); fetchSalaries(pagination.page, debouncedSearch, false); setShowDeleteModal(false); setSalaryToDelete(null); }
            else { throw new Error(result.message || 'Failed to delete salary'); }
        } catch (error) { console.error('Error deleting salary:', error); toast.error(error.message || 'Failed to delete salary'); }
        finally { setProcessingId(null); }
    };

    const stats = {
        total: meta?.total || 0,
        avgBase: visibleSalaries.length > 0 ? visibleSalaries.reduce((sum, s) => sum + (s.base_amount || 0), 0) / visibleSalaries.length : 0,
        totalCTC: visibleSalaries.reduce((sum, s) => sum + (s.ctc || 0), 0),
        activeCount: visibleSalaries.filter(s => !s.effective_to || new Date(s.effective_to) > new Date()).length,
        currency: visibleSalaries[0]?.currency || salaries[0]?.currency || 'USD'
    };

    const salaryTableActions = (salary) => ([
        { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setSelectedSalary(salary), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50' },
        { label: 'Edit Salary', icon: <FaEdit size={13} />, onClick: () => { setSalaryToEdit(salary); setShowEditModal(true); }, className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50' },
        { label: 'Revise Salary', icon: <FaExchangeAlt size={13} />, onClick: () => { setSalaryToRevise(salary); setShowReviseModal(true); }, className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' },
        { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => { setSalaryToDelete(salary); setShowDeleteModal(true); }, className: 'text-red-600 hover:text-red-700 hover:bg-red-50' }
    ]);

    const salaryTableColumns = [
        visibleColumns.showEmployee && {
            key: 'employee',
            label: 'Employee',
            className: 'max-w-[150px]',
            render: (salary) => (
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full shrink-0 bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center text-white font-semibold`}>
                        {getInitials(salary.employee?.name)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{salary.employee?.name || 'No name'}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <FaEnvelope className="shrink-0 text-gray-400" size={10} />
                            <span className="truncate">{salary.employee?.email}</span>
                        </p>
                        <p className="mt-0.5 text-xs font-mono text-gray-400">{salary.employee?.employee_code}</p>
                    </div>
                </div>
            )
        },
        visibleColumns.showPackage && {
            key: 'package',
            label: 'Package',
            render: (salary) => (
                <span className="inline-flex whitespace-nowrap rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    {salary.package?.name}
                </span>
            )
        },
        visibleColumns.showBaseAmount && {
            key: 'base_amount',
            label: 'Base Amount',
            className: 'whitespace-nowrap font-semibold text-gray-700',
            render: (salary) => formatCurrency(salary.base_amount, salary.currency)
        },
        visibleColumns.showNetSalary && {
            key: 'net_salary',
            label: 'Net Salary',
            render: (salary) => (
                <span className="inline-flex whitespace-nowrap rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {formatCurrency(salary.net_salary, salary.currency)}
                </span>
            )
        },
        visibleColumns.showEffectivePeriod && {
            key: 'effective_period',
            label: 'Effective Period',
            className: 'whitespace-nowrap text-xs text-gray-500',
            render: (salary) => `${formatDate(salary.effective_from)} → ${formatDate(salary.effective_to)}`
        },
        visibleColumns.showStatus && {
            key: 'status',
            label: 'Status',
            render: (salary) => {
                const status = getStatusBadge(salary.effective_to);
                const StatusIcon = status.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}>
                        <StatusIcon size={12} />{status.text}
                    </span>
                );
            }
        }
    ].filter(Boolean);

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <ManagementHub
            eyebrow={<><FaMoneyBillWave size={11} /> Salary management</>}
            title="Salary Management"
            description="Assign and manage employee salaries with responsive table and card layouts."
            accent="green"
            actions={
                <div className="flex items-center gap-3">

                    <ManagementButton
                        tone="green"
                        variant="solid"
                        leftIcon={<FaPlus />}
                        onClick={() => setShowAssignModal(true)}
                    >
                        Assign Salary
                    </ManagementButton>

                    <ManagementButton
                        tone={showHistory ? 'violet' : 'slate'}
                        variant={showHistory ? 'solid' : 'outline'}
                        leftIcon={<FaHistory />}
                        onClick={() => setShowHistory(!showHistory)}
                        className="!py-2 !px-4 text-sm"
                    >
                        History
                    </ManagementButton>
                </div>
            }
        >
            <div className="space-y-6">

                {/* Stats */}
                {!loading && visibleSalaries.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg"><p className="text-xs opacity-80">Total Employees</p><p className="text-2xl font-bold">{stats.total}</p></div>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg"><p className="text-xs opacity-80">Avg Base Salary</p><p className="text-2xl font-bold">{formatCurrency(stats.avgBase, stats.currency)}</p></div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg"><p className="text-xs opacity-80">Total CTC</p><p className="text-2xl font-bold">{formatCurrency(stats.totalCTC, stats.currency)}</p></div>
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white shadow-lg"><p className="text-xs opacity-80">Active Salaries</p><p className="text-2xl font-bold">{stats.activeCount}</p></div>
                    </motion.div>
                )}

                {/* ─── Consolidated Filter & View Bar ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"
                >
                    {/* Left Section: Search & Result Info */}
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Search by employee name, code or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm"
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

                        {!loading && visibleSalaries.length > 0 && (
                            <p className="text-sm text-gray-500 hidden xl:block">
                                <span className="font-semibold text-gray-800">{visibleSalaries.length}</span> of <span className="font-semibold text-gray-800">{stats.total}</span> records
                                {debouncedSearch && <span className="ml-1 text-green-600">· "{debouncedSearch}"</span>}
                            </p>
                        )}
                    </div>

                    {/* Right Section: Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2">

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                            <DatePickerField
                                value=""
                                onChange={handleDateFilterApply}
                                placeholder={dateFilterLabel}
                                buttonClassName="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                                wrapperClassName="w-auto"
                                popoverClassName="w-[min(92vw,24rem)]"
                                initialTab="quick"
                                mode="both"
                            />
                            {dateFilterLabel !== 'Filter by date' && (
                                <button
                                    type="button"
                                    onClick={clearDateFilter}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 transition-all"
                                    title="Clear date filter"
                                >
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>

                        {/* Vertical Separator */}
                        <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

                        {/* View Switcher */}
                        <ManagementViewSwitcher
                            viewMode={viewMode}
                            onChange={setViewMode}
                            accent="green"
                        />
                    </div>
                </motion.div>

                {/* Loading */}
                {loading && !visibleSalaries.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && visibleSalaries.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-xl shadow-xl border border-gray-100">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><FaMoneyBillWave className="text-4xl text-gray-300" /></div>
                        <p className="text-xl font-semibold text-gray-600">No salary records found</p>
                        <p className="text-gray-400 mt-2 text-sm">{debouncedSearch ? `No results for "${debouncedSearch}"` : dateFilterLabel !== 'Filter by date' ? `No results for ${dateFilterLabel}` : 'Click "Assign Salary" to get started'}</p>
                        {debouncedSearch && (<button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all text-sm font-medium">Clear Search</button>)}
                        {!debouncedSearch && (<button onClick={() => setShowAssignModal(true)} className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium">Assign Salary</button>)}
                    </motion.div>
                )}

                {/* ─── TABLE VIEW ─── */}
                {!loading && visibleSalaries.length > 0 && viewMode === "table" && (
                    <ManagementTable
                        rows={visibleSalaries}
                        columns={salaryTableColumns}
                        rowKey="salary_id"
                        onRowClick={(salary) => setSelectedSalary(salary)}
                        activeId={activeActionMenu}
                        onToggleAction={(e, id) => setActiveActionMenu((curr) => (curr === id ? null : id))}
                        getActions={salaryTableActions}
                        accent="green"
                        headerClassName="xsm:hidden"
                    />
                )}
                {/* Card View */}
                {!loading && visibleSalaries.length > 0 && viewMode === "card" && (
                    <ManagementGrid viewMode={viewMode}>
                        {visibleSalaries.map((salary, index) => (
                            <SalaryCard
                                key={salary.salary_id}
                                salary={salary}
                                index={index}
                                onClick={(s) => setSelectedSalary(s)}
                                onEdit={(s) => { setSalaryToEdit(s); setShowEditModal(true); }}
                                onRevise={(s) => { setSalaryToRevise(s); setShowReviseModal(true); }}
                                onDelete={(s) => { setSalaryToDelete(s); setShowDeleteModal(true); }}
                                activeId={activeActionMenu}
                                onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                            />
                        ))}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && visibleSalaries.length > 0 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        onLimitChange={changeLimit}
                        showInfo={true}
                    />
                )}

                {/* Modals */}
                <SalaryDetailModal salary={selectedSalary} onClose={() => setSelectedSalary(null)} />

                <AssignSalaryModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} onSuccess={() => { fetchSalaries(1, "", true); setShowAssignModal(false); }} />

                <EditSalaryModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSalaryToEdit(null); }} onSuccess={() => fetchSalaries(pagination.page, debouncedSearch, false)} salary={salaryToEdit} />

                <ReviseSalaryModal isOpen={showReviseModal} onClose={() => { setShowReviseModal(false); setSalaryToRevise(null); }} onSuccess={() => fetchSalaries(1, "", true)} salary={salaryToRevise} />

                <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSalaryToDelete(null); }} onConfirm={handleDeleteSalary} salary={salaryToDelete} processingId={processingId} />
            </div>
        </ManagementHub>
    );
};

export default SalaryManagement;
