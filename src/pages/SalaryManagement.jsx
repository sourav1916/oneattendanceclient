import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { toast } from 'react-toastify';
import ModalScrollLock from "../components/ModalScrollLock";
import { DatePickerField } from '../components/DatePicker';

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
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaMoneyBillWave /> Salary Details
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Employee Info */}
                        <div className="flex items-center gap-6 pb-6 border-b">
                            <div className={`bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} p-4 rounded-2xl`}>
                                <FaUserCircle className="text-white text-5xl" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{salary.employee?.name || "No name"}</h3>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <FaIdCard className="text-blue-500" size={14} />{salary.employee?.employee_code}
                                </p>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <FaEnvelope className="text-green-500" size={14} />{salary.employee?.email}
                                </p>
                            </div>
                        </div>

                        {/* Salary Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <InfoItem icon={<FaDollarSign className="text-blue-500" />} label="Base Amount" value={formatCurrency(salary.base_amount, salary.currency)} />
                            <InfoItem icon={<FaCalculator className="text-purple-500" />} label="Gross Salary" value={formatCurrency(salary.gross_salary, salary.currency)} />
                            <InfoItem icon={<FaChartBar className="text-orange-500" />} label="Total Deductions" value={formatCurrency(salary.total_deductions, salary.currency)} />
                            <InfoItem icon={<FaMoneyBillWave className="text-emerald-500" />} label="Net Salary" value={formatCurrency(salary.net_salary, salary.currency)} />
                            <InfoItem icon={<FaBriefcase className="text-indigo-500" />} label="Salary Package" value={salary.package?.name || "N/A"} />
                            <InfoItem icon={<FaTag className="text-rose-500" />} label="Status" value={
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                                    <StatusIcon size={12} />{status.text}
                                </span>
                            } />
                            <InfoItem icon={<FaCalendarAlt className="text-cyan-500" />} label="Effective From" value={formatDateFull(salary.effective_from)} />
                            <InfoItem icon={<FaCalendarCheck className="text-yellow-500" />} label="Effective To" value={formatDateFull(salary.effective_to)} />
                        </div>

                        {/* CTC Info */}
                        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <FaChartBar className="text-blue-500" /> CTC (Cost to Company)
                                </span>
                                <span className="text-xl font-bold text-gray-800">{formatCurrency(salary.ctc, salary.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <FaHandPaper className="text-purple-500" /> Employer Contributions
                                </span>
                                <span className="text-lg font-semibold text-purple-600">{formatCurrency(salary.employer_contributions, salary.currency)}</span>
                            </div>
                        </div>

                        {/* Components Breakdown */}
                        {salary.components?.length > 0 && (
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                    <FaCalculator className="text-green-500" /> Salary Components
                                </label>
                                <div className="space-y-2">
                                    {salary.components.map((comp, idx) => (
                                        <ComponentRow key={idx} component={comp} currency={salary.currency} />
                                    ))}
                                </div>
                            </div>
                        )}
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
            toast.warning('Please fill all required fields'); return;
        }
        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
                salary_id: salary.salary_id,
                base_amount: parseFloat(formData.base_amount),
                currency: formData.currency.toLowerCase(),
                effective_from: formData.effective_from,
                effective_to: formData.effective_to || null,
                overrides: formData.overrides.map(o => ({ ...o, effective_to: o.effective_to || null }))
            };
            const response = await apiCall('/salary/update-salary', 'PUT', payload, company?.id);
            const result = await response.json();
            if (result.success) {
                toast.success('Salary updated successfully!');
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || 'Failed to update salary');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to update salary');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !salary) return null;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                    className="bg-white backdrop-blur-xl w-full max-w-4xl min-h-[70vh] max-h-[90vh] rounded-3xl shadow-2xl px-6 sm:px-8 border border-gray-100 m-auto flex flex-col overflow-y-auto"
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl px-6 py-5 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FaEdit className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Edit Salary</h2>
                                    <p className="text-xs text-white/80">{salary.employee?.name} · {salary.employee?.employee_code}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-6">
                        {/* Base Amount + Currency */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Base Amount *</label>
                            <div className="flex gap-2">
                                <select value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-28 px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                                    {currencies.length > 0
                                        ? currencies.map(c => <option key={c.key} value={c.key}>{c.value.symbol} {c.key}</option>)
                                        : <option value="USD">$ USD</option>}
                                </select>
                                <input type="number" placeholder="Enter amount" value={formData.base_amount}
                                    onChange={e => setFormData({ ...formData, base_amount: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                            </div>
                        </div>

                        {/* Effective Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective From *</label>
                                <DatePickerField
                                    value={formData.effective_from}
                                    onChange={(value) => setFormData({ ...formData, effective_from: value })}
                                    placeholder="Select effective from"
                                    buttonClassName="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-left"
                                    popoverClassName="mt-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective To</label>
                                <DatePickerField
                                    value={formData.effective_to}
                                    onChange={(value) => setFormData({ ...formData, effective_to: value })}
                                    placeholder="Select effective to"
                                    buttonClassName="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-left"
                                    popoverClassName="mt-2"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty for ongoing</p>
                            </div>
                        </div>

                        {/* Component Overrides */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaCalculator className="text-blue-500" /> Component Overrides
                                </label>
                                <button type="button"
                                    onClick={() => { setEditingOverride(null); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: formData.effective_from, effective_to: '', reason: '' }); setShowOverrideForm(true); }}
                                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all flex items-center gap-1">
                                    <FaPlus size={10} /> Add Override
                                </button>
                            </div>

                            {formData.overrides.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {formData.overrides.map((override, idx) => {
                                        const component = availableComponents.find(c => c.id === override.component_id);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-gray-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${override.calc_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                        </span>
                                                    </div>
                                                    {override.reason && <p className="text-xs text-gray-400 mt-0.5">{override.reason}</p>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => editOverride(idx)} className="p-1.5 text-gray-400 hover:text-blue-500"><FaEdit size={12} /></button>
                                                    <button type="button" onClick={() => removeOverride(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><FaTimes size={12} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {showOverrideForm && (
                                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-blue-800">{editingOverride !== null ? 'Edit Override' : 'New Override'}</p>
                                        <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Component *</label>
                                            <select value={overrideForm.component_id} onChange={e => setOverrideForm({ ...overrideForm, component_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                                <option value="">Select component</option>
                                                {availableComponents.map(comp => (
                                                    <option key={comp.id} value={comp.id}>{comp.name} ({comp.code}) - {comp.type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Calc Type</label>
                                                <select value={overrideForm.calc_type} onChange={e => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Value *</label>
                                                <input type="number" placeholder={overrideForm.calc_type === 'percentage' ? 'e.g. 30' : 'e.g. 5000'}
                                                    value={overrideForm.calc_value} onChange={e => setOverrideForm({ ...overrideForm, calc_value: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
                                                <DatePickerField
                                                    value={overrideForm.effective_from}
                                                    onChange={(value) => setOverrideForm({ ...overrideForm, effective_from: value })}
                                                    placeholder="From"
                                                    buttonClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-left"
                                                    popoverClassName="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                                                <DatePickerField
                                                    value={overrideForm.effective_to}
                                                    onChange={(value) => setOverrideForm({ ...overrideForm, effective_to: value })}
                                                    placeholder="To"
                                                    buttonClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-left"
                                                    popoverClassName="mt-2"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                                            <input type="text" placeholder="e.g., Special HRA" value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button type="button" onClick={addOverride}
                                                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all">
                                                {editingOverride !== null ? 'Update' : 'Add'}
                                            </button>
                                            <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
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
    const [submitting, setSubmitting] = useState(false);
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);

    const [formData, setFormData] = useState({
        component_package_id: '',
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
                component_package_id: salary.package?.id || '',
                base_amount: salary.base_amount || '',
                currency: salary.currency || 'USD',
                effective_from: '',
                effective_to: '',
                overrides: []
            });
            loadPackages();
            loadComponents();
            loadCurrencies();
        }
    }, [isOpen, salary]);

    const loadPackages = async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/packages', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) setPackages(result.data || []);
        } catch (e) { console.error(e); }
    };

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
        if (!formData.base_amount || !formData.effective_from || !formData.component_package_id) {
            toast.warning('Please fill all required fields'); return;
        }
        setSubmitting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const payload = {
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
            if (result.success) {
                toast.success('Salary revised successfully!');
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || 'Failed to revise salary');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to revise salary');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !salary) return null;

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                    className="bg-white backdrop-blur-xl w-full max-w-4xl min-h-[70vh] max-h-[90vh] rounded-3xl shadow-2xl px-6 sm:px-8 border border-gray-100 m-auto flex flex-col overflow-y-auto"
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl px-6 py-5 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FaExchangeAlt className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Revise Salary</h2>
                                    <p className="text-xs text-white/80">{salary.employee?.name} · Creates a new salary record</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all"><FaTimes size={20} /></button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-6">

                        {/* Info Banner */}
                        <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                            <FaInfoCircle className="text-purple-500 mt-0.5 flex-shrink-0" size={14} />
                            <p className="text-xs text-purple-700">
                                Revising salary creates a <span className="font-semibold">new salary record</span> for this employee. The previous record will remain in history.
                            </p>
                        </div>

                        {/* Package */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Package *</label>
                            <select value={formData.component_package_id} onChange={e => setFormData({ ...formData, component_package_id: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                                <option value="">Select package</option>
                                {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.code})</option>)}
                            </select>
                        </div>

                        {/* Base Amount + Currency */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Base Amount *</label>
                            <div className="flex gap-2">
                                <select value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-28 px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                                    {currencies.length > 0
                                        ? currencies.map(c => <option key={c.key} value={c.key}>{c.value.symbol} {c.key}</option>)
                                        : <option value="USD">$ USD</option>}
                                </select>
                                <input type="number" placeholder="Enter new base amount" value={formData.base_amount}
                                    onChange={e => setFormData({ ...formData, base_amount: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                            </div>
                            {salary.base_amount && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Current: {formatCurrency(salary.base_amount, salary.currency)}
                                    {formData.base_amount && parseFloat(formData.base_amount) !== salary.base_amount && (
                                        <span className={`ml-2 font-semibold ${parseFloat(formData.base_amount) > salary.base_amount ? 'text-green-600' : 'text-red-600'}`}>
                                            {parseFloat(formData.base_amount) > salary.base_amount ? '▲' : '▼'}
                                            {Math.abs(((parseFloat(formData.base_amount) - salary.base_amount) / salary.base_amount) * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Effective Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective From *</label>
                                <DatePickerField
                                    value={formData.effective_from}
                                    onChange={(value) => setFormData({ ...formData, effective_from: value })}
                                    placeholder="Select effective from"
                                    buttonClassName="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-left"
                                    popoverClassName="mt-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective To</label>
                                <DatePickerField
                                    value={formData.effective_to}
                                    onChange={(value) => setFormData({ ...formData, effective_to: value })}
                                    placeholder="Select effective to"
                                    buttonClassName="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-left"
                                    popoverClassName="mt-2"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty for ongoing</p>
                            </div>
                        </div>

                        {/* Overrides — identical pattern, purple accent */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaCalculator className="text-purple-500" /> Component Overrides
                                </label>
                                <button type="button"
                                    onClick={() => { setEditingOverride(null); setOverrideForm({ component_id: '', calc_type: 'percentage', calc_value: '', effective_from: formData.effective_from, effective_to: '', reason: '' }); setShowOverrideForm(true); }}
                                    className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all flex items-center gap-1">
                                    <FaPlus size={10} /> Add Override
                                </button>
                            </div>

                            {formData.overrides.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {formData.overrides.map((override, idx) => {
                                        const component = availableComponents.find(c => c.id === override.component_id);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-gray-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${override.calc_type === 'percentage' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                                                            {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                        </span>
                                                    </div>
                                                    {override.reason && <p className="text-xs text-gray-400 mt-0.5">{override.reason}</p>}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button type="button" onClick={() => editOverride(idx)} className="p-1.5 text-gray-400 hover:text-purple-500"><FaEdit size={12} /></button>
                                                    <button type="button" onClick={() => removeOverride(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><FaTimes size={12} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {showOverrideForm && (
                                <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-purple-800">{editingOverride !== null ? 'Edit Override' : 'New Override'}</p>
                                        <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                                    </div>
                                    <div className="space-y-3">
                                        <select value={overrideForm.component_id} onChange={e => setOverrideForm({ ...overrideForm, component_id: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                                            <option value="">Select component</option>
                                            {availableComponents.map(comp => <option key={comp.id} value={comp.id}>{comp.name} ({comp.code}) - {comp.type}</option>)}
                                        </select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select value={overrideForm.calc_type} onChange={e => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500">
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount</option>
                                            </select>
                                            <input type="number" placeholder="Value" value={overrideForm.calc_value}
                                                onChange={e => setOverrideForm({ ...overrideForm, calc_value: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" value={overrideForm.effective_from} onChange={e => setOverrideForm({ ...overrideForm, effective_from: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                            <input type="date" value={overrideForm.effective_to} onChange={e => setOverrideForm({ ...overrideForm, effective_to: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                        </div>
                                        <input type="text" placeholder="Reason (optional)" value={overrideForm.reason}
                                            onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                                        <div className="flex gap-2 pt-1">
                                            <button type="button" onClick={addOverride}
                                                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all">
                                                {editingOverride !== null ? 'Update' : 'Add'}
                                            </button>
                                            <button type="button" onClick={() => { setShowOverrideForm(false); setEditingOverride(null); }}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                                {submitting ? 'Revising...' : 'Revise Salary'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Assign Salary Modal (Updated with Overrides) ─────────────────────────────────────

const AssignSalaryModal = ({ isOpen, onClose, onSuccess, submitDisabled, submitTitle }) => {
    const [employees, setEmployees] = useState([]);
    const [packages, setPackages] = useState([]);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [editingOverride, setEditingOverride] = useState(null);
    const [formData, setFormData] = useState({
        component_package_id: '',
        base_amount: '',
        currency: 'USD',
        effective_from: '',
        effective_to: '',
        overrides: []
    });

    const [overrideForm, setOverrideForm] = useState({
        component_id: '',
        calc_type: 'percentage',
        calc_value: '',
        effective_from: '',
        effective_to: '',
        reason: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadEmployeesWithoutSalary();
            loadSalaryPackages();
            loadSalaryComponents();
            loadCurrencies();
        }
    }, [isOpen]);

    const loadEmployeesWithoutSalary = async () => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/employees-without-salary', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setEmployees(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSalaryPackages = async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/packages', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setPackages(result.data || []);
                if (result.data?.length > 0) {
                    setFormData(prev => ({ ...prev, component_package_id: result.data[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to load packages:', error);
        }
    };

    const loadSalaryComponents = async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/list', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setAvailableComponents(result.data || []);
            }
        } catch (error) {
            console.error('Failed to load salary components:', error);
        }
    };

    const loadCurrencies = async () => {
        try {
            const response = await apiCall('/constants/?type=currency', 'GET');
            const result = await response.json();
            if (result.success && result.data?.currency_types) {
                setCurrencies(result.data.currency_types);
                const keys = result.data.currency_types.map(c => c.key);
                setFormData(prev => ({
                    ...prev,
                    currency: keys.includes(prev.currency) ? prev.currency : (keys[0] || 'USD')
                }));
            }
        } catch (error) {
            console.error('Failed to load currencies:', error);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addOverride = () => {
        if (!overrideForm.component_id || !overrideForm.calc_value) {
            toast.warning('Please fill component and value');
            return;
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
            setFormData({
                ...formData,
                overrides: [...formData.overrides, newOverride]
            });
        }

        setOverrideForm({
            component_id: '',
            calc_type: 'percentage',
            calc_value: '',
            effective_from: '',
            effective_to: '',
            reason: ''
        });
        setShowOverrideForm(false);
    };

    const editOverride = (index) => {
        const override = formData.overrides[index];
        setOverrideForm({
            component_id: override.component_id,
            calc_type: override.calc_type,
            calc_value: override.calc_value,
            effective_from: override.effective_from || '',
            effective_to: override.effective_to || '',
            reason: override.reason || ''
        });
        setEditingOverride(index);
        setShowOverrideForm(true);
    };

    const removeOverride = (index) => {
        const updated = formData.overrides.filter((_, i) => i !== index);
        setFormData({ ...formData, overrides: updated });
    };

    const resetForm = () => {
        setSelectedEmployee(null);
        setSearchTerm('');
        setFormData({
            component_package_id: packages[0]?.id || '',
            base_amount: '',
            currency: 'USD',
            effective_from: '',
            effective_to: '',
            overrides: []
        });
        setOverrideForm({
            component_id: '',
            calc_type: 'percentage',
            calc_value: '',
            effective_from: '',
            effective_to: '',
            reason: ''
        });
        setShowOverrideForm(false);
        setEditingOverride(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitDisabled) return;
        if (!selectedEmployee) {
            toast.warning('Please select an employee');
            return;
        }
        if (!formData.base_amount || !formData.effective_from || !formData.component_package_id) {
            toast.warning('Please fill all required fields');
            return;
        }

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
                overrides: formData.overrides.map(o => ({
                    ...o,
                    effective_to: o.effective_to || null
                }))
            };

            const response = await apiCall('/salary/assign-salary', 'POST', payload, company?.id);
            const result = await response.json();
            if (result.success) {
                toast.success('Salary assigned successfully!');
                onSuccess();
                onClose();
                resetForm();
            } else {
                toast.error(result.message || 'Failed to assign salary');
            }
        } catch (error) {
            console.error('Error assigning salary:', error);
            toast.error('Failed to assign salary');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

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
                    className="bg-white backdrop-blur-xl w-full max-w-4xl min-h-[70vh] max-h-[90vh] rounded-3xl shadow-2xl px-6 sm:px-8 border border-gray-100 m-auto flex flex-col overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl px-6 py-5 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-md">
                                    <FaPlus className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">Assign Salary</h2>
                                    <p className="text-xs text-white/80">Assign salary to an employee with component overrides</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                <FaTimes size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 pt-6">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search employee by name, code or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    disabled={!!selectedEmployee}
                                />
                                <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                            </div>

                            {!selectedEmployee && (
                                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                                    {loading ? (
                                        <div className="p-4 text-center text-gray-400"><FaSpinner className="animate-spin inline mr-2" />Loading...</div>
                                    ) : filteredEmployees.length === 0 ? (
                                        <div className="p-4 text-center text-gray-400">No employees found</div>
                                    ) : (
                                        filteredEmployees.map(emp => (
                                            <button
                                                key={emp.employee_id}
                                                type="button"
                                                onClick={() => setSelectedEmployee(emp)}
                                                className="w-full p-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3"
                                            >
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(emp.employee_id)} flex items-center justify-center flex-shrink-0`}>
                                                    <span className="text-white font-bold text-xs">{getInitials(emp.name)}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm">{emp.name}</p>
                                                    <p className="text-xs text-gray-400">{emp.employee_code} • {emp.email}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{formatDisplay(emp.designation)}</p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {selectedEmployee && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient(selectedEmployee.employee_id)} flex items-center justify-center`}>
                                            <span className="text-white font-bold text-xs">{getInitials(selectedEmployee.name)}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{selectedEmployee.name}</p>
                                            <p className="text-xs text-gray-500">{selectedEmployee.employee_code}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedEmployee(null)}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Salary Package */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Package *</label>
                            <select
                                value={formData.component_package_id}
                                onChange={(e) => setFormData({ ...formData, component_package_id: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                            >
                                {packages.length === 0 ? (
                                    <option value="">Loading packages...</option>
                                ) : (
                                    packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({pkg.code})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Base Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Base Amount *</label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-28 px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                >
                                    {currencies.length > 0
                                        ? currencies.map(c => (
                                            <option key={c.key} value={c.key}>
                                                {c.value.symbol} {c.key}
                                            </option>
                                        ))
                                        : <option value="USD">$ US Dollar</option>
                                    }
                                </select>
                                <input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={formData.base_amount}
                                    onChange={(e) => setFormData({ ...formData, base_amount: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Effective Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective From *</label>
                                <input
                                    type="date"
                                    value={formData.effective_from}
                                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective To</label>
                                <input
                                    type="date"
                                    value={formData.effective_to}
                                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty for ongoing</p>
                            </div>
                        </div>

                        {/* Component Overrides Section */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <FaCalculator className="text-green-500" />
                                    Component Overrides
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingOverride(null);
                                        setOverrideForm({
                                            component_id: '',
                                            calc_type: 'percentage',
                                            calc_value: '',
                                            effective_from: formData.effective_from,
                                            effective_to: '',
                                            reason: ''
                                        });
                                        setShowOverrideForm(true);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all flex items-center gap-1"
                                >
                                    <FaPlus size={10} /> Add Override
                                </button>
                            </div>

                            {/* Overrides List */}
                            {formData.overrides.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {formData.overrides.map((override, idx) => {
                                        const component = availableComponents.find(c => c.id === override.component_id);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-gray-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${override.calc_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {override.calc_type}: {override.calc_value}{override.calc_type === 'percentage' ? '%' : ''}
                                                        </span>
                                                    </div>
                                                    {override.reason && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{override.reason}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400">
                                                        {override.effective_from ? formatDate(override.effective_from) : 'Start'} → {override.effective_to ? formatDate(override.effective_to) : 'Ongoing'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => editOverride(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <FaEdit size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOverride(idx)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add/Edit Override Form */}
                            {showOverrideForm && (
                                <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-green-800">
                                            {editingOverride !== null ? 'Edit Override' : 'New Override'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOverrideForm(false);
                                                setEditingOverride(null);
                                            }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Component *</label>
                                            <select
                                                value={overrideForm.component_id}
                                                onChange={(e) => setOverrideForm({ ...overrideForm, component_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                            >
                                                <option value="">Select component</option>
                                                {availableComponents.map(comp => (
                                                    <option key={comp.id} value={comp.id}>
                                                        {comp.name} ({comp.code}) - {comp.type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Calculation Type</label>
                                                <select
                                                    value={overrideForm.calc_type}
                                                    onChange={(e) => setOverrideForm({ ...overrideForm, calc_type: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                    Value {overrideForm.calc_type === 'percentage' ? '(%)' : '(Amount)'} *
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder={overrideForm.calc_type === 'percentage' ? 'e.g., 30' : 'e.g., 5000'}
                                                    value={overrideForm.calc_value}
                                                    onChange={(e) => setOverrideForm({ ...overrideForm, calc_value: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Effective From</label>
                                                <DatePickerField
                                                    value={overrideForm.effective_from}
                                                    onChange={(value) => setOverrideForm({ ...overrideForm, effective_from: value })}
                                                    placeholder="Effective from"
                                                    buttonClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm text-left"
                                                    popoverClassName="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Effective To</label>
                                                <DatePickerField
                                                    value={overrideForm.effective_to}
                                                    onChange={(value) => setOverrideForm({ ...overrideForm, effective_to: value })}
                                                    placeholder="Effective to"
                                                    buttonClassName="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm text-left"
                                                    popoverClassName="mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Special HRA, PF disabled"
                                                value={overrideForm.reason}
                                                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={addOverride}
                                                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
                                            >
                                                {editingOverride !== null ? 'Update Override' : 'Add Override'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowOverrideForm(false);
                                                    setEditingOverride(null);
                                                }}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary of Overrides */}
                        {formData.overrides.length > 0 && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                                    <FaInfoCircle /> Override Summary
                                </p>
                                <p className="text-xs text-blue-700">
                                    {formData.overrides.length} component{formData.overrides.length > 1 ? 's are' : ' is'} being overridden
                                    from the standard package calculation.
                                </p>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || submitDisabled}
                                title={submitDisabled ? submitTitle : ""}
                                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                {submitting ? 'Assigning...' : 'Assign Salary'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, salary, processingId }) => {
    if (!isOpen || !salary) return null;

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
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaTrash /> Delete Salary Record
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
                            <FaBan className="text-4xl text-red-600" />
                        </motion.div>
                        <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                        <p className="text-gray-500 mb-6">
                            You are about to delete the salary record for{" "}
                            <span className="font-semibold text-red-600">{salary.employee?.name}</span>.
                            This action cannot be undone.
                        </p>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                            <button onClick={onClose}
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
                                Keep
                            </button>
                            <button onClick={onConfirm} disabled={processingId === salary.salary_id}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                                {processingId === salary.salary_id && <FaSpinner className="animate-spin" />}
                                Delete Record
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Salary Card (Grid) ──────────────────────────────────────────────────────

const SalaryCard = ({ salary, index, onClick, onDelete, onView, activeId, onToggle }) => {
    const status = getStatusBadge(salary.effective_to);
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
            onClick={() => onClick(salary)}
        >
            <div className="flex items-start justify-between gap-2.5 mb-3">
                <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                        <span className="text-white font-bold text-sm">{getInitials(salary.employee?.name)}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{salary.employee?.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{salary.employee?.employee_code}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{salary.employee?.email}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                    <StatusIcon size={10} />{status.text}
                </span>
            </div>

            <p className="text-xs text-gray-400 mb-3 truncate flex items-center gap-1">
                <FaBriefcase className="text-purple-500" size={10} /> {salary.package?.name}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(salary.base_amount, salary.currency)}</p>
                    <p className="text-xs text-blue-500">Base</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-purple-700">{formatCurrency(salary.net_salary, salary.currency)}</p>
                    <p className="text-xs text-purple-500">Net</p>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                    <FaCalendarPlus size={9} />
                    {formatDate(salary.effective_from)}
                </span>
                <span className="flex items-center gap-1">
                    <FaCalendarCheck size={9} />
                    {formatDate(salary.effective_to)}
                </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
                {salary.components?.slice(0, 2).map((comp, idx) => (
                    <SalaryBadge key={idx} type={comp.type} value={comp.code} />
                ))}
                {(salary.components?.length || 0) > 2 && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        +{salary.components.length - 2} more
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                <span className="text-xs text-gray-400">
                    {formatCurrency(salary.ctc, salary.currency)} CTC
                </span>
                <div onClick={e => e.stopPropagation()}>
                    <ActionMenu
                        menuId={`card-${salary.salary_id}`}
                        activeId={activeId}
                        onToggle={onToggle}
                        actions={[
                            {
                                label: 'View Details',
                                icon: <FaEye size={13} />,
                                onClick: () => setSelectedSalary(salary),
                                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            },
                            {
                                label: 'Edit Salary',
                                icon: <FaEdit size={13} />,
                                onClick: () => { setSalaryToEdit(salary); setShowEditModal(true); },
                                className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                            },
                            {
                                label: 'Revise Salary',
                                icon: <FaExchangeAlt size={13} />,
                                onClick: () => { setSalaryToRevise(salary); setShowReviseModal(true); },
                                className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                            },
                            {
                                label: 'Delete',
                                icon: <FaTrash size={13} />,
                                onClick: () => { setSalaryToDelete(salary); setShowDeleteModal(true); },
                                className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }
                        ]}
                    />
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const SalaryManagement = () => {
    const [salaries, setSalaries] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showHistory, setShowHistory] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [salaryToDelete, setSalaryToDelete] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [visibleColumns, setVisibleColumns] = useState(() => ({
        showEmployee: true,
        showPackage: window.innerWidth >= 1024,
        showBaseAmount: window.innerWidth >= 480,
        showNetSalary: window.innerWidth >= 590,
        showEffectivePeriod: window.innerWidth >= 1280,
        showStatus: window.innerWidth >= 768,
    }));
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [salaryToEdit, setSalaryToEdit] = useState(null);
    const [salaryToRevise, setSalaryToRevise] = useState(null);

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Responsive columns
    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() =>
                setVisibleColumns({
                    showEmployee: true,
                    showPackage: window.innerWidth >= 1024,
                    showBaseAmount: window.innerWidth >= 480,
                    showNetSalary: window.innerWidth >= 590,
                    showEffectivePeriod: window.innerWidth >= 1280,
                    showStatus: window.innerWidth >= 768,
                }), 150);
        };
        window.addEventListener("resize", onResize);
        return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
    }, []);

    const fetchSalaries = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            let url = `/salary/employees-salaries?page=${page}&limit=${pagination.limit}`;
            if (showHistory) url += '&history=true';
            if (search) url += `&search=${search}`;

            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setSalaries(result.data || []);
                setMeta(result);
                updatePagination({
                    page: result.page || page,
                    limit: result.limit || pagination.limit,
                    total: result.total || 0,
                    total_pages: Math.ceil((result.total || 0) / pagination.limit),
                    is_last_page: result.page >= Math.ceil((result.total || 0) / pagination.limit)
                });
            } else {
                throw new Error(result.message || "Failed to fetch salaries");
            }
        } catch (e) {
            toast.error(e.message || "Failed to load salary records.");
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, showHistory, updatePagination]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // Search and history triggers
    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchSalaries(1, debouncedSearch, true);
        }
    }, [debouncedSearch, showHistory]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchSalaries(pagination.page, debouncedSearch, true);
        }
    }, [pagination.page]);

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('company'));
        if (company && isInitialLoad) {
            fetchSalaries(1, "", true);
        } else if (!company) {
            toast.error("Company ID not found. Please ensure you're logged in as a company.");
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    const handleDeleteSalary = async () => {
        if (!salaryToDelete) return;
        setProcessingId(salaryToDelete.salary_id);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/delete-salary', 'DELETE', { salary_id: salaryToDelete.salary_id }, company?.id);
            const result = await response.json();
            if (result.success) {
                toast.success('Salary record deleted successfully.');
                fetchSalaries(pagination.page, debouncedSearch, false);
                setShowDeleteModal(false);
                setSalaryToDelete(null);
            } else {
                throw new Error(result.message || 'Failed to delete salary');
            }
        } catch (error) {
            console.error('Error deleting salary:', error);
            toast.error(error.message || 'Failed to delete salary');
        } finally {
            setProcessingId(null);
        }
    };

    const stats = {
        total: meta?.total || 0,
        avgBase: salaries.length > 0
            ? salaries.reduce((sum, s) => sum + (s.base_amount || 0), 0) / salaries.length
            : 0,
        totalCTC: salaries.reduce((sum, s) => sum + (s.ctc || 0), 0),
        activeCount: salaries.filter(s => !s.effective_to || new Date(s.effective_to) > new Date()).length,
        currency: salaries[0]?.currency || 'USD'
    };

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
                >
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                        Salary Management
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showHistory
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FaHistory /> History
                        </button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAssignModal(true)}
                            className="group relative px-6 py-2.5 bg-gradient-to-r from-green-600 via-green-600 to-emerald-600
                                       text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
                                       transition-all duration-300 flex items-center gap-2 overflow-hidden"
                        >
                            <div className="relative z-10">
                                <svg className="w-4 h-4 group-hover:rotate-90 transition-all duration-300"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="relative z-10 text-sm">Assign Salary</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                           transition-transform duration-700 bg-gradient-to-r
                                           from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats Summary */}
                {!loading && salaries.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
                            <p className="text-xs opacity-80">Total Employees</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                            <p className="text-xs opacity-80">Avg Base Salary</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats.avgBase, stats.currency)}</p>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                            <p className="text-xs opacity-80">Total CTC</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats.totalCTC, stats.currency)}</p>
                        </div>
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
                            <p className="text-xs opacity-80">Active Salaries</p>
                            <p className="text-2xl font-bold">{stats.activeCount}</p>
                        </div>
                    </motion.div>
                )}

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
                            placeholder="Search by employee name, code or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none shadow-lg transition-all"
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
                {!loading && salaries.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-800">{salaries.length}</span> of{' '}
                            <span className="font-semibold text-gray-800">{stats.total}</span> salary records
                            {debouncedSearch && <span className="ml-1 text-green-600">· "{debouncedSearch}"</span>}
                            {showHistory && <span className="ml-1 text-purple-600">· Showing history</span>}
                        </p>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="green" />
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !salaries.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && salaries.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaMoneyBillWave className="text-4xl text-gray-300" />
                        </div>
                        <p className="text-xl font-semibold text-gray-600">No salary records found</p>
                        <p className="text-gray-400 mt-2 text-sm">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Click "Assign Salary" to get started'}
                        </p>
                        {debouncedSearch && (
                            <button onClick={() => setSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all text-sm font-medium">
                                Clear Search
                            </button>
                        )}
                        {!debouncedSearch && (
                            <button onClick={() => setShowAssignModal(true)}
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium">
                                Assign Salary
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Table View */}
                {!loading && salaries.length > 0 && viewMode === "table" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-visible"
                    >
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        {visibleColumns.showEmployee && <th className="px-6 py-4">Employee</th>}
                                        {visibleColumns.showPackage && <th className="px-6 py-4">Package</th>}
                                        {visibleColumns.showBaseAmount && <th className="px-6 py-4">Base Amount</th>}
                                        {visibleColumns.showNetSalary && <th className="px-6 py-4">Net Salary</th>}
                                        {visibleColumns.showEffectivePeriod && <th className="px-6 py-4">Effective Period</th>}
                                        {visibleColumns.showStatus && <th className="px-6 py-4">Status</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {salaries.map((salary, index) => {
                                        const status = getStatusBadge(salary.effective_to);
                                        const StatusIcon = status.icon;
                                        const isActive = !salary.effective_to || new Date(salary.effective_to) > new Date();

                                        return (
                                            <motion.tr
                                                key={salary.salary_id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedSalary(salary)}
                                            >
                                                {visibleColumns.showEmployee && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center text-white font-semibold`}>
                                                                {getInitials(salary.employee?.name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-800">{salary.employee?.name || "No name"}</p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <FaEnvelope className="text-gray-400" size={10} />{salary.employee?.email}
                                                                </p>
                                                                <p className="text-xs text-gray-400 font-mono">{salary.employee?.employee_code}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {visibleColumns.showPackage && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                                            {salary.package?.name}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.showBaseAmount && (
                                                    <td className="px-6 py-4 font-semibold text-gray-700">
                                                        {formatCurrency(salary.base_amount, salary.currency)}
                                                    </td>
                                                )}
                                                {visibleColumns.showNetSalary && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                                                            {formatCurrency(salary.net_salary, salary.currency)}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.showEffectivePeriod && (
                                                    <td className="px-6 py-4 text-xs">
                                                        {formatDate(salary.effective_from)} → {formatDate(salary.effective_to)}
                                                    </td>
                                                )}
                                                {visibleColumns.showStatus && (
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                                                            <StatusIcon size={12} />{status.text}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <ActionMenu
                                                            menuId={`table-${salary.salary_id}`}
                                                            activeId={activeActionMenu}
                                                            onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                                            actions={[
                                                                {
                                                                    label: 'View Details',
                                                                    icon: <FaEye size={13} />,
                                                                    onClick: () => setSelectedSalary(salary),
                                                                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                                },
                                                                {
                                                                    label: 'Edit Salary',
                                                                    icon: <FaEdit size={13} />,
                                                                    onClick: () => { setSalaryToEdit(salary); setShowEditModal(true); },
                                                                    className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                                                                },
                                                                {
                                                                    label: 'Revise Salary',
                                                                    icon: <FaExchangeAlt size={13} />,
                                                                    onClick: () => { setSalaryToRevise(salary); setShowReviseModal(true); },
                                                                    className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                                                },
                                                                {
                                                                    label: 'Delete',
                                                                    icon: <FaTrash size={13} />,
                                                                    onClick: () => { setSalaryToDelete(salary); setShowDeleteModal(true); },
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
                {!loading && salaries.length > 0 && viewMode === "card" && (
                    <ManagementGrid viewMode={viewMode}>
                        {salaries.map((salary, index) => (
                            <SalaryCard
                                key={salary.salary_id}
                                salary={salary}
                                index={index}
                                onClick={(s) => setSelectedSalary(s)}
                                onView={(s) => setSelectedSalary(s)}
                                onDelete={(s) => {
                                    setSalaryToDelete(s);
                                    setShowDeleteModal(true);
                                }}
                                activeId={activeActionMenu}
                                onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                            />
                        ))}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && salaries.length > 0 && (
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
                <SalaryDetailModal
                    salary={selectedSalary}
                    onClose={() => setSelectedSalary(null)}
                />

                <AssignSalaryModal
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        fetchSalaries(1, "", true);
                        setShowAssignModal(false);
                    }}
                />
                <EditSalaryModal
                    isOpen={showEditModal}
                    onClose={() => { setShowEditModal(false); setSalaryToEdit(null); }}
                    onSuccess={() => fetchSalaries(pagination.page, debouncedSearch, false)}
                    salary={salaryToEdit}
                />

                <ReviseSalaryModal
                    isOpen={showReviseModal}
                    onClose={() => { setShowReviseModal(false); setSalaryToRevise(null); }}
                    onSuccess={() => fetchSalaries(1, "", true)}
                    salary={salaryToRevise}
                />

                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSalaryToDelete(null);
                    }}
                    onConfirm={handleDeleteSalary}
                    salary={salaryToDelete}
                    processingId={processingId}
                />
            </div>
        </div>
    );
};

export default SalaryManagement;
