// SalaryManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaClock, FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaUserCircle, FaSpinner, FaBriefcase, FaCheckCircle,
    FaTimesCircle, FaSearch, FaTimes, FaChartBar,
    FaMoon, FaSun, FaInfoCircle, FaAngleDown,
    FaEnvelope, FaPhone, FaIdCard, FaUserTag,
    FaDollarSign, FaHandPaper, FaRobot, FaEye,
    FaListUl, FaTh, FaShieldAlt, FaPlus, FaEdit,
    FaTrash, FaHistory, FaMoneyBillWave, FaPercentage,
    FaCalculator, FaCalendarPlus, FaCalendarCheck,
    FaExchangeAlt, FaSave, FaTimes as FaTimesClose
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { toast } from 'react-toastify';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];



const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
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

// ─── Sub Components ───────────────────────────────────────────────────────────

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

const StatCard = ({ icon, label, value, color, currency }) => {
    const colors = {
        green: 'bg-green-50 border-green-200 text-green-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        red: 'bg-red-50 border-red-200 text-red-700'
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[color]}`}>
            <div className="text-xl">{icon}</div>
            <div>
                <p className="text-xs opacity-75">{label}</p>
                <p className="text-lg font-bold">{typeof value === 'number' ? formatCurrency(value, currency) : value}</p>
            </div>
        </div>
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
                <div className="flex items-center gap-2">
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
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaMoneyBillWave className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Salary Details</h2>
                                    <p className="text-xs text-gray-400">
                                        {formatDate(salary.effective_from)} - {formatDate(salary.effective_to)}
                                    </p>
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

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-5">
                        {/* Employee Info */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                <span className="text-white font-bold text-lg">{getInitials(salary.employee?.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-lg truncate">{salary.employee?.name}</h3>
                                <p className="text-sm text-gray-500">{salary.employee?.employee_code}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{salary.employee?.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Package</p>
                                <p className="font-semibold text-gray-800">{salary.package?.name}</p>
                            </div>
                        </div>

                        {/* Salary Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard 
                                icon={<FaDollarSign />} 
                                label="Base Amount" 
                                value={salary.base_amount} 
                                color="blue"
                                currency={salary.currency}
                            />
                            <StatCard 
                                icon={<FaCalculator />} 
                                label="Gross Salary" 
                                value={salary.gross_salary} 
                                color="green"
                                currency={salary.currency}
                            />
                            <StatCard 
                                icon={<FaChartBar />} 
                                label="Total Deductions" 
                                value={salary.total_deductions} 
                                color="red"
                                currency={salary.currency}
                            />
                            <StatCard 
                                icon={<FaMoneyBillWave />} 
                                label="Net Salary" 
                                value={salary.net_salary} 
                                color="purple"
                                currency={salary.currency}
                            />
                        </div>

                        {/* CTC Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">CTC (Cost to Company)</span>
                                <span className="text-xl font-bold text-gray-800">{formatCurrency(salary.ctc, salary.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm font-semibold text-gray-600">Employer Contributions</span>
                                <span className="text-lg font-semibold text-purple-600">{formatCurrency(salary.employer_contributions, salary.currency)}</span>
                            </div>
                        </div>

                        {/* Components Breakdown */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaCalculator className="text-blue-400" /> Salary Components
                            </p>
                            <div className="space-y-2">
                                {salary.components?.map((comp, idx) => (
                                    <ComponentRow key={idx} component={comp} currency={salary.currency} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-2">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Assign Salary Modal (Updated with Overrides) ─────────────────────────────────────

const AssignSalaryModal = ({ isOpen, onClose, onSuccess }) => {
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

    // Override form state
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
                // Set default to first item if current default isn't in the list
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

    // Override CRUD operations
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

        // Reset override form
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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


    if (!isOpen) return null;

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
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaPlus className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Assign Salary</h2>
                                    <p className="text-xs text-gray-400">Assign salary to an employee with component overrides</p>
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

                    <form onSubmit={handleSubmit} className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-4">
                        {/* Employee Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search employee by name, code or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    disabled={!!selectedEmployee}
                                />
                                <FaSearch className="absolute left-3 top-3.5 text-gray-400 text-sm" />
                            </div>
                            
                            {!selectedEmployee && (
                                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                                    {loading ? (
                                        <div className="p-4 text-center text-gray-400">Loading...</div>
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
                                                    <p className="text-xs text-gray-400 capitalize">{emp.designation?.replace(/_/g, ' ')}</p>
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
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                                    className="w-28 px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Effective To</label>
                                <input
                                    type="date"
                                    value={formData.effective_to}
                                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
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
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-800 text-sm">{component?.name || `Component ${override.component_id}`}</p>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                            override.calc_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
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
                                        {/* Component Selection */}
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

                                        {/* Calculation Type & Value */}
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

                                        {/* Override Effective Dates */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Effective From</label>
                                                <input
                                                    type="date"
                                                    value={overrideForm.effective_from}
                                                    onChange={(e) => setOverrideForm({ ...overrideForm, effective_from: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Effective To</label>
                                                <input
                                                    type="date"
                                                    value={overrideForm.effective_to}
                                                    onChange={(e) => setOverrideForm({ ...overrideForm, effective_to: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Reason */}
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

                                        {/* Action Buttons */}
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
                                disabled={submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, salary }) => {
    if (!isOpen) return null;

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
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaTrash className="text-red-500 text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Salary Record</h3>
                        <p className="text-gray-500 text-sm">
                            Are you sure you want to delete the salary record for <br />
                            <span className="font-semibold text-gray-700">{salary?.employee?.name}</span>?
                        </p>
                        <p className="text-xs text-red-500 mt-2">This action cannot be undone.</p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"
                            >
                                Delete
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
    const isActive = !salary.effective_to || new Date(salary.effective_to) > new Date();
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onClick(salary)}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                        <span className="text-white font-bold text-xs">{getInitials(salary.employee?.name)}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate text-sm">{salary.employee?.name}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">{salary.employee?.employee_code}</p>
                    </div>
                </div>
                {isActive && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">Active</span>
                )}
            </div>

            <p className="text-[10px] text-gray-400 mb-2.5 truncate">{salary.package?.name}</p>

            <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-1.5 text-center">
                    <p className="text-xs font-bold text-blue-700">{formatCurrency(salary.base_amount, salary.currency)}</p>
                    <p className="text-xs text-blue-500">Base</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-1.5 text-center">
                    <p className="text-xs font-bold text-purple-700">{formatCurrency(salary.net_salary, salary.currency)}</p>
                    <p className="text-xs text-purple-500">Net</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-2.5 text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                    <FaCalendarPlus size={9} />
                    {formatDate(salary.effective_from)}
                </span>
                <span className="flex items-center gap-1">
                    <FaCalendarCheck size={9} />
                    {formatDate(salary.effective_to)}
                </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2.5">
                {salary.components?.slice(0, 2).map((comp, idx) => (
                    <SalaryBadge key={idx} type={comp.type} value={comp.code} />
                ))}
                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[11px] font-semibold border border-green-100">
                    {salary.components?.length || 0} items
                </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                <span className="text-xs text-gray-400">
                    {salary.components?.length > 2 ? `+${salary.components.length - 2} more` : ' '}
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
                                onClick: () => onView(salary),
                                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                            },
                            {
                                label: 'Delete',
                                icon: <FaTrash size={13} />,
                                onClick: () => onDelete(salary),
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
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [showHistory, setShowHistory] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [salaryToDelete, setSalaryToDelete] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    const { pagination, updatePagination, goToPage } = usePagination(1, 12);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (initialFetchDone.current) {
            if (pagination.page !== 1) goToPage(1);
            else fetchSalaries(1);
        }
    }, [debouncedSearch, showHistory]);

    const fetchSalaries = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            let url = `/salary/employees-salaries?page=${page}&limit=${pagination.limit}`;
            if (showHistory) url += '&history=true';
            if (debouncedSearch) url += `&search=${debouncedSearch}`;

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
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            initialFetchDone.current = true;
        }
    }, [pagination.page, pagination.limit, debouncedSearch, showHistory, updatePagination]);

    useEffect(() => {
        fetchSalaries(1);
    }, []);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchSalaries(pagination.page);
        }
    }, [pagination.page]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    const showEmployeeCode = windowWidth >= 1100;
    const showPackage = windowWidth >= 1360;
    const showBaseAmount = windowWidth >= 480;
    const showNetSalary = windowWidth >= 590;
    const showEffectivePeriod = windowWidth >= 1520;
    const showStatus = windowWidth >= 1720;
    const tableMinWidth = windowWidth < 480
        ? 320
        : windowWidth < 590
            ? 420
            : windowWidth < 900
                ? 560
                : windowWidth < 1280
                    ? 720
                    : windowWidth < 1520
                        ? 860
                        : 980;
    const visibleColumns = {
        showEmployee: true,
        showEmployeeCode,
        showPackage,
        showBaseAmount,
        showNetSalary,
        showEffectivePeriod,
        showStatus,
    };
    const showTableView = viewMode === 'table';
    const showCardView = viewMode === 'card';

    const handleDeleteSalary = async () => {
        if (!salaryToDelete) return;
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/delete-salary', 'DELETE', { salary_id: salaryToDelete.salary_id }, company?.id);
            const result = await response.json();
            if (result.success) {
                toast.success('Salary record deleted.');
                fetchSalaries(pagination.page);
                setShowDeleteModal(false);
                setSalaryToDelete(null);
            } else {
                toast.error(result.message || 'Failed to delete salary');
            }
        } catch (error) {
            console.error('Error deleting salary:', error);
            toast.error('Failed to delete salary');
        }
    };

    return (
        <div className="max-w-7xl m-auto min-h-screen p-3 md:p-6 font-sans">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                        Salary Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage employee salaries and compensation</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            showHistory 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <FaHistory /> History
                    </button>
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                    >
                        <FaPlus /> Assign Salary
                    </button>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-4"
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by employee name, code, or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none shadow-lg transition-all"
                    />
                    <FaSearch className="absolute left-4 top-4 text-gray-400 text-lg" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <FaTimes />
                        </button>
                    )}
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
                        <p className="text-2xl font-bold">{meta?.total || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
                        <p className="text-xs opacity-80">Avg Base Salary</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(
                                salaries.reduce((sum, s) => sum + (s.base_amount || 0), 0) / (salaries.length || 1),
                                salaries[0]?.currency || 'USD'
                            )}
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                        <p className="text-xs opacity-80">Total CTC</p>
                        <p className="text-2xl font-bold">
                            {formatCurrency(
                                salaries.reduce((sum, s) => sum + (s.ctc || 0), 0),
                                salaries[0]?.currency || 'USD'
                            )}
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
                        <p className="text-xs opacity-80">Active Salaries</p>
                        <p className="text-2xl font-bold">
                            {salaries.filter(s => !s.effective_to || new Date(s.effective_to) > new Date()).length}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* View Toggle */}
            {!loading && salaries.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{salaries.length}</span> of{' '}
                        <span className="font-semibold text-gray-800">{meta?.total || 0}</span> salary records
                        {debouncedSearch && <span className="ml-1 text-green-600">· "{debouncedSearch}"</span>}
                        {showHistory && <span className="ml-1 text-purple-600">· Showing history</span>}
                    </p>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                </div>
            )}

            {/* Loading */}
            {loading && <SkeletonComponent />}

            {/* Empty State */}
            {!loading && salaries.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
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

            {/* Card View */}
            {showCardView && (
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

            {/* Table View */}
            {!loading && salaries.length > 0 && showTableView && (
                <>
                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-white shadow-xl overflow-visible mb-4"
                    >
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm text-left text-gray-700" style={{ minWidth: `${tableMinWidth}px` }}>
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
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
                                        const isActive = !salary.effective_to || new Date(salary.effective_to) > new Date();
                                        return (
                                            <motion.tr
                                                key={salary.salary_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedSalary(salary)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white font-bold text-xs">{getInitials(salary.employee?.name)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{salary.employee?.name}</p>
                                                            {visibleColumns.showEmployeeCode && (
                                                                <p className="text-xs text-gray-400 font-mono">{salary.employee?.employee_code}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {visibleColumns.showPackage && (
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100">
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
                                                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
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
                                                    {isActive ? (
                                                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Expired</span>
                                                    )}
                                                </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
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
                                                                label: 'Delete',
                                                                icon: <FaTrash size={13} />,
                                                                onClick: () => { setSalaryToDelete(salary); setShowDeleteModal(true); },
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

            {/* Card View */}
            {false && (
                <ManagementGrid viewMode={viewMode}>
                        {salaries.map((salary, index) => {
                            const isActive = !salary.effective_to || new Date(salary.effective_to) > new Date();
                            return (
                                <motion.div
                                    key={salary.salary_id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedSalary(salary)}
                                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(salary.employee?.id || 1)} flex items-center justify-center flex-shrink-0 shadow-md`}>
                                            <span className="text-white font-bold">{getInitials(salary.employee?.name)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 truncate">{salary.employee?.name}</h3>
                                                    <p className="text-xs text-gray-500">{salary.employee?.employee_code}</p>
                                                </div>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                                            <p className="text-sm font-bold text-blue-700">{formatCurrency(salary.base_amount, salary.currency)}</p>
                                            <p className="text-xs text-blue-500">Base</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-2 text-center border border-purple-100">
                                            <p className="text-sm font-bold text-purple-700">{formatCurrency(salary.net_salary, salary.currency)}</p>
                                            <p className="text-xs text-purple-500">Net</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>{formatDate(salary.effective_from)} → {formatDate(salary.effective_to)}</span>
                                        <div onClick={e => e.stopPropagation()}>
                                            <ActionMenu
                                                menuId={`mobile-${salary.salary_id}`}
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
                        })}
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
                    fetchSalaries(1);
                    setShowAssignModal(false);
                }}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSalaryToDelete(null);
                }}
                onConfirm={handleDeleteSalary}
                salary={salaryToDelete}
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @media (min-width: 475px) {
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default SalaryManagement;
