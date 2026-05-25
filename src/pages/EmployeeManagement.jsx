import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBriefcase, FaCalendarAlt, FaCamera, FaCheck, FaClock, FaCog,
    FaDollarSign, FaEdit, FaEnvelope, FaEye, FaFingerprint,
    FaHandPaper, FaIdCard, FaMapMarkerAlt, FaNetworkWired, FaPhone,
    FaPlus, FaRobot, FaSave, FaSearch, FaShieldAlt, FaSpinner,
    FaTimes, FaTrash, FaUser, FaUserCheck, FaUserCircle, FaUserCog,
    FaUserTag, FaUserTie, FaChevronDown, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from '../components/SelectField';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import usePermissionAccess from '../hooks/usePermissionAccess';
import TimeDurationPickerField from '../components/TimeDurationPicker';
import Modal from '../components/Modal';
import { ManagementHub, ManagementTable, RefreshButton, ManagementCard } from '../components/common';
import ProfileAvatar from '../components/common/ProfileAvatar';
import useEmployeeNavigation from '../hooks/useEmployeeNavigation';

// ─── Constants ────────────────────────────────────────────────────────────────

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: '48px',
        backgroundColor: '#f9fafb',
        fontSize: '0.875rem',
        borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
        boxShadow: state.isFocused ? '0 0 0 4px rgba(99,102,241,0.10)' : 'none',
        '&:hover': { borderColor: '#cbd5e1' },
        borderRadius: '0.75rem',
        padding: '0 0.5rem',
    }),
    valueContainer: (base) => ({ ...base, padding: '0 14px', fontSize: '0.875rem' }),
    input: (base) => ({ ...base, margin: 0, padding: 0, fontSize: '0.875rem' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontWeight: 500, fontSize: '0.875rem' }),
    singleValue: (base) => ({ ...base, color: '#334155', fontWeight: 500, fontSize: '0.875rem' }),
    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f1f5f9' : 'white',
        color: state.isSelected ? 'white' : '#1e293b',
        '&:active': { backgroundColor: '#6366f1' },
    }),
};

const MODAL_TYPES = { NONE: 'NONE', EDIT: 'EDIT', VIEW: 'VIEW', DELETE_CONFIRM: 'DELETE_CONFIRM' };

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_SHIFT_START = '09:00:00';
const DEFAULT_SHIFT_END   = '18:00:00';
const DEFAULT_DURATION    = '00:30';

const EMPLOYEE_REQUEST_CACHE_TTL = 5000;
let constantsRequestCache        = { companyId: null, promise: null, data: null };
let permissionPackagesRequestCache = { companyId: null, promise: null, data: null };
const employeeListRequestCache   = new Map();

const getEmployeeListCacheKey = ({ companyId, page, limit, search }) =>
    `${companyId ?? 'none'}|${page}|${limit}|${search ?? ''}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeDuration = (value, fallback = null) => {
    if (value === null || typeof value === 'undefined' || value === '') return fallback;
    if (typeof value === 'number') {
        const h = Math.floor(value / 60);
        const m = value % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    if (typeof value !== 'string') return fallback;
    const [hours = '00', minutes = '00'] = value.split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatDurationDisplay = (value) => normalizeDuration(value, 'N/A');

const normalizeEmployeeRecord = (employee) => ({
    ...employee,
    profile_picture: employee?.profile_picture ?? employee?.user?.profile_picture ?? null,
    permission_package_id: employee?.permission_package_id ?? employee?.package_id ?? null,
    break_minutes: normalizeDuration(employee?.break_minutes, DEFAULT_DURATION),
    grace_minutes: normalizeDuration(employee?.grace_minutes, DEFAULT_DURATION),
});

const getIconForType = (key) => {
    const map = {
        MANUAL: FaHandPaper, GPS: FaMapMarkerAlt, FACE: FaCamera,
        QR: FaIdCard, FINGERPRINT: FaFingerprint, IP: FaNetworkWired,
    };
    return map[key] || FaUserCheck;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5 group-hover:text-indigo-500 transition-colors">
            {icon}{label}
        </label>
        <div className="text-slate-700 text-sm font-semibold truncate">{value}</div>
    </div>
);

const StatusBadge = ({ status, getStatusClassName, getStatusDisplay }) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClassName(status)}`}>
        {getStatusDisplay(status)}
    </span>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EmployeeEditModal = ({
    isOpen, selectedEmployee, formData, setFormData, constants, permissionPackages,
    designationOptions, employmentTypeOptions, salaryTypeOptions,
    attendanceMethodsConfig, handleToggleMethod, handleEdit, closeModal,
    loading, constantsLoading, permissionsLoading, updateDisabled, submitTitle,
}) => {
    const [isWeekendsOpen, setIsWeekendsOpen] = useState(false);

    const formatDisplay = (value) => {
        if (typeof value === 'object' && value !== null) return value.label || 'N/A';
        return value ? String(value).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'N/A';
    };

    const toggleWeekend = (day) => {
        setFormData(prev => {
            const current = Array.isArray(prev.weekends) ? prev.weekends : [];
            return {
                ...prev,
                weekends: current.includes(day) ? current.filter(d => d !== day) : [...current, day],
            };
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Edit Employee"
            subtitle="Update configuration and accessibility"
            icon={<FaUserCog className="h-6 w-6" />}
            size="4xl"
            footer={
                <>
                    <button type="button" onClick={closeModal} disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
                        Cancel
                    </button>
                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={loading || constantsLoading || permissionsLoading || updateDisabled}
                        title={updateDisabled ? submitTitle : ''}
                        onClick={handleEdit}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition hover:scale-[1.02] disabled:opacity-50">
                        {loading ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaSave className="h-4 w-4" />}
                        Update Employee
                    </motion.button>
                </>
            }
        >
            {(constantsLoading || permissionsLoading) ? (
                <div className="flex items-center justify-center py-16">
                    <FaSpinner className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="ml-3 text-sm font-medium text-slate-500">Loading data...</span>
                </div>
            ) : (
                <div className="space-y-6 p-2 lg:p-0">
                    {/* Employee Preview */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-lg font-bold text-emerald-700 border border-emerald-200">
                                {formData.name?.charAt(0)?.toUpperCase() || 'E'}
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-semibold text-slate-900">{formData.name || 'Employee'}</p>
                                <p className="text-sm text-slate-600">{formData.email || 'No email'}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                                        Code: {formData.employee_code || 'N/A'}
                                    </span>
                                    {selectedEmployee?.status && (
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                                            Status: {formatDisplay(selectedEmployee.status)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selects */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaUserTie className="h-4 w-4 text-indigo-500" />Designation
                            </label>
                            <Select options={designationOptions}
                                value={designationOptions.find(o => o.value === formData.designation) || null}
                                onChange={(o) => setFormData(p => ({ ...p, designation: o?.value || '' }))}
                                placeholder="Select designation" isClearable styles={customSelectStyles} />
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaShieldAlt className="h-4 w-4 text-indigo-500" />Permission Package
                            </label>
                            <Select options={permissionPackages}
                                value={formData.selectedPackage || null}
                                onChange={(o) => setFormData(p => ({ ...p, selectedPackage: o, permission_package_id: o?.value || null }))}
                                placeholder="Select permission package" isClearable styles={customSelectStyles} />
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaBriefcase className="h-4 w-4 text-indigo-500" />Employment Type
                            </label>
                            <Select options={employmentTypeOptions}
                                value={employmentTypeOptions.find(o => o.value === formData.employment_type) || null}
                                onChange={(o) => setFormData(p => ({ ...p, employment_type: o?.value || '' }))}
                                placeholder="Select employment type" isClearable styles={customSelectStyles} />
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaDollarSign className="h-4 w-4 text-indigo-500" />Salary Type
                            </label>
                            <Select options={salaryTypeOptions}
                                value={salaryTypeOptions.find(o => o.value === formData.salary_type) || null}
                                onChange={(o) => setFormData(p => ({ ...p, salary_type: o?.value || '' }))}
                                placeholder="Select salary type" isClearable styles={customSelectStyles} />
                        </div>
                    </div>

                    {/* Attendance Methods */}
                    <div className="space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaFingerprint className="h-4 w-4 text-indigo-500" />Attendance Methods
                            </label>
                            {constants.attendance_methods.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {constants.attendance_methods.map((method) => {
                                        const active = attendanceMethodsConfig[method.id]?.enabled || false;
                                        return (
                                            <button key={method.id} type="button"
                                                onClick={() => method.available && handleToggleMethod(method.id)}
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${active
                                                    ? 'border-indigo-300 bg-indigo-600 text-white shadow-sm'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                                                } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                {active && <FaCheck className="h-3 w-3" />}
                                                {method.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                    No attendance methods available.
                                </div>
                            )}
                        </div>

                        {/* Auto Approve */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <FaCheck className="h-4 w-4 text-indigo-500" />Auto Approve Attendance
                                </label>
                                <button type="button"
                                    onClick={() => setFormData(p => ({ ...p, auto_approve: !p.auto_approve }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.auto_approve ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.auto_approve ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timings & Weekends */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaClock className="h-4 w-4 text-indigo-500" />Shift Timings
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <TimeDurationPickerField label="Start Time" value={formData.shift_start}
                                    onChange={(v) => setFormData(p => ({ ...p, shift_start: v }))} mode="time" />
                                <TimeDurationPickerField label="End Time" value={formData.shift_end}
                                    onChange={(v) => setFormData(p => ({ ...p, shift_end: v }))} mode="time" />
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <FaClock className="h-4 w-4 text-indigo-500" />Duration Settings
                            </label>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <TimeDurationPickerField label="Break Minutes" value={formData.break_minutes}
                                    onChange={(v) => setFormData(p => ({ ...p, break_minutes: v }))} mode="duration" />
                                <TimeDurationPickerField label="Grace Minutes" value={formData.grace_minutes}
                                    onChange={(v) => setFormData(p => ({ ...p, grace_minutes: v }))} mode="duration" />
                            </div>
                        </div>

                        {/* Weekends */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <button type="button" onClick={() => setIsWeekendsOpen(!isWeekendsOpen)}
                                className="flex w-full items-center justify-between">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                                    <FaCalendarAlt className="h-4 w-4 text-indigo-500" />
                                    Weekends
                                    {formData.weekends?.length > 0 && (
                                        <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                                            {formData.weekends.length} Selected
                                        </span>
                                    )}
                                </label>
                                <FaChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isWeekendsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isWeekendsOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="flex flex-col gap-2 pt-4">
                                            {DAYS_OF_WEEK.map(day => {
                                                const selected = (formData.weekends || []).includes(day);
                                                return (
                                                    <button key={day} type="button" onClick={() => toggleWeekend(day)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${selected
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50'}`}>
                                                        <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${selected ? 'bg-white border-white' : 'bg-slate-100 border-slate-200'}`}>
                                                            {selected && <FaCheck className="w-2.5 h-2.5 text-indigo-600" />}
                                                        </div>
                                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const EmployeeManagement = () => {
    const navigate                    = useNavigate();
    const navigateToEmployeeProfile   = useEmployeeNavigation();
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();

    const [employees, setEmployees]         = useState([]);
    const [constants, setConstants]         = useState({
        employment_types: [], salary_types: [], designations: [],
        employment_status: [], attendance_methods: [],
    });
    const [permissionPackages, setPermissionPackages] = useState([]);
    const [loading, setLoading]                       = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [constantsLoading, setConstantsLoading]     = useState(false);
    const [modalType, setModalType]                   = useState(MODAL_TYPES.NONE);
    const [selectedEmployee, setSelectedEmployee]     = useState(null);
    const [activeActionMenu, setActiveActionMenu]     = useState(null);
    const [viewMode, setViewMode]                     = useState('table');
    const [showPermissions, setShowPermissions]       = useState(false);
    const [searchTerm, setSearchTerm]                 = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '', designation: '', email: '', phone: '', employee_code: '',
        employment_type: '', salary_type: '', joining_date: '', status: '',
        permission_package_id: null, attendance_methods: [], auto_approve: false,
        shift_start: DEFAULT_SHIFT_START, shift_end: DEFAULT_SHIFT_END,
        break_minutes: DEFAULT_DURATION, grace_minutes: DEFAULT_DURATION, weekends: [],
    });

    const [attendanceMethodsConfig, setAttendanceMethodsConfig] = useState({});

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 20);

    const constantsFetched    = useRef(false);
    const permissionsFetched  = useRef(false);
    const isMounted           = useRef(true);
    const fetchInProgress     = useRef(false);
    const initialFetchDone    = useRef(false);
    const isInitialLoad       = useRef(true);

    const updateEmployeeAccess = checkActionAccess('employeeManagement', 'update');
    const deleteEmployeeAccess = checkActionAccess('employeeManagement', 'delete');
    const readEmployeeAccess   = checkActionAccess('employeeManagement', 'read');

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        Promise.all([fetchConstants(), fetchPermissionPackages()]).catch(console.error);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current && debouncedSearchTerm !== undefined) {
            if (pagination.page !== 1) goToPage(1);
            else fetchEmployees(1);
        }
    }, [debouncedSearchTerm]);

    // ─── API Calls ────────────────────────────────────────────────────────────

    const fetchConstants = useCallback(async () => {
        if (constantsFetched.current) return;
        setConstantsLoading(true);
        try {
            const company   = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;

            if (constantsRequestCache.companyId === companyId && constantsRequestCache.data) {
                setConstants(constantsRequestCache.data);
                constantsFetched.current = true;
                return;
            }
            if (constantsRequestCache.companyId !== companyId) {
                constantsRequestCache = { companyId, promise: null, data: null };
            }
            if (!constantsRequestCache.promise) {
                constantsRequestCache.promise = (async () => {
                    const response = await apiCall('/constants/', 'GET', null, companyId);
                    const result   = await response.json();
                    if (!result.success) throw new Error(result.message || 'Failed to load constants');
                    const d = result.data;
                    const mapped = {
                        employment_types:    d.employment_types?.map(i => ({ value: i.value.value, key: i.key, label: i.value.label, description: i.value.description })) || [],
                        salary_types:        d.salary_types?.map(i => ({ value: i.value.value, key: i.key, label: i.value.label, description: i.value.description })) || [],
                        designations:        d.designations?.map(i => ({ value: i.value.value, key: i.key, label: i.value.label, description: i.value.description })) || [],
                        employment_status:   d.employment_status?.map(i => ({ value: i.value.value, key: i.key, label: i.value.label, description: i.value.description })) || [],
                        attendance_methods:  d.attendance_methods?.map(i => ({
                            id: i.key.toLowerCase(), name: i.value.label, icon: getIconForType(i.key),
                            description: i.value.description, available: i.value.is_available,
                            requiresDevice: i.value.requiresDevice || false,
                        })) || [],
                    };
                    constantsRequestCache = { companyId, promise: null, data: mapped };
                    return mapped;
                })().catch(e => { constantsRequestCache = { companyId, promise: null, data: null }; throw e; });
            }
            const mapped = await constantsRequestCache.promise;
            setConstants(mapped);
            constantsFetched.current = true;
        } catch (e) {
            console.error(e);
            toast.error('Failed to load constants');
        } finally { setConstantsLoading(false); }
    }, []);

    const fetchPermissionPackages = useCallback(async () => {
        if (permissionsFetched.current) return;
        setPermissionsLoading(true);
        try {
            const company   = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;

            if (permissionPackagesRequestCache.companyId === companyId && permissionPackagesRequestCache.data) {
                setPermissionPackages(permissionPackagesRequestCache.data);
                permissionsFetched.current = true;
                return;
            }
            if (permissionPackagesRequestCache.companyId !== companyId) {
                permissionPackagesRequestCache = { companyId, promise: null, data: null };
            }
            if (!permissionPackagesRequestCache.promise) {
                permissionPackagesRequestCache.promise = (async () => {
                    const response = await apiCall('/permissions/permission-packages', 'GET', null, companyId);
                    const result   = await response.json();
                    if (!result.success) throw new Error(result.message || 'Failed to load permission packages');
                    const packages = (result.data?.packages || []).map(pkg => ({
                        value: pkg.id, label: pkg.package_name, description: pkg.description,
                        groupCode: pkg.group_code,
                        permissions: pkg.permissions?.filter(p => p.is_active === 1) || [],
                        isActive: pkg.is_active === 1,
                    }));
                    permissionPackagesRequestCache = { companyId, promise: null, data: packages };
                    return packages;
                })().catch(e => { permissionPackagesRequestCache = { companyId, promise: null, data: null }; throw e; });
            }
            const packages = await permissionPackagesRequestCache.promise;
            setPermissionPackages(packages);
            permissionsFetched.current = true;
        } catch (e) {
            console.error(e);
            toast.error('Failed to load permission packages');
        } finally { setPermissionsLoading(false); }
    }, []);

    const fetchEmployees = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        try {
            const company   = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;
            const params    = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

            const requestKey  = getEmployeeListCacheKey({ companyId, page, limit: pagination.limit, search: debouncedSearchTerm });
            const cachedEntry = employeeListRequestCache.get(requestKey);
            let result;

            if (cachedEntry?.data && cachedEntry.expiresAt > Date.now()) {
                result = cachedEntry.data;
            } else if (cachedEntry?.promise) {
                result = await cachedEntry.promise;
            } else {
                const requestPromise = (async () => {
                    const response = await apiCall(`/employees/list?${params}`, 'GET', null, companyId);
                    const json     = await response.json();
                    if (!json.success) throw new Error(json.message || 'Failed to fetch employees');
                    employeeListRequestCache.set(requestKey, { data: json, expiresAt: Date.now() + EMPLOYEE_REQUEST_CACHE_TTL });
                    return json;
                })().catch(e => { employeeListRequestCache.delete(requestKey); throw e; });
                employeeListRequestCache.set(requestKey, { promise: requestPromise });
                result = await requestPromise;
            }

            if (result.success) {
                const normalizedEmployees = (result.data || []).map(normalizeEmployeeRecord);
                setEmployees(normalizedEmployees);
                const meta       = result.pagination || result.meta || {};
                const totalPages = meta.total_pages || Math.max(1, Math.ceil((meta.total || normalizedEmployees.length || 0) / (meta.limit || pagination.limit)));
                updatePagination({
                    page: meta.page || page, limit: meta.limit || pagination.limit,
                    total: meta.total || normalizedEmployees.length || 0,
                    total_pages: totalPages,
                    is_last_page: meta.is_last_page ?? (meta.page || page) >= totalPages,
                });
            } else {
                throw new Error(result.message || 'Failed to fetch employees');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch employees');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current   = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) { fetchEmployees(1, true); initialFetchDone.current = true; }
    }, [fetchEmployees]);

    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchEmployees(pagination.page, true);
        }
    }, [pagination.page, fetchEmployees]);

    const updateEmployee = async (id, employeeData) => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const enabledMethods = Object.entries(attendanceMethodsConfig)
                .filter(([, c]) => c?.enabled && c?.available !== false)
                .map(([methodId]) => methodId);
            const payload = {
                employee_id: id, designation: employeeData.designation,
                employment_type: employeeData.employment_type, salary_type: employeeData.salary_type,
                permission_package_id: employeeData.permission_package_id,
                attendance_methods: enabledMethods, auto_approve: employeeData.auto_approve ?? false,
                shift_start: employeeData.shift_start, shift_end: employeeData.shift_end,
                break_minutes: employeeData.break_minutes, grace_minutes: employeeData.grace_minutes,
                weekends: employeeData.weekends,
            };
            const response = await apiCall('/employees/update', 'PUT', payload, company?.id);
            const result   = await response.json();
            if (result.success) { employeeListRequestCache.clear(); await fetchEmployees(pagination.page, false); return { success: true }; }
            throw new Error(result.message || 'Update failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally { setLoading(false); }
    };

    const deleteEmployee = async (id) => {
        setLoading(true);
        try {
            const company  = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/employees/delete', 'DELETE', { id }, company?.id);
            const result   = await response.json();
            if (result.success) { employeeListRequestCache.clear(); await fetchEmployees(pagination.page, false); return { success: true }; }
            throw new Error(result.message || 'Delete failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally { setLoading(false); }
    };

    // ─── Modal Handlers ───────────────────────────────────────────────────────

    const openEditModal = async (employee) => {
        if (updateEmployeeAccess.disabled) return;
        setConstantsLoading(true);
        setPermissionsLoading(true);
        try {
            if (!constantsFetched.current)   await fetchConstants();
            if (!permissionsFetched.current) await fetchPermissionPackages();

            const norm = normalizeEmployeeRecord(employee);
            setSelectedEmployee(norm);

            const initialConfig = {};
            constants.attendance_methods.forEach(m => {
                initialConfig[m.id] = { enabled: false, available: m.available };
            });
            if (employee.attendance_methods?.length) {
                employee.attendance_methods.forEach(m => {
                    const id = m.method.toLowerCase();
                    if (initialConfig[id]) initialConfig[id] = { ...initialConfig[id], enabled: true };
                });
            }
            setAttendanceMethodsConfig(initialConfig);

            const selectedPackage   = permissionPackages.find(p => p.value === (norm.permission_package_id || norm.package_id));
            const rawWeekends       = norm.weekends;
            const normalizedWeekends = Array.isArray(rawWeekends)
                ? rawWeekends.map(w => (typeof w === 'string' ? w : w?.day)).filter(Boolean)
                : [];

            setFormData({
                name:                 norm.name || '',
                designation:          typeof norm.designation === 'object' ? norm.designation?.value : (norm.designation || ''),
                email:                norm.email || '',
                phone:                norm.phone || '',
                employee_code:        norm.employee_code || '',
                employment_type:      typeof norm.employment_type === 'object' ? norm.employment_type?.value : (norm.employment_type || ''),
                salary_type:          typeof norm.salary_type === 'object' ? norm.salary_type?.value : (norm.salary_type || ''),
                joining_date:         norm.joining_date ? new Date(norm.joining_date).toISOString().split('T')[0] : '',
                status:               typeof norm.status === 'object' ? norm.status?.value : (norm.status || ''),
                permission_package_id: norm.permission_package_id || norm.package_id || null,
                selectedPackage:      selectedPackage || null,
                auto_approve:         norm.auto_approve ?? false,
                shift_start:          norm.shift_start || DEFAULT_SHIFT_START,
                shift_end:            norm.shift_end || DEFAULT_SHIFT_END,
                break_minutes:        normalizeDuration(norm.break_minutes, DEFAULT_DURATION),
                grace_minutes:        normalizeDuration(norm.grace_minutes, DEFAULT_DURATION),
                weekends:             normalizedWeekends,
            });

            setModalType(MODAL_TYPES.EDIT);
            setActiveActionMenu(null);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load edit data');
        } finally {
            setConstantsLoading(false);
            setPermissionsLoading(false);
        }
    };

    const openViewModal = (emp) => {
        setShowPermissions(false);
        setSelectedEmployee(normalizeEmployeeRecord(emp));
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };

    const openEmployeeProfile = (employee) => {
        if (readEmployeeAccess.disabled || !employee?.id) return;
        setActiveActionMenu(null);
        navigate(`/employee-profile/${employee.id}`);
    };

    const openDeleteModal = (emp) => {
        if (deleteEmployeeAccess.disabled) return;
        setSelectedEmployee(emp);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };

    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedEmployee(null);
        setShowPermissions(false);
        setAttendanceMethodsConfig({});
        setFormData({
            name: '', designation: '', email: '', phone: '', employee_code: '',
            employment_type: '', salary_type: '', joining_date: '', status: '',
            permission_package_id: null, selectedPackage: null, attendance_methods: [],
            auto_approve: false, shift_start: DEFAULT_SHIFT_START, shift_end: DEFAULT_SHIFT_END,
            break_minutes: DEFAULT_DURATION, grace_minutes: DEFAULT_DURATION, weekends: [],
        });
    };

    // ─── Form Handlers ────────────────────────────────────────────────────────

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        const enabled = Object.entries(attendanceMethodsConfig).filter(([, c]) => c?.enabled && c?.available !== false);
        if (enabled.length === 0) { toast.warning('Please enable at least one attendance method'); return; }
        const result = await updateEmployee(selectedEmployee.id, {
            designation: formData.designation, employment_type: formData.employment_type,
            salary_type: formData.salary_type, permission_package_id: formData.permission_package_id,
            auto_approve: formData.auto_approve, shift_start: formData.shift_start,
            shift_end: formData.shift_end, break_minutes: formData.break_minutes,
            grace_minutes: formData.grace_minutes, weekends: formData.weekends,
        });
        if (result.success) { toast.success('Employee updated successfully!'); closeModal(); }
        else toast.error(result.error || 'Failed to update employee');
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;
        const result = await deleteEmployee(selectedEmployee.id);
        if (result.success) { toast.success('Employee deleted successfully!'); closeModal(); }
        else toast.error(result.error || 'Failed to delete employee');
    };

    const handleToggleMethod = (methodId) => {
        setAttendanceMethodsConfig(prev => ({
            ...prev,
            [methodId]: { ...prev[methodId], enabled: !prev[methodId]?.enabled },
        }));
    };

    // ─── Display Helpers ──────────────────────────────────────────────────────

    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDesignationDisplay = useCallback((v) => {
        if (typeof v === 'object' && v !== null) return v.label || 'N/A';
        return constants.designations?.find(x => x.value === v)?.label || v || 'N/A';
    }, [constants.designations]);

    const getEmploymentTypeDisplay = useCallback((v) => {
        if (typeof v === 'object' && v !== null) return v.label || 'N/A';
        return constants.employment_types?.find(x => x.value === v)?.label || v || 'N/A';
    }, [constants.employment_types]);

    const getSalaryTypeDisplay = useCallback((v) => {
        if (typeof v === 'object' && v !== null) return v.label || 'N/A';
        return constants.salary_types?.find(x => x.value === v)?.label || v || 'N/A';
    }, [constants.salary_types]);

    const getStatusDisplay = useCallback((v) => {
        if (typeof v === 'object' && v !== null) return v.label || 'N/A';
        return constants.employment_status?.find(x => x.value === v)?.label || v || 'N/A';
    }, [constants.employment_status]);

    const getStatusClassName = useCallback((v) => {
        const val = typeof v === 'object' && v !== null ? v.value : v;
        return {
            active:    'bg-green-100 text-green-800 border border-green-200',
            inactive:  'bg-gray-100 text-gray-800 border border-gray-200',
            suspended: 'bg-red-100 text-red-800 border border-red-200',
            on_leave:  'bg-yellow-100 text-yellow-800 border border-yellow-200',
        }[val] || 'bg-gray-100 text-gray-800 border border-gray-200';
    }, []);

    // ─── Memoised Options ─────────────────────────────────────────────────────

    const designationOptions    = useMemo(() => constants.designations?.map(d => ({ value: d.value, label: d.label, description: d.description })) || [], [constants.designations]);
    const employmentTypeOptions  = useMemo(() => constants.employment_types?.map(t => ({ value: t.value, label: t.label, description: t.description })) || [], [constants.employment_types]);
    const salaryTypeOptions      = useMemo(() => constants.salary_types?.map(t => ({ value: t.value, label: t.label, description: t.description })) || [], [constants.salary_types]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // ─── Per-row action builder ───────────────────────────────────────────────

    const getRowActions = useCallback((emp) => [
        {
            label: 'View Details', icon: <FaEye size={14} />,
            onClick: () => openViewModal(emp),
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        },
        {
            label: 'Profile', icon: <FaUserCircle size={14} />,
            onClick: () => openEmployeeProfile(emp),
            disabled: readEmployeeAccess.disabled,
            title: readEmployeeAccess.disabled ? getAccessMessage(readEmployeeAccess) : '',
            className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50',
        },
        {
            label: 'Edit', icon: <FaEdit size={14} />,
            onClick: () => openEditModal(emp),
            disabled: updateEmployeeAccess.disabled,
            title: updateEmployeeAccess.disabled ? getAccessMessage(updateEmployeeAccess) : '',
            className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
        },
        {
            label: 'Delete', icon: <FaTrash size={14} />,
            onClick: () => openDeleteModal(emp),
            disabled: deleteEmployeeAccess.disabled,
            title: deleteEmployeeAccess.disabled ? getAccessMessage(deleteEmployeeAccess) : '',
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
        },
    ], [readEmployeeAccess, updateEmployeeAccess, deleteEmployeeAccess]);

    // ─── Table column definitions ─────────────────────────────────────────────

    const tableColumns = useMemo(() => [
        {
            key: 'name',
            label: 'Employee',
            render: (emp) => (
                <div className="flex items-center gap-3">
                    <ProfileAvatar record={emp} name={emp.name}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-100 overflow-hidden shrink-0"
                        onClick={(e) => { e.stopPropagation(); navigateToEmployeeProfile(emp.id); }}>
                        <FaUser className="text-purple-500 text-sm" />
                    </ProfileAvatar>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-[160px] hover:text-indigo-600 cursor-pointer transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigateToEmployeeProfile(emp.id); }}>
                            {emp.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">{emp.employee_code}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'designation',
            label: 'Designation',
            render: (emp) => (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    {getDesignationDisplay(emp.designation)}
                </span>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (emp) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <FaEnvelope className="text-gray-400 text-xs shrink-0" />
                    <span className="truncate max-w-[160px]">{emp.email}</span>
                </div>
            ),
        },
        {
            key: 'employment_type',
            label: 'Type',
            render: (emp) => (
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                    {getEmploymentTypeDisplay(emp.employment_type)}
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (emp) => (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClassName(emp.status)}`}>
                    {getStatusDisplay(emp.status)}
                </span>
            ),
        },
        {
            key: 'joining_date',
            label: 'Joined',
            render: (emp) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <FaCalendarAlt className="text-gray-400 text-xs shrink-0" />
                    {formatDate(emp.joining_date)}
                </div>
            ),
        },
    ], [getDesignationDisplay, getEmploymentTypeDisplay, getStatusDisplay, getStatusClassName, navigateToEmployeeProfile]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ManagementHub
            eyebrow={<><FaUserCircle size={11} /> Employee management</>}
            title="Employee Management"
            description="Directory of all staff members with profile management and status tracking."
            accent="blue"
            summary={
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
                    <FaUserCircle className="text-blue-500" />
                    <span className="font-medium text-gray-700">{pagination.total}</span>
                    <span className="text-gray-500">Employees</span>
                </div>
            }
            actions={
                <RefreshButton loading={loading} onClick={() => fetchEmployees(pagination.page, true)}>
                    Refresh
                </RefreshButton>
            }
        >
            <div className="space-y-6">

                {/* ── Filter & View Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Search employees by name, email, or code..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm min-h-[42px]"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>
                        <div className="hidden lg:block h-8 w-px bg-gray-200 mx-1" />
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                </motion.div>

                {/* ── Loading skeleton ── */}
                {loading && !employees.length && <SkeletonComponent />}

                {/* ── Empty state ── */}
                {!loading && employees.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-xl shadow-xl">
                        <FaUserCircle className="text-8xl text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">No employees found</p>
                        <p className="text-gray-400 mt-2">Try adjusting your search or add new employees</p>
                    </motion.div>
                )}

                {/* ── Table / Card views ── */}
                {!loading && employees.length > 0 && (
                    <>
                        {/* TABLE VIEW — uses ManagementTable */}
                        {viewMode === 'table' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <ManagementTable
                                    rows={employees}
                                    columns={tableColumns}
                                    rowKey="id"
                                    onRowClick={(emp) => openEmployeeProfile(emp)}
                                    getActions={getRowActions}
                                    activeId={activeActionMenu}
                                    onToggleAction={(e, id) => setActiveActionMenu(cur => cur === id ? null : id)}
                                    accent="blue"
                                    emptyState={
                                        <div className="text-center py-16">
                                            <FaUserCircle className="text-6xl text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No employees found</p>
                                        </div>
                                    }
                                />
                            </motion.div>
                        )}

                        {/* CARD VIEW — uses ManagementCard */}
                        {viewMode === 'card' && (
                            <ManagementGrid viewMode={viewMode}>
                                {employees.map((emp, index) => (
                                    <ManagementCard
                                        key={emp.id}
                                        delay={index * 0.04}
                                        accent="blue"
                                        hoverable
                                        onClick={() => openEmployeeProfile(emp)}
                                        menuId={`emp-card-${emp.id}`}
                                        activeId={activeActionMenu}
                                        onToggle={(e, id) => { e.stopPropagation(); setActiveActionMenu(cur => cur === id ? null : id); }}
                                        actions={getRowActions(emp)}
                                        eyebrow={emp.employee_code}
                                        icon={
                                            <ProfileAvatar record={emp} name={emp.name}
                                                className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden"
                                                onClick={(e) => { e.stopPropagation(); navigateToEmployeeProfile(emp.id); }}>
                                                <FaUserCircle className="text-white text-base" />
                                            </ProfileAvatar>
                                        }
                                        title={emp.name}
                                        subtitle={getDesignationDisplay(emp.designation)}
                                        badge={
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusClassName(emp.status)}`}>
                                                {getStatusDisplay(emp.status)}
                                            </span>
                                        }
                                        footer={
                                            <>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <FaUserTag className="text-purple-400" />
                                                    {getEmploymentTypeDisplay(emp.employment_type)}
                                                </span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                    <FaCalendarAlt className="text-green-400" />
                                                    {formatDate(emp.joining_date)}
                                                </span>
                                            </>
                                        }
                                    >
                                        {/* Card body details */}
                                        <div className="mt-1 space-y-1.5">
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <FaEnvelope className="text-gray-400 shrink-0" />
                                                <span className="truncate">{emp.email}</span>
                                            </p>
                                            {emp.phone && (
                                                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                    <FaPhone className="text-gray-400 shrink-0" />
                                                    {emp.phone}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <FaDollarSign className="text-gray-400 shrink-0" />
                                                {getSalaryTypeDisplay(emp.salary_type)}
                                            </p>
                                        </div>
                                    </ManagementCard>
                                ))}
                            </ManagementGrid>
                        )}

                        {/* Pagination */}
                        <Pagination
                            currentPage={pagination.page}
                            totalItems={pagination.total}
                            itemsPerPage={pagination.limit}
                            onPageChange={handlePageChange}
                            onLimitChange={changeLimit}
                            showInfo={true}
                        />
                    </>
                )}
            </div>

            {/* ── Modals ── */}
            <AnimatePresence>

                {/* VIEW MODAL */}
                <Modal
                    key={MODAL_TYPES.VIEW}
                    isOpen={modalType === MODAL_TYPES.VIEW && !!selectedEmployee}
                    onClose={closeModal}
                    title="Employee Details"
                    subtitle="Comprehensive profile overview"
                    icon={<FaInfoCircle className="h-6 w-6" />}
                    size="4xl"
                    footer={
                        <>
                            <button onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                Close
                            </button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => openEditModal(selectedEmployee)}
                                disabled={updateEmployeeAccess.disabled}
                                title={updateEmployeeAccess.disabled ? getAccessMessage(updateEmployeeAccess) : ''}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition disabled:opacity-50">
                                <FaEdit className="h-4 w-4" />Edit Details
                            </motion.button>
                        </>
                    }
                >
                    {selectedEmployee && (
                        <div className="space-y-4">
                            {/* Profile card */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <ProfileAvatar record={selectedEmployee} name={selectedEmployee.name}
                                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg overflow-hidden">
                                        {selectedEmployee.name?.charAt(0).toUpperCase()}
                                    </ProfileAvatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 truncate">{selectedEmployee.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                                                {getDesignationDisplay(selectedEmployee.designation)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getStatusClassName(selectedEmployee.status)}`}>
                                                {getStatusDisplay(selectedEmployee.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <InfoItem icon={<FaIdCard />}       label="Employee Code"  value={selectedEmployee.employee_code} />
                                <InfoItem icon={<FaEnvelope />}     label="Email Address"  value={selectedEmployee.email} />
                                <InfoItem icon={<FaPhone />}        label="Phone Number"   value={selectedEmployee.phone || 'N/A'} />
                                <InfoItem icon={<FaBriefcase />}    label="Employment"     value={getEmploymentTypeDisplay(selectedEmployee.employment_type)} />
                                <InfoItem icon={<FaDollarSign />}   label="Salary Type"    value={getSalaryTypeDisplay(selectedEmployee.salary_type)} />
                                <InfoItem icon={<FaCalendarAlt />}  label="Joining Date"   value={formatDate(selectedEmployee.joining_date)} />
                            </div>

                            {/* Work Schedule */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FaClock className="text-indigo-500" />Work Schedule
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Shift Hours', value: `${selectedEmployee.shift_start || 'N/A'} – ${selectedEmployee.shift_end || 'N/A'}` },
                                        { label: 'Break Time',  value: formatDurationDisplay(selectedEmployee.break_minutes) },
                                        { label: 'Grace Period', value: formatDurationDisplay(selectedEmployee.grace_minutes) },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">{label}</span>
                                            <span className="text-xs font-bold text-slate-700">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Permission Package (collapsible) */}
                            {selectedEmployee.package_name && (
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 overflow-hidden">
                                    <button onClick={() => setShowPermissions(!showPermissions)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <FaShieldAlt className="text-indigo-500" />Security & Access
                                        </h4>
                                        <motion.div animate={{ rotate: showPermissions ? 180 : 0 }} transition={{ duration: 0.2 }}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                            <FaChevronDown size={10} />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {showPermissions && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="px-4 pb-4">
                                                    <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-bold text-slate-700">{selectedEmployee.package_name}</span>
                                                            {selectedEmployee.group_code && (
                                                                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">
                                                                    {selectedEmployee.group_code}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {selectedEmployee.permissions?.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {selectedEmployee.permissions.map((perm, idx) => (
                                                                    <span key={idx} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100">
                                                                        {perm.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] text-slate-400 italic">No specific permissions assigned</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Attendance methods & Weekends */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedEmployee.attendance_methods?.length > 0 && (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FaUserCheck className="text-blue-500" />Attendance Methods
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedEmployee.attendance_methods.map((method, idx) => (
                                                <div key={idx} className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5 capitalize">
                                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                    {method.method}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedEmployee.weekends?.length > 0 && (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FaCalendarAlt className="text-purple-500" />Weekly Holidays
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedEmployee.weekends.map((w, idx) => {
                                                const dayName = typeof w === 'string' ? w : w?.day;
                                                return (
                                                    <div key={idx} className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5 capitalize">
                                                        <div className="w-1 h-1 rounded-full bg-purple-500" />
                                                        {dayName}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>

                {/* EDIT MODAL */}
                <EmployeeEditModal
                    key={MODAL_TYPES.EDIT}
                    isOpen={modalType === MODAL_TYPES.EDIT}
                    selectedEmployee={selectedEmployee}
                    formData={formData}
                    setFormData={setFormData}
                    constants={constants}
                    permissionPackages={permissionPackages}
                    designationOptions={designationOptions}
                    employmentTypeOptions={employmentTypeOptions}
                    salaryTypeOptions={salaryTypeOptions}
                    attendanceMethodsConfig={attendanceMethodsConfig}
                    handleToggleMethod={handleToggleMethod}
                    handleEdit={handleEdit}
                    closeModal={closeModal}
                    loading={loading}
                    constantsLoading={constantsLoading}
                    permissionsLoading={permissionsLoading}
                    updateDisabled={updateEmployeeAccess.disabled}
                    submitTitle={updateEmployeeAccess.disabled ? getAccessMessage(updateEmployeeAccess) : ''}
                />

                {/* DELETE MODAL */}
                <Modal
                    key={MODAL_TYPES.DELETE_CONFIRM}
                    isOpen={modalType === MODAL_TYPES.DELETE_CONFIRM && !!selectedEmployee}
                    onClose={closeModal}
                    title="Confirm Delete"
                    subtitle="This action cannot be undone"
                    icon={<FaTrash className="h-6 w-6" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleDelete}
                                disabled={loading || deleteEmployeeAccess.disabled}
                                title={deleteEmployeeAccess.disabled ? getAccessMessage(deleteEmployeeAccess) : ''}
                                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                Delete Employee
                            </button>
                        </>
                    }
                >
                    {selectedEmployee && (
                        <div className="text-center py-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}
                                className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-4xl text-red-600" />
                            </motion.div>
                            <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                            <p className="text-gray-500">
                                You are about to delete{' '}
                                <span className="font-semibold text-red-600">{selectedEmployee.name}</span>.
                                {' '}This action cannot be undone.
                            </p>
                        </div>
                    )}
                </Modal>
            </AnimatePresence>
        </ManagementHub>
    );
};

export default EmployeeManagement;
