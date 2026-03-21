import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle,
    FaSearch, FaSpinner, FaEllipsisV,
    FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt, FaBriefcase,
    FaDollarSign, FaUserTag, FaShieldAlt, FaBan, FaTrashAlt,
    FaInfoCircle, FaPlus
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';

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

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [constants, setConstants] = useState({
        employment_types: [],
        salary_types: [],
        designations: [],
        employment_status: []
    });
    const [allPermissions, setAllPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [constantsLoading, setConstantsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [selectedNewPermissions, setSelectedNewPermissions] = useState([]);
    const [permissionOptions, setPermissionOptions] = useState([]);

    const [formData, setFormData] = useState({
        name: '', designation: '', email: '', phone: '',
        employee_code: '', employment_type: '', salary_type: '',
        joining_date: '', status: '', permissions: []
    });

    // Use pagination hook
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

    const API_BASE = "https://api-attendance.onesaas.in";

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const load = async () => {
            try { await Promise.all([fetchConstants(), fetchAllPermissions()]); }
            catch (e) { console.error(e); }
        };
        load();
    }, []);

    useEffect(() => {
        if (allPermissions.length > 0) {
            setPermissionOptions(allPermissions.map(p => ({
                value: p.id,
                label: p.name,
                description: p.description || ''
            })));
        }
    }, [allPermissions]);

    // Debounce search - removed goToPage dependency
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Reset to page 1 when search changes
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
            const token = localStorage.getItem('token');
            const company = JSON.parse(localStorage.getItem('company'));
            const res = await fetch(`${API_BASE}/constants/`, {
                headers: { 'Authorization': `Bearer ${token}`, 'company': company.id.toString(), 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.success) { setConstants(result.data); constantsFetched.current = true; }
        } catch (e) {
            console.error(e);
            setError('Failed to load constants');
        } finally { setConstantsLoading(false); }
    }, []);

    const fetchAllPermissions = useCallback(async () => {
        if (permissionsFetched.current) return allPermissions;
        setPermissionsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const company = JSON.parse(localStorage.getItem('company'));
            const res = await fetch(`${API_BASE}/permissions/list`, {
                headers: { 'Authorization': `Bearer ${token}`, 'company': company.id.toString(), 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.success) {
                setAllPermissions(result.data);
                permissionsFetched.current = true;
                return result.data;
            }
            return [];
        } catch (e) {
            console.error(e);
            setError('Failed to load permissions');
            return [];
        } finally { setPermissionsLoading(false); }
    }, [allPermissions]);

    const fetchEmployees = useCallback(async (page = pagination.page, resetLoading = true) => {
        // Prevent multiple simultaneous fetches
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({ 
                page: page.toString(), 
                limit: pagination.limit.toString() 
            });
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            
            const res = await fetch(`${API_BASE}/employees/list?${params}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'company': company.id.toString(), 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            
            if (result.success) {
                setEmployees(result.data);
                // Update pagination with response data
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
            setError(e.message);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm, updatePagination]);

    // Initial load
    useEffect(() => {
        if (!initialFetchDone.current) { 
            fetchEmployees(1, true); 
            initialFetchDone.current = true; 
        }
    }, [fetchEmployees]);

    // Fetch when page changes
    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchEmployees(pagination.page, true);
        }
    }, [pagination.page, fetchEmployees]);

    const updateEmployee = async (id, employeeData) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const company = JSON.parse(localStorage.getItem('company'));

            const permissionsToSend = (employeeData.permissions || [])
                .filter(p => p.status !== 'remove')
                .map(p => ({ permission_id: p.permission_id, is_allowed: p.status === 'allow' }));

            const payload = {
                employee_id: id,
                designation: employeeData.designation,
                salary_type: employeeData.salary_type,
                employment_type: employeeData.employment_type,
                joining_date: employeeData.joining_date,
                permissions: permissionsToSend
            };
            if (employeeData.status) payload.status = employeeData.status;

            const res = await fetch(`${API_BASE}/employees/update`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'company': company.id.toString(), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.success) { 
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
            const token = localStorage.getItem('token');
            const company = JSON.parse(localStorage.getItem('company'));
            const res = await fetch(`${API_BASE}/employees/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'company': company.id.toString(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            if (result.success) { 
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
        setSelectedNewPermissions([]);
        try {
            if (!constantsFetched.current) await fetchConstants();
            let permsData = allPermissions;
            if (!permissionsFetched.current) permsData = await fetchAllPermissions();

            setSelectedEmployee(employee);

            const empPermMap = {};
            (employee.permissions || []).forEach(p => {
                empPermMap[p.permission_id] = {
                    name: p.name,
                    status: (p.is_allowed === 1 || p.is_allowed === true) ? 'allow' : 'deny'
                };
            });

            const merged = permsData.map(p => ({
                permission_id: p.id,
                name: p.name,
                status: empPermMap[p.id]?.status || 'remove'
            }));

            let joiningDate = '';
            if (employee.joining_date) {
                const d = new Date(employee.joining_date);
                if (!isNaN(d.getTime())) joiningDate = d.toISOString().split('T')[0];
            }

            setFormData({
                name: employee.name || '',
                designation: employee.designation || '',
                email: employee.email || '',
                phone: employee.phone || '',
                employee_code: employee.employee_code || '',
                employment_type: employee.employment_type || '',
                salary_type: employee.salary_type || '',
                joining_date: joiningDate,
                status: employee.status || '',
                permissions: merged
            });

            setModalType(MODAL_TYPES.EDIT);
            setActiveActionMenu(null);
        } catch (e) {
            console.error(e);
            setError('Failed to load edit data');
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
        setSelectedNewPermissions([]); 
    };
    
    const toggleActionMenu = (e, id) => { 
        e.stopPropagation(); 
        setActiveActionMenu(activeActionMenu === id ? null : id); 
    };

    // ─── Form Handlers ───────────────────────────────────────────────────────

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        const result = await updateEmployee(selectedEmployee.id, {
            designation: formData.designation,
            employment_type: formData.employment_type,
            salary_type: formData.salary_type,
            joining_date: formData.joining_date,
            status: formData.status,
            permissions: formData.permissions
        });
        if (result.success) closeModal();
        else setError(result.error);
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;
        const result = await deleteEmployee(selectedEmployee.id);
        if (result.success) closeModal();
        else setError(result.error);
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handlePermissionChange = (permissionId, newStatus) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(p =>
                p.permission_id === permissionId ? { ...p, status: newStatus } : p
            )
        }));
        if (newStatus === 'remove') {
            setSelectedNewPermissions(prev => prev.filter(opt => opt.value !== permissionId));
        }
    };

    const handleAddNewPermissions = (selectedOptions) => {
        const newSelection = selectedOptions || [];
        const newSelectedIds = new Set(newSelection.map(o => o.value));

        setSelectedNewPermissions(newSelection);

        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(perm => {
                if (newSelectedIds.has(perm.permission_id)) {
                    return perm.status === 'remove' ? { ...perm, status: 'allow' } : perm;
                }
                return perm;
            })
        }));
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────

    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDesignationDisplay = useCallback((v) => {
        const d = constants.designations?.find(x => x.value === v);
        return d ? d.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : v || 'N/A';
    }, [constants.designations]);

    const getEmploymentTypeDisplay = useCallback((v) => {
        const t = constants.employment_types?.find(x => x.value === v);
        return t ? t.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : v || 'N/A';
    }, [constants.employment_types]);

    const getSalaryTypeDisplay = useCallback((v) => {
        const t = constants.salary_types?.find(x => x.value === v);
        return t ? t.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : v || 'N/A';
    }, [constants.salary_types]);

    const getStatusDisplay = useCallback((v) => {
        const s = constants.employment_status?.find(x => x.value === v);
        return s ? s.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : v || 'N/A';
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

    const fmt = s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const designationOptions = useMemo(() => constants.designations?.map(d => ({ value: d.value, label: fmt(d.key) })) || [], [constants.designations]);
    const employmentTypeOptions = useMemo(() => constants.employment_types?.map(t => ({ value: t.value, label: fmt(t.key) })) || [], [constants.employment_types]);
    const salaryTypeOptions = useMemo(() => constants.salary_types?.map(t => ({ value: t.value, label: fmt(t.key) })) || [], [constants.salary_types]);
    const statusOptions = useMemo(() => constants.employment_status?.map(s => ({ value: s.value, label: fmt(s.key) })) || [], [constants.employment_status]);

    const activePermissions = useMemo(() => formData.permissions.filter(p => p.status !== 'remove'), [formData.permissions]);
    const removedPermissionsCount = useMemo(() => formData.permissions.filter(p => p.status === 'remove').length, [formData.permissions]);

    const availablePermissionOptions = useMemo(() =>
        permissionOptions.filter(opt => !activePermissions.some(p => p.permission_id === opt.value))
    , [permissionOptions, activePermissions]);

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) {
            goToPage(newPage);
        }
    }, [pagination.page, goToPage]);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6 font-sans">
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

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 shadow-lg"
                    >
                        <div className="flex items-center gap-2"><FaTimes className="text-red-600" /><span>Error: {error}</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!loading && !error && employees.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
                    <FaUserCircle className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No employees found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your search or add new employees</p>
                </motion.div>
            )}

            {!loading && !error && employees.length > 0 && (
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

                    {/* Pagination Component */}
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
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* VIEW MODAL */}
                            {modalType === MODAL_TYPES.VIEW && selectedEmployee && (
                                <>
                                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                                        <h2 className="text-xl font-semibold flex items-center gap-2"><FaEye /> Employee Details</h2>
                                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
                                    </div>
                                    <div className="p-6">
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
                                            {selectedEmployee.permissions?.length > 0 && (
                                                <div className="col-span-2 mt-4">
                                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><FaShieldAlt className="text-blue-500" /> Permissions</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {selectedEmployee.permissions.map((perm, idx) => (
                                                            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                                                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                                                            >
                                                                <span className="font-medium text-gray-700">{perm.name}</span>
                                                                {perm.is_allowed === 1 || perm.is_allowed === true
                                                                    ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><FaCheck size={10} /> Allowed</span>
                                                                    : <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><FaBan size={10} /> Denied</span>
                                                                }
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
                                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
                                        <h2 className="text-xl font-semibold flex items-center gap-2"><FaEdit /> Edit Employee</h2>
                                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
                                    </div>
                                    <form onSubmit={handleEdit} className="p-6">
                                        {(constantsLoading || permissionsLoading) ? (
                                            <div className="flex justify-center py-12 text-center">
                                                <div><FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-3" /><p className="text-gray-500">Loading data...</p></div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <FormField icon={<FaUserCircle className="text-gray-400" />} label="Full Name" name="name" type="text" value={formData.name} disabled readOnly className="bg-gray-100 cursor-not-allowed" />
                                                    <FormField icon={<FaEnvelope className="text-gray-400" />} label="Email" name="email" type="email" value={formData.email} disabled readOnly className="bg-gray-100 cursor-not-allowed" />
                                                    <FormField icon={<FaPhone className="text-gray-400" />} label="Phone" name="phone" type="tel" value={formData.phone} disabled readOnly className="bg-gray-100 cursor-not-allowed" />
                                                    <FormField icon={<FaIdCard className="text-gray-400" />} label="Employee Code" name="employee_code" type="text" value={formData.employee_code} disabled readOnly className="bg-gray-100 cursor-not-allowed" />
                                                    <FormField icon={<FaBriefcase className="text-blue-500" />} label="Designation" name="designation" type="select" value={formData.designation} onChange={handleInputChange} options={designationOptions} required className="border-2 focus:border-blue-500" />
                                                    <FormField icon={<FaUserTag className="text-purple-500" />} label="Employment Type" name="employment_type" type="select" value={formData.employment_type} onChange={handleInputChange} options={employmentTypeOptions} required className="border-2 focus:border-purple-500" />
                                                    <FormField icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" name="salary_type" type="select" value={formData.salary_type} onChange={handleInputChange} options={salaryTypeOptions} required className="border-2 focus:border-emerald-500" />
                                                    <FormField icon={<FaCalendarAlt className="text-rose-500" />} label="Joining Date" name="joining_date" type="date" value={formData.joining_date} onChange={handleInputChange} className="border-2 focus:border-rose-500" />
                                                    <FormField icon={<FaUserTag className="text-orange-500" />} label="Status" name="status" type="select" value={formData.status} onChange={handleInputChange} options={statusOptions} required className="border-2 focus:border-orange-500" />
                                                </div>

                                                {/* Permissions */}
                                                <div className="mt-8">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                        <FaShieldAlt className="text-blue-500" /> Permissions
                                                    </h3>

                                                    {activePermissions.length > 0 && (
                                                        <div className="mb-6">
                                                            <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                                                                <FaCheck className="text-green-500" size={14} /> Active Permissions
                                                            </h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {activePermissions.map(perm => (
                                                                    <motion.div key={perm.permission_id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                                                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                                                            perm.status === 'allow'
                                                                                ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                                                                                : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex flex-col gap-3">
                                                                            <span className="font-medium text-gray-700">{perm.name}</span>
                                                                            <div className="flex gap-2">
                                                                                <button type="button" onClick={() => handlePermissionChange(perm.permission_id, 'allow')}
                                                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all duration-300 ${perm.status === 'allow' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-white text-green-600 border-2 border-green-200 hover:bg-green-50'}`}
                                                                                ><FaCheck size={12} /> Allow</button>
                                                                                <button type="button" onClick={() => handlePermissionChange(perm.permission_id, 'deny')}
                                                                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all duration-300 ${perm.status === 'deny' ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white text-red-600 border-2 border-red-200 hover:bg-red-50'}`}
                                                                                ><FaBan size={12} /> Deny</button>
                                                                                <button type="button" onClick={() => handlePermissionChange(perm.permission_id, 'remove')}
                                                                                    className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all duration-300 bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                                                                                ><FaTrashAlt size={12} /> Remove</button>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                                        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                                                            <FaPlus className="text-blue-500" size={14} /> Add New Permissions
                                                        </h4>
                                                        <Select
                                                            isMulti
                                                            options={availablePermissionOptions}
                                                            value={selectedNewPermissions}
                                                            onChange={handleAddNewPermissions}
                                                            placeholder="Select permissions to add..."
                                                            noOptionsMessage={() => "All permissions are already active"}
                                                            styles={{
                                                                control: b => ({ ...b, minHeight: '50px', border: '2px solid #e2e8f0', borderRadius: '0.75rem', '&:hover': { borderColor: '#3b82f6' } }),
                                                                menu: b => ({ ...b, borderRadius: '0.75rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }),
                                                                option: (b, { isFocused, isSelected }) => ({ ...b, backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white', color: isSelected ? 'white' : '#1f2937' }),
                                                                multiValue: b => ({ ...b, backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }),
                                                                multiValueLabel: b => ({ ...b, color: '#1e40af', fontWeight: '500' }),
                                                                multiValueRemove: b => ({ ...b, color: '#1e40af', '&:hover': { backgroundColor: '#bfdbfe', color: '#1e3a8a' } })
                                                            }}
                                                            formatOptionLabel={({ label, description }) => (
                                                                <div className="py-1">
                                                                    <div className="font-medium">{label}</div>
                                                                    {description && <div className="text-xs text-gray-400">{description}</div>}
                                                                </div>
                                                            )}
                                                        />
                                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                            <FaInfoCircle className="text-blue-500" />
                                                            <span>New permissions are added with "Allow" by default. Adjust them in the cards above.</span>
                                                        </p>
                                                    </motion.div>

                                                    {removedPermissionsCount > 0 && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <FaInfoCircle className="text-gray-400" />
                                                                <span>{removedPermissionsCount} permission(s) not included in this update.</span>
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                                        <p className="text-xs text-blue-700 flex items-center gap-1">
                                                            <FaInfoCircle className="text-blue-500" />
                                                            <span>Allow: Permission granted | Deny: Permission denied | Remove: Not sent in update</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                                    <button type="button" onClick={closeModal} className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">Cancel</button>
                                                    <button type="submit" disabled={loading}
                                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                                    >
                                                        {loading ? <FaSpinner className="animate-spin" /> : <FaCheck size={14} />}
                                                        Update Employee
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </form>
                                </>
                            )}

                            {/* DELETE MODAL */}
                            {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedEmployee && (
                                <>
                                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                                        <h2 className="text-xl font-semibold flex items-center gap-2"><FaTrash /> Confirm Delete</h2>
                                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
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
        </div>
    );
};

// Helper Components
const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">{icon}{label}</label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const FormField = ({ icon, label, name, type, value, onChange, options, required, disabled, readOnly, className = '' }) => {
    const base = `w-full p-3 border rounded-xl focus:ring-4 outline-none transition-all duration-300 ${className}`;
    if (type === 'select') {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">{icon}{label} {required && <span className="text-red-500">*</span>}</label>
                <select name={name} value={value} onChange={onChange} required={required} disabled={disabled}
                    className={`${base} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}`}
                >
                    <option value="">Select {label}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        );
    }
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">{icon}{label} {required && <span className="text-red-500">*</span>}</label>
            <input type={type} name={name} value={value} onChange={onChange} required={required} disabled={disabled} readOnly={readOnly}
                className={`${base} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}`}
            />
        </div>
    );
};

export default EmployeeManagement;