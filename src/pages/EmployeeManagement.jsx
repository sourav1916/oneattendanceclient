import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle,
    FaSearch, FaSpinner, FaEllipsisV,
    FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt, FaBriefcase,
    FaDollarSign, FaUserTag, FaShieldAlt, FaBan, FaTrashAlt,
    FaInfoCircle, FaPlus, FaUserTie, FaUserCheck, FaRobot, FaHandPaper,
    FaCamera, FaMapMarkerAlt, FaWifi, FaFingerprint, FaNetworkWired, FaSave
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
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

const INTERNAL_METHOD_OPTIONS = [
    { value: 'manual', label: 'Manual', icon: FaHandPaper, description: 'Staff marks manually' },
    { value: 'auto', label: 'Auto', icon: FaRobot, description: 'Automatic detection' }
];

const EMPLOYEE_REQUEST_CACHE_TTL = 5000;
let constantsRequestCache = { companyId: null, promise: null, data: null };
let permissionPackagesRequestCache = { companyId: null, promise: null, data: null };
const employeeListRequestCache = new Map();

const getEmployeeListCacheKey = ({ companyId, page, limit, search }) =>
    `${companyId ?? 'none'}|${page}|${limit}|${search ?? ''}`;

// ─── Helper Components ───────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">{icon}{label}</label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [constants, setConstants] = useState({
        employment_types: [],
        salary_types: [],
        designations: [],
        employment_status: [],
        attendance_methods: []
    });
    const [permissionPackages, setPermissionPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [constantsLoading, setConstantsLoading] = useState(false);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [formData, setFormData] = useState({
        name: '', designation: '', email: '', phone: '',
        employee_code: '', employment_type: '', salary_type: '',
        joining_date: '', status: '', permission_package_id: null,
        attendance_methods: []
    });

    const [attendanceMethodsConfig, setAttendanceMethodsConfig] = useState({});

    const {
        pagination,
        updatePagination,
        goToPage,
    } = usePagination(1, 20);

    const constantsFetched = useRef(false);
    const permissionsFetched = useRef(false);
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const getIconForType = (key) => {
        const iconMap = {
            MANUAL: FaHandPaper,
            GPS: FaMapMarkerAlt,
            FACE: FaCamera,
            QR: FaIdCard,
            FINGERPRINT: FaFingerprint,
            IP: FaNetworkWired
        };
        return iconMap[key] || FaUserCheck;
    };

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const load = async () => {
            try { await Promise.all([fetchConstants(), fetchPermissionPackages()]); }
            catch (e) { console.error(e); }
        };
        load();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current && debouncedSearchTerm !== undefined) {
            if (pagination.page !== 1) {
                goToPage(1);
            } else {
                fetchEmployees(1);
            }
        }
    }, [debouncedSearchTerm]);

    // ─── API Calls ────────────────────────────────────────────────────────────────

    const fetchConstants = useCallback(async () => {
        if (constantsFetched.current) return;
        setConstantsLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
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
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message || 'Failed to load constants');
                    }

                    const data = result.data;
                    const mappedConstants = {
                        employment_types: data.employment_types?.map(item => ({
                            value: item.value.value,
                            key: item.key,
                            label: item.value.label,
                            description: item.value.description
                        })) || [],
                        salary_types: data.salary_types?.map(item => ({
                            value: item.value.value,
                            key: item.key,
                            label: item.value.label,
                            description: item.value.description
                        })) || [],
                        designations: data.designations?.map(item => ({
                            value: item.value.value,
                            key: item.key,
                            label: item.value.label,
                            description: item.value.description
                        })) || [],
                        employment_status: data.employment_status?.map(item => ({
                            value: item.value.value,
                            key: item.key,
                            label: item.value.label,
                            description: item.value.description
                        })) || [],
                        attendance_methods: data.attendance_methods?.map(item => ({
                            id: item.key.toLowerCase(),
                            name: item.value.label,
                            icon: getIconForType(item.key),
                            description: item.value.description,
                            available: item.value.is_available,
                            requiresDevice: item.value.requiresDevice || false,
                            requiresLocation: item.value.requiresLocation || false,
                            requiresCamera: item.value.requiresCamera || false
                        })) || []
                    };

                    constantsRequestCache = {
                        companyId,
                        promise: null,
                        data: mappedConstants
                    };

                    return mappedConstants;
                })().catch((error) => {
                    constantsRequestCache = { companyId, promise: null, data: null };
                    throw error;
                });
            }

            const mappedConstants = await constantsRequestCache.promise;
            setConstants(mappedConstants);
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
            const company = JSON.parse(localStorage.getItem('company'));
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
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message || 'Failed to load permission packages');
                    }

                    const packages = (result.data?.packages || []).map(pkg => ({
                        value: pkg.id,
                        label: pkg.package_name,
                        description: pkg.description,
                        groupCode: pkg.group_code,
                        permissions: pkg.permissions?.filter(p => p.is_active === 1) || [],
                        isActive: pkg.is_active === 1
                    }));

                    permissionPackagesRequestCache = {
                        companyId,
                        promise: null,
                        data: packages
                    };

                    return packages;
                })().catch((error) => {
                    permissionPackagesRequestCache = { companyId, promise: null, data: null };
                    throw error;
                });
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
            const company = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

            const requestKey = getEmployeeListCacheKey({
                companyId,
                page,
                limit: pagination.limit,
                search: debouncedSearchTerm
            });
            const cachedEntry = employeeListRequestCache.get(requestKey);
            let result;

            if (cachedEntry?.data && cachedEntry.expiresAt > Date.now()) {
                result = cachedEntry.data;
            } else if (cachedEntry?.promise) {
                result = await cachedEntry.promise;
            } else {
                const requestPromise = (async () => {
                    const response = await apiCall(`/employees/list?${params}`, 'GET', null, companyId);
                    const json = await response.json();
                    if (!json.success) {
                        throw new Error(json.message || 'Failed to fetch employees');
                    }
                    employeeListRequestCache.set(requestKey, {
                        data: json,
                        expiresAt: Date.now() + EMPLOYEE_REQUEST_CACHE_TTL
                    });
                    return json;
                })().catch((error) => {
                    employeeListRequestCache.delete(requestKey);
                    throw error;
                });

                employeeListRequestCache.set(requestKey, { promise: requestPromise });
                result = await requestPromise;
            }

            if (result.success) {
                setEmployees(result.data);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? (page === result.pagination?.total_pages)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch employees');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch employees');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm, updatePagination]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchEmployees(1, true);
            initialFetchDone.current = true;
        }
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
                .filter(([, config]) => config?.enabled && config?.available !== false);

            const payload = {
                employee_id: id,
                designation: employeeData.designation,
                salary_type: employeeData.salary_type,
                employment_type: employeeData.employment_type,
                permission_package_id: employeeData.permission_package_id || null,
                attendance_methods: enabledMethods.map(([methodId, config]) => ({
                    method: methodId,
                    is_manual: config.internalMethods.includes("manual") ? 1 : 0,
                    is_auto: config.internalMethods.includes("auto") ? 1 : 0,
                }))
            };

            const response = await apiCall('/employees/update', 'PUT', payload, company?.id);
            const result = await response.json();
            if (result.success) {
                employeeListRequestCache.clear();
                await fetchEmployees(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Update failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally { setLoading(false); }
    };

    const deleteEmployee = async (id) => {
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/employees/delete', 'DELETE', { id }, company?.id);
            const result = await response.json();
            if (result.success) {
                employeeListRequestCache.clear();
                await fetchEmployees(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Delete failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally { setLoading(false); }
    };

    // ─── Modal Handlers ──────────────────────────────────────────────────────

    const openEditModal = async (employee) => {
        setConstantsLoading(true);
        setPermissionsLoading(true);
        try {
            if (!constantsFetched.current) await fetchConstants();
            if (!permissionsFetched.current) await fetchPermissionPackages();

            setSelectedEmployee(employee);

            // Initialize attendance methods config
            const initialConfig = {};
            constants.attendance_methods.forEach(method => {
                initialConfig[method.id] = {
                    enabled: false,
                    internalMethods: [],
                    available: method.available
                };
            });

            // Load attendance methods from employee data
            if (employee.attendance_methods && employee.attendance_methods.length > 0) {
                employee.attendance_methods.forEach(method => {
                    const methodId = method.method.toLowerCase();
                    if (initialConfig[methodId]) {
                        const internalMethods = [];
                        if (method.is_manual === true || method.is_manual === 1) internalMethods.push("manual");
                        if (method.is_auto === true || method.is_auto === 1) internalMethods.push("auto");

                        initialConfig[methodId] = {
                            ...initialConfig[methodId],
                            enabled: true,
                            internalMethods: internalMethods
                        };
                    }
                });
            }

            setAttendanceMethodsConfig(initialConfig);

            // Find the permission package
            const selectedPackage = permissionPackages.find(p => p.value === employee.package_id);

            setFormData({
                name: employee.name || '',
                designation: employee.designation || '',
                email: employee.email || '',
                phone: employee.phone || '',
                employee_code: employee.employee_code || '',
                employment_type: employee.employment_type || '',
                salary_type: employee.salary_type || '',
                joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : '',
                status: employee.status || '',
                permission_package_id: employee.package_id || null,
                selectedPackage: selectedPackage || null
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
        setSelectedEmployee(emp);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };

    const openDeleteModal = (emp) => {
        setSelectedEmployee(emp);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };

    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedEmployee(null);
        setAttendanceMethodsConfig({});
    };

    const toggleActionMenu = (e, id) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === id ? null : id);
    };

    // ─── Form Handlers ───────────────────────────────────────────────────────

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;

        // Validate attendance methods
        const enabledMethods = Object.entries(attendanceMethodsConfig)
            .filter(([, config]) => config?.enabled && config?.available !== false);

        if (enabledMethods.length === 0) {
            toast.warning("Please enable at least one attendance method");
            return;
        }

        for (const [methodId, config] of enabledMethods) {
            if (!config.internalMethods || config.internalMethods.length === 0) {
                const methodName = constants.attendance_methods.find(m => m.id === methodId)?.name || methodId;
                toast.warning(`Please select at least one internal method for ${methodName}`);
                return;
            }
        }

        const result = await updateEmployee(selectedEmployee.id, {
            designation: formData.designation,
            employment_type: formData.employment_type,
            salary_type: formData.salary_type,
            permission_package_id: formData.permission_package_id
        });

        if (result.success) {
            toast.success('Employee updated successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to update employee');
        }
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;
        const result = await deleteEmployee(selectedEmployee.id);
        if (result.success) {
            toast.success('Employee deleted successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to delete employee');
        }
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleToggleMethod = (methodId) => {
        setAttendanceMethodsConfig(prev => ({
            ...prev,
            [methodId]: {
                ...prev[methodId],
                enabled: !prev[methodId]?.enabled,
                internalMethods: !prev[methodId]?.enabled ? (prev[methodId]?.internalMethods || []) : []
            }
        }));
    };

    const handleInternalMethodChange = (methodId, internalMethodValue) => {
        setAttendanceMethodsConfig(prev => {
            const current = prev[methodId]?.internalMethods || [];
            const updated = current.includes(internalMethodValue)
                ? current.filter(m => m !== internalMethodValue)
                : [...current, internalMethodValue];
            return { ...prev, [methodId]: { ...prev[methodId], internalMethods: updated } };
        });
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDesignationDisplay = useCallback((v) => {
        const d = constants.designations?.find(x => x.value === v);
        return d ? d.label : v || 'N/A';
    }, [constants.designations]);

    const getEmploymentTypeDisplay = useCallback((v) => {
        const t = constants.employment_types?.find(x => x.value === v);
        return t ? t.label : v || 'N/A';
    }, [constants.employment_types]);

    const getSalaryTypeDisplay = useCallback((v) => {
        const t = constants.salary_types?.find(x => x.value === v);
        return t ? t.label : v || 'N/A';
    }, [constants.salary_types]);

    const getStatusDisplay = useCallback((v) => {
        const s = constants.employment_status?.find(x => x.value === v);
        return s ? s.label : v || 'N/A';
    }, [constants.employment_status]);

    const getStatusClassName = useCallback((v) => ({
        active: 'bg-green-100 text-green-800 border border-green-200',
        inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
        suspended: 'bg-red-100 text-red-800 border border-red-200',
        on_leave: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    }[v] || 'bg-gray-100 text-gray-800 border border-gray-200'), []);

    // ─── Responsive Columns ──────────────────────────────────────────────────

    const [visibleColumns, setVisibleColumns] = useState(() => ({
        showEmployeeCode: true, showName: true,
        showDesignation: window.innerWidth >= 768,
        showEmail: window.innerWidth >= 1024,
        showPhone: window.innerWidth >= 1280,
        showType: window.innerWidth >= 1024,
        showStatus: window.innerWidth >= 768,
        showJoiningDate: window.innerWidth >= 1280,
    }));

    useEffect(() => {
        let t;
        const onResize = () => {
            clearTimeout(t);
            t = setTimeout(() => setVisibleColumns({
                showEmployeeCode: true, showName: true,
                showDesignation: window.innerWidth >= 768,
                showEmail: window.innerWidth >= 1024,
                showPhone: window.innerWidth >= 1280,
                showType: window.innerWidth >= 1024,
                showStatus: window.innerWidth >= 768,
                showJoiningDate: window.innerWidth >= 1280,
            }), 150);
        };
        window.addEventListener('resize', onResize);
        return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    }, []);

    // ─── Memoized Select Options ─────────────────────────────────────────────

    const designationOptions = useMemo(() => constants.designations?.map(d => ({ value: d.value, label: d.label, description: d.description })) || [], [constants.designations]);
    const employmentTypeOptions = useMemo(() => constants.employment_types?.map(t => ({ value: t.value, label: t.label, description: t.description })) || [], [constants.employment_types]);
    const salaryTypeOptions = useMemo(() => constants.salary_types?.map(t => ({ value: t.value, label: t.label, description: t.description })) || [], [constants.salary_types]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) {
            goToPage(newPage);
        }
    }, [pagination.page, goToPage]);

    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            minHeight: "48px",
            borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
            "&:hover": { borderColor: "#6366f1" },
            borderRadius: "0.75rem",
            padding: "0 0.5rem"
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
            color: state.isSelected ? "white" : "#1e293b",
            "&:active": { backgroundColor: "#6366f1" }
        }),
        multiValue: (base) => ({ ...base, backgroundColor: "#e0e7ff", borderRadius: "0.5rem" }),
        multiValueLabel: (base) => ({ ...base, color: "#4f46e5" }),
        multiValueRemove: (base) => ({
            ...base,
            color: "#4f46e5",
            "&:hover": { backgroundColor: "#4f46e5", color: "white" }
        })
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Employee Management
                </h1>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                    Total: {pagination.total} employees
                </div>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
                <div className="relative w-full mx-auto">
                    <input type="text" placeholder="Search employees by name, email, or code..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
                    />
                    <FaSearch className="absolute left-4 top-4 text-gray-400 text-xl" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                            <FaTimes />
                        </button>
                    )}
                </div>
            </motion.div>

            {loading && !employees.length && <SkeletonComponent />}

            {!loading && employees.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
                    <FaUserCircle className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No employees found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your search or add new employees</p>
                </motion.div>
            )}

            {!loading && employees.length > 0 && (
                <>
                    {/* Desktop Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        {visibleColumns.showEmployeeCode && <th className="px-6 py-4">Employee Code</th>}
                                        {visibleColumns.showName && <th className="px-6 py-4">Name</th>}
                                        {visibleColumns.showDesignation && <th className="px-6 py-4">Designation</th>}
                                        {visibleColumns.showEmail && <th className="px-6 py-4">Email</th>}
                                        {visibleColumns.showPhone && <th className="px-6 py-4">Phone</th>}
                                        {visibleColumns.showType && <th className="px-6 py-4">Type</th>}
                                        {visibleColumns.showStatus && <th className="px-6 py-4">Status</th>}
                                        {visibleColumns.showJoiningDate && <th className="px-6 py-4">Joining Date</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {employees.map((emp, index) => (
                                        <motion.tr key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                                        >
                                            {visibleColumns.showEmployeeCode && <td className="px-6 py-4 font-mono text-xs font-medium text-gray-600">{emp.employee_code}</td>}
                                            {visibleColumns.showName && <td className="px-6 py-4 font-semibold">{emp.name}</td>}
                                            {visibleColumns.showDesignation && (
                                                <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{getDesignationDisplay(emp.designation)}</span></td>
                                            )}
                                            {visibleColumns.showEmail && (
                                                <td className="px-6 py-4"><div className="flex items-center gap-2"><FaEnvelope className="text-gray-400 text-xs" /><span className="truncate max-w-[150px]">{emp.email}</span></div></td>
                                            )}
                                            {visibleColumns.showPhone && (
                                                <td className="px-6 py-4"><div className="flex items-center gap-2"><FaPhone className="text-gray-400 text-xs" /><span>{emp.phone}</span></div></td>
                                            )}
                                            {visibleColumns.showType && (
                                                <td className="px-6 py-4"><span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{getEmploymentTypeDisplay(emp.employment_type)}</span></td>
                                            )}
                                            {visibleColumns.showStatus && (
                                                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(emp.status)}`}>{getStatusDisplay(emp.status)}</span></td>
                                            )}
                                            {visibleColumns.showJoiningDate && (
                                                <td className="px-6 py-4"><div className="flex items-center gap-2"><FaCalendarAlt className="text-gray-400 text-xs" /><span>{formatDate(emp.joining_date)}</span></div></td>
                                            )}
                                            <td className="px-6 py-4 text-right relative">
                                                <button onClick={e => toggleActionMenu(e, emp.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md">
                                                    <FaEllipsisV className="text-gray-600" />
                                                </button>
                                                <AnimatePresence>
                                                    {activeActionMenu === emp.id && (
                                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <button onClick={() => openViewModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all duration-300"><FaEye size={14} /> View Details</button>
                                                            <button onClick={() => openEditModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all duration-300"><FaEdit size={14} /> Edit</button>
                                                            <button onClick={() => openDeleteModal(emp)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300"><FaTrash size={14} /> Delete</button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* Mobile Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {employees.map((emp, index) => (
                            <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
                                        <FaUserCircle className="text-white text-3xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-gray-800 truncate">{emp.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(emp.status)}`}>{getStatusDisplay(emp.status)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">{emp.employee_code}</p>
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-gray-600 flex items-center gap-2"><FaBriefcase className="text-blue-500" />{getDesignationDisplay(emp.designation)}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-2"><FaEnvelope className="text-gray-400" />{emp.email}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-2"><FaPhone className="text-gray-400" />{emp.phone}</p>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><FaUserTag className="text-purple-500" />{getEmploymentTypeDisplay(emp.employment_type)}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1"><FaCalendarAlt className="text-green-500" />Joined: {formatDate(emp.joining_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                                    <button onClick={() => openViewModal(emp)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-110"><FaEye size={16} /></button>
                                    <button onClick={() => openEditModal(emp)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110"><FaEdit size={16} /></button>
                                    <button onClick={() => openDeleteModal(emp)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-110"><FaTrash size={16} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        variant="default"
                        showInfo={true}
                    />
                </>
            )}

            {/* Modals */}
            <AnimatePresence>
                {modalType !== MODAL_TYPES.NONE && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <ModalScrollLock />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* VIEW MODAL */}
                            {modalType === MODAL_TYPES.VIEW && selectedEmployee && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                                    <FaEye className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Employee Details</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">View comprehensive employee information</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={closeModal}
                                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            >
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-2 flex items-center gap-6 pb-6 border-b">
                                                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                                                    <FaUserCircle className="text-white text-5xl" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-800">{selectedEmployee.name}</h3>
                                                    <p className="text-gray-600 flex items-center gap-2 mt-1"><FaBriefcase className="text-blue-500" />{getDesignationDisplay(selectedEmployee.designation)}</p>
                                                </div>
                                            </div>
                                            <InfoItem icon={<FaIdCard className="text-blue-500" />} label="Employee Code" value={selectedEmployee.employee_code} />
                                            <InfoItem icon={<FaUserTag className="text-purple-500" />} label="Status"
                                                value={<span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(selectedEmployee.status)}`}>{getStatusDisplay(selectedEmployee.status)}</span>}
                                            />
                                            <InfoItem icon={<FaEnvelope className="text-green-500" />} label="Email" value={selectedEmployee.email} />
                                            <InfoItem icon={<FaPhone className="text-orange-500" />} label="Phone" value={selectedEmployee.phone} />
                                            <InfoItem icon={<FaUserTag className="text-indigo-500" />} label="Employment Type" value={getEmploymentTypeDisplay(selectedEmployee.employment_type)} />
                                            <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" value={getSalaryTypeDisplay(selectedEmployee.salary_type)} />
                                            <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Joining Date" value={formatDate(selectedEmployee.joining_date)} />

                                            {selectedEmployee.package_name && (
                                                <div className="col-span-2 mt-4">
                                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><FaShieldAlt className="text-blue-500" /> Permission Package</label>
                                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                                                        <div className="flex items-center gap-3">
                                                            <FaShieldAlt className="text-indigo-500 text-xl" />
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{selectedEmployee.package_name}</h4>
                                                                {selectedEmployee.group_code && (
                                                                    <p className="text-xs text-gray-500 font-mono mt-1">{selectedEmployee.group_code}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedEmployee.permissions?.length > 0 && (
                                                <div className="col-span-2 mt-4">
                                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><FaCheck className="text-green-500" /> Permissions</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {selectedEmployee.permissions.map((perm, idx) => (
                                                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                                                className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                                                            >
                                                                <span className="font-medium text-gray-700">{perm.name}</span>
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-mono">{perm.code}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedEmployee.attendance_methods?.length > 0 && (
                                                <div className="col-span-2 mt-4">
                                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><FaUserCheck className="text-indigo-500" /> Attendance Methods</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {selectedEmployee.attendance_methods.map((method, idx) => (
                                                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                                                className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-gray-700 capitalize">{method.method}</span>
                                                                    <div className="flex gap-2">
                                                                        {(method.is_manual === 1 || method.is_manual === true) && (
                                                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Manual</span>
                                                                        )}
                                                                        {(method.is_auto === 1 || method.is_auto === true) && (
                                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Auto</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={closeModal} className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium">Close</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* EDIT MODAL */}
                            {modalType === MODAL_TYPES.EDIT && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                                    <FaEdit className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">Update employee details, permissions and attendance settings</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={closeModal}
                                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            >
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleEdit} className="p-6">
                                        {(constantsLoading || permissionsLoading) ? (
                                            <div className="flex items-center justify-center py-12">
                                                <FaSpinner className="w-8 h-8 text-indigo-500 animate-spin" />
                                                <span className="ml-3 text-gray-500">Loading data...</span>
                                            </div>
                                        ) : (
                                            <div className="">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                                                    {/* Left Column */}
                                                    <div className="space-y-6">
                                                        {/* Employee Display */}
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.1 }}
                                                            className="space-y-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                <FaUserCircle className="w-4 h-4 text-indigo-500" />
                                                                Employee
                                                            </label>
                                                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                                                                        {formData.name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                                                                        <p className="text-sm text-gray-500">{formData.email}</p>
                                                                        {formData.phone && (
                                                                            <p className="text-xs text-gray-400 mt-1">{formData.phone}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>

                                                        {/* Employment Type */}
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.15 }}
                                                            className="space-y-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                <FaBriefcase className="w-4 h-4 text-indigo-500" />
                                                                Employment Type
                                                            </label>
                                                            <Select
                                                                options={employmentTypeOptions}
                                                                value={employmentTypeOptions.find(opt => opt.value === formData.employment_type)}
                                                                onChange={(option) => setFormData(prev => ({ ...prev, employment_type: option.value }))}
                                                                placeholder="Select type"
                                                                styles={customSelectStyles}
                                                                formatOptionLabel={({ label, description }) => (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">{label}</div>
                                                                            {description && <div className="text-xs text-gray-400">{description}</div>}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                        </motion.div>

                                                        {/* Designation */}
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="space-y-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                <FaUserTie className="w-4 h-4 text-indigo-500" />
                                                                Designation
                                                            </label>
                                                            <Select
                                                                options={designationOptions}
                                                                value={designationOptions.find(opt => opt.value === formData.designation)}
                                                                onChange={(option) => setFormData(prev => ({ ...prev, designation: option.value }))}
                                                                placeholder="Select designation"
                                                                styles={customSelectStyles}
                                                                formatOptionLabel={({ label, description }) => (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">{label}</div>
                                                                            {description && <div className="text-xs text-gray-400">{description}</div>}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                        </motion.div>

                                                        {/* Salary Type */}
                                                        <motion.div
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.25 }}
                                                            className="space-y-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                <FaDollarSign className="w-4 h-4 text-indigo-500" />
                                                                Salary Type
                                                            </label>
                                                            <Select
                                                                options={salaryTypeOptions}
                                                                value={salaryTypeOptions.find(opt => opt.value === formData.salary_type)}
                                                                onChange={(option) => setFormData(prev => ({ ...prev, salary_type: option.value }))}
                                                                placeholder="Select salary type"
                                                                styles={customSelectStyles}
                                                                formatOptionLabel={({ label, description }) => (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1">
                                                                            <div className="font-medium">{label}</div>
                                                                            {description && <div className="text-xs text-gray-400">{description}</div>}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            />
                                                        </motion.div>

                                                        {/* Permission Package */}
                                                        <motion.div
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ delay: 0.35 }}
                                                            className="space-y-2"
                                                        >
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                <FaShieldAlt className="w-4 h-4 text-indigo-500" />
                                                                Permission Package
                                                            </label>
                                                            <Select
                                                                options={permissionPackages}
                                                                value={formData.selectedPackage}
                                                                onChange={(option) => setFormData(prev => ({ ...prev, selectedPackage: option, permission_package_id: option?.value || null }))}
                                                                placeholder="Select a permission package..."
                                                                isClearable
                                                                styles={customSelectStyles}
                                                                formatOptionLabel={({ label, description, groupCode, permissions }) => (
                                                                    <div className="py-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <FaShieldAlt className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                                            <span className="font-medium text-gray-900">{label}</span>
                                                                            {groupCode && (
                                                                                <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono">
                                                                                    {groupCode}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {description && (
                                                                            <div className="text-xs text-gray-400 mt-0.5 ml-5">{description}</div>
                                                                        )}
                                                                        {permissions?.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
                                                                                {permissions.slice(0, 3).map(p => (
                                                                                    <span
                                                                                        key={p.permission_id}
                                                                                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full"
                                                                                    >
                                                                                        {p.permission_name}
                                                                                    </span>
                                                                                ))}
                                                                                {permissions.length > 3 && (
                                                                                    <span className="text-xs text-gray-400">+{permissions.length - 3} more</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            />

                                                            {formData.selectedPackage && formData.selectedPackage.permissions?.length > 0 && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -8 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl"
                                                                >
                                                                    <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                                                                        <FaCheck className="w-3 h-3" />
                                                                        Active Permissions in this Package
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {formData.selectedPackage.permissions.map(p => (
                                                                            <span
                                                                                key={p.permission_id}
                                                                                className="text-xs bg-white text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg font-medium shadow-sm"
                                                                            >
                                                                                {p.permission_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                    </div>

                                                    {/* Right Column - Attendance Methods */}
                                                    <div className="space-y-6">
                                                        <motion.div
                                                            initial={{ y: 20, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                                    <FaUserCheck className="w-4 h-4 text-indigo-500" />
                                                                    Attendance Methods
                                                                </label>
                                                                <span className="text-xs text-gray-400">Configure how staff marks attendance</span>
                                                            </div>

                                                            <div className="grid grid-cols-1 gap-3">
                                                                {constants.attendance_methods.map((method) => {
                                                                    const config = attendanceMethodsConfig[method.id];
                                                                    const isEnabled = config?.enabled || false;

                                                                    return (
                                                                        <div
                                                                            key={method.id}
                                                                            className={`border rounded-xl transition-all duration-200 overflow-hidden ${isEnabled ? 'border-indigo-200 bg-indigo-50/30 shadow-sm' : 'border-gray-200 bg-white'
                                                                                } ${!method.available ? 'opacity-60' : ''}`}
                                                                        >
                                                                            <div className="flex items-center justify-between p-4">
                                                                                <div className="flex items-center gap-3 flex-1">
                                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-indigo-100' : 'bg-gray-100'
                                                                                        }`}>
                                                                                        <method.icon className={`w-5 h-5 ${isEnabled ? 'text-indigo-600' : 'text-gray-500'}`} />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <h4 className="font-medium text-gray-900">{method.name}</h4>
                                                                                            {method.requiresDevice && (
                                                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                                                                    Requires Device
                                                                                                </span>
                                                                                            )}
                                                                                            {!method.available && (
                                                                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                                                                    Currently Unavailable
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                                                                                        {method.requiresLocation && (
                                                                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                                                                <FaMapMarkerAlt className="w-3 h-3" />
                                                                                                Location tracking required
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => method.available && handleToggleMethod(method.id)}
                                                                                    disabled={!method.available}
                                                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                                                                                        } ${!method.available ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                                                >
                                                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                                                        }`} />
                                                                                </button>
                                                                            </div>

                                                                            {isEnabled && method.available && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, height: 0 }}
                                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                                    exit={{ opacity: 0, height: 0 }}
                                                                                    className="border-t border-indigo-100 px-4 py-3 bg-indigo-50/50"
                                                                                >
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-sm font-medium text-gray-700">Marking Methods</label>
                                                                                        <div className="flex flex-wrap gap-4">
                                                                                            {INTERNAL_METHOD_OPTIONS.map((internalMethod) => (
                                                                                                <label
                                                                                                    key={internalMethod.value}
                                                                                                    className="flex items-center gap-2 cursor-pointer hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                                                                                                >
                                                                                                    <input
                                                                                                        type="checkbox"
                                                                                                        checked={config?.internalMethods?.includes(internalMethod.value) || false}
                                                                                                        onChange={() => handleInternalMethodChange(method.id, internalMethod.value)}
                                                                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                                                                    />
                                                                                                    <internalMethod.icon className="w-4 h-4 text-gray-500" />
                                                                                                    <span className="text-sm text-gray-700">{internalMethod.label}</span>
                                                                                                    <span className="text-xs text-gray-400">({internalMethod.description})</span>
                                                                                                </label>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                </div>
                                            </div>

                                        )}

                                        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 mt-6">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={closeModal}
                                                disabled={loading}
                                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </motion.button>
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={loading || constantsLoading || permissionsLoading}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                                        Updating Employee...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="w-4 h-4" />
                                                        Update Employee
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {/* DELETE MODAL */}
                            {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedEmployee && (
                                <>
                                    <div className="relative h-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />
                                    <div className="px-6 py-5 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                                                    <FaTrash className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
                                                    <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={closeModal}
                                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                                            >
                                                <FaTimes className="w-5 h-5 text-gray-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                    <div className="p-6 text-center">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
                                            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                        >
                                            <FaTrash className="text-4xl text-red-600" />
                                        </motion.div>
                                        <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                                        <p className="text-gray-500 mb-6">
                                            You are about to delete <span className="font-semibold text-red-600">{selectedEmployee.name}</span>. This action cannot be undone.
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button onClick={closeModal} className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">Cancel</button>
                                            <button onClick={handleDelete} disabled={loading}
                                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                            >
                                                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                                Delete Employee
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

// InfoItem removed from bottom as it was moved to top

export default EmployeeManagement;
