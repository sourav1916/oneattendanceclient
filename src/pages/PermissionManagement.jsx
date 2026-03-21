import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    FaEdit, FaTrash, FaEye, FaTimes,
    FaSearch, FaSpinner, FaEllipsisV, FaPlus, FaSave,
    FaShieldAlt, FaInfoCircle,
    FaToggleOn, FaCheckSquare, FaKey, FaLayerGroup,
    FaCalendarAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';

const MODAL_TYPES = {
    NONE: 'NONE',
    CREATE: 'CREATE',
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

// DUMMY DATA - Available permissions from API
const AVAILABLE_PERMISSIONS = [
    { id: 1, name: "Add Employee", code: "EMP_ADD", description: "Can add new employees to the system", group: "Employee Management" },
    { id: 2, name: "Edit Employee", code: "EMP_EDIT", description: "Can edit existing employee details", group: "Employee Management" },
    { id: 3, name: "Delete Employee", code: "EMP_DELETE", description: "Can remove employees from the system", group: "Employee Management" },
    { id: 4, name: "View Employee", code: "EMP_VIEW", description: "Can view employee details", group: "Employee Management" },
    { id: 5, name: "Add Department", code: "DEPT_ADD", description: "Can add new departments", group: "Department Management" },
    { id: 6, name: "Edit Department", code: "DEPT_EDIT", description: "Can edit department details", group: "Department Management" },
    { id: 7, name: "Delete Department", code: "DEPT_DELETE", description: "Can delete departments", group: "Department Management" },
    { id: 8, name: "View Department", code: "DEPT_VIEW", description: "Can view department details", group: "Department Management" },
    { id: 9, name: "Add Attendance", code: "ATT_ADD", description: "Can add attendance records", group: "Attendance Management" },
    { id: 10, name: "Edit Attendance", code: "ATT_EDIT", description: "Can edit attendance records", group: "Attendance Management" },
    { id: 11, name: "View Attendance", code: "ATT_VIEW", description: "Can view attendance records", group: "Attendance Management" },
    { id: 12, name: "Generate Reports", code: "REPORT_GEN", description: "Can generate various reports", group: "Reports" },
    { id: 13, name: "Export Data", code: "DATA_EXPORT", description: "Can export data to Excel/PDF", group: "Reports" },
    { id: 14, name: "Manage Users", code: "USER_MANAGE", description: "Can manage system users", group: "User Management" },
    { id: 15, name: "Manage Roles", code: "ROLE_MANAGE", description: "Can manage roles and permissions", group: "User Management" }
];

// DUMMY DATA - Permission groups/roles created
const DUMMY_PERMISSION_GROUPS = [
    {
        id: 1,
        name: "HR Manager",
        code: "HR_MGR",
        description: "Full access to HR related operations",
        is_active: true,
        created_at: "2024-01-15T10:30:00Z",
        permissions: [
            { permission_id: 1, name: "Add Employee", code: "EMP_ADD", is_allowed: true },
            { permission_id: 2, name: "Edit Employee", code: "EMP_EDIT", is_allowed: true },
            { permission_id: 3, name: "Delete Employee", code: "EMP_DELETE", is_allowed: true },
            { permission_id: 4, name: "View Employee", code: "EMP_VIEW", is_allowed: true },
            { permission_id: 9, name: "Add Attendance", code: "ATT_ADD", is_allowed: true },
            { permission_id: 10, name: "Edit Attendance", code: "ATT_EDIT", is_allowed: true },
            { permission_id: 11, name: "View Attendance", code: "ATT_VIEW", is_allowed: true }
        ]
    },
    {
        id: 2,
        name: "Department Manager",
        code: "DEPT_MGR",
        description: "Can manage departments and view employees",
        is_active: true,
        created_at: "2024-01-20T14:15:00Z",
        permissions: [
            { permission_id: 4, name: "View Employee", code: "EMP_VIEW", is_allowed: true },
            { permission_id: 5, name: "Add Department", code: "DEPT_ADD", is_allowed: true },
            { permission_id: 6, name: "Edit Department", code: "DEPT_EDIT", is_allowed: true },
            { permission_id: 8, name: "View Department", code: "DEPT_VIEW", is_allowed: true }
        ]
    },
    {
        id: 3,
        name: "Employee",
        code: "EMPLOYEE",
        description: "Basic employee access",
        is_active: true,
        created_at: "2024-02-01T09:00:00Z",
        permissions: [
            { permission_id: 4, name: "View Employee", code: "EMP_VIEW", is_allowed: true },
            { permission_id: 11, name: "View Attendance", code: "ATT_VIEW", is_allowed: true }
        ]
    }
];

const PermissionManagement = () => {
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true,
        permissions: []
    });

    const [selectedPermissions, setSelectedPermissions] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    // Pagination
    const {
        pagination,
        updatePagination,
        goToPage,
    } = usePagination(1, 10);

    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Load dummy data
    useEffect(() => {
        loadPermissionGroups();
    }, []);

    // Debounce search
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
                loadPermissionGroups(1);
            }
        }
    }, [debouncedSearchTerm]);

    const loadPermissionGroups = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            let filteredGroups = [...DUMMY_PERMISSION_GROUPS];

            if (debouncedSearchTerm) {
                filteredGroups = filteredGroups.filter(group =>
                    group.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    group.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    group.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                );
            }

            const start = (page - 1) * pagination.limit;
            const end = start + pagination.limit;
            const paginatedGroups = filteredGroups.slice(start, end);

            setPermissionGroups(paginatedGroups);
            updatePagination({
                page: page,
                limit: pagination.limit,
                total: filteredGroups.length,
                total_pages: Math.ceil(filteredGroups.length / pagination.limit),
                is_last_page: end >= filteredGroups.length
            });

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
            loadPermissionGroups(1, true);
            initialFetchDone.current = true;
        }
    }, [loadPermissionGroups]);

    const createPermissionGroup = async (groupData) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const permissionsArray = Object.entries(selectedPermissions)
                .filter(([_, isAllowed]) => isAllowed)
                .map(([id, isAllowed]) => {
                    const permission = AVAILABLE_PERMISSIONS.find(p => p.id === parseInt(id));
                    return {
                        permission_id: parseInt(id),
                        name: permission.name,
                        code: permission.code,
                        is_allowed: isAllowed
                    };
                });

            const newGroup = {
                id: Date.now(),
                name: groupData.name,
                code: groupData.code,
                description: groupData.description,
                is_active: groupData.is_active,
                created_at: new Date().toISOString(),
                permissions: permissionsArray
            };

            setPermissionGroups(prev => [newGroup, ...prev]);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };

    const updatePermissionGroup = async (id, groupData) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const permissionsArray = Object.entries(selectedPermissions)
                .filter(([_, isAllowed]) => isAllowed)
                .map(([id, isAllowed]) => {
                    const permission = AVAILABLE_PERMISSIONS.find(p => p.id === parseInt(id));
                    return {
                        permission_id: parseInt(id),
                        name: permission.name,
                        code: permission.code,
                        is_allowed: isAllowed
                    };
                });

            setPermissionGroups(prev => prev.map(group =>
                group.id === id ? {
                    ...group,
                    ...groupData,
                    permissions: permissionsArray
                } : group
            ));
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };

    const deletePermissionGroup = async (id) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setPermissionGroups(prev => prev.filter(group => group.id !== id));
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };

    // Modal Handlers
    const openCreateModal = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            is_active: true,
            permissions: []
        });
        setSelectedPermissions({});
        setSelectAll(false);
        setModalType(MODAL_TYPES.CREATE);
        setActiveActionMenu(null);
    };

    const openEditModal = (group) => {
        setSelectedGroup(group);

        const selectedPerms = {};
        group.permissions.forEach(p => {
            selectedPerms[p.permission_id] = p.is_allowed;
        });

        setSelectedPermissions(selectedPerms);
        const allSelected = AVAILABLE_PERMISSIONS.every(p => selectedPerms[p.id] === true);
        setSelectAll(allSelected);

        setFormData({
            name: group.name || '',
            code: group.code || '',
            description: group.description || '',
            is_active: group.is_active === true,
            permissions: group.permissions || []
        });
        setModalType(MODAL_TYPES.EDIT);
        setActiveActionMenu(null);
    };

    const openViewModal = (group) => {
        setSelectedGroup(group);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };

    const openDeleteModal = (group) => {
        setSelectedGroup(group);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };

    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedGroup(null);
        setSelectedPermissions({});
        setSelectAll(false);
    };

    const toggleActionMenu = (e, id) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === id ? null : id);
    };

    // Permission Toggle Handler - Single toggle button
    const handlePermissionToggle = (permissionId) => {
        setSelectedPermissions(prev => {
            const newState = { ...prev };
            if (newState[permissionId]) {
                delete newState[permissionId];
            } else {
                newState[permissionId] = true;
            }

            // Update selectAll state
            const allSelected = AVAILABLE_PERMISSIONS.every(p => newState[p.id] === true);
            setSelectAll(allSelected);

            return newState;
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPermissions({});
            setSelectAll(false);
        } else {
            const allPermissions = {};
            AVAILABLE_PERMISSIONS.forEach(p => {
                allPermissions[p.id] = true;
            });
            setSelectedPermissions(allPermissions);
            setSelectAll(true);
        }
    };

    // Form Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const result = await createPermissionGroup(formData);
        if (result.success) closeModal();
        else setError(result.error);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedGroup) return;
        const result = await updatePermissionGroup(selectedGroup.id, formData);
        if (result.success) closeModal();
        else setError(result.error);
    };

    const handleDelete = async () => {
        if (!selectedGroup) return;
        const result = await deletePermissionGroup(selectedGroup.id);
        if (result.success) closeModal();
        else setError(result.error);
    };

    // Helpers
    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusClassName = useCallback((isActive) => ({
        true: 'bg-green-100 text-green-800 border border-green-200',
        false: 'bg-gray-100 text-gray-800 border border-gray-200',
    }[isActive] || 'bg-gray-100 text-gray-800 border border-gray-200'), []);

    const getStatusDisplay = useCallback((isActive) => isActive ? 'Active' : 'Inactive', []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) {
            goToPage(newPage);
        }
    }, [pagination.page, goToPage]);

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const groups = {};
        AVAILABLE_PERMISSIONS.forEach(perm => {
            if (!groups[perm.group]) {
                groups[perm.group] = [];
            }
            groups[perm.group].push(perm);
        });
        return groups;
    }, []);

    const filteredGroups = useMemo(() => {
        if (!debouncedSearchTerm) return permissionGroups;
        return permissionGroups;
    }, [permissionGroups, debouncedSearchTerm]);

    const selectedCount = Object.keys(selectedPermissions).length;

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Permission Management
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                    >
                        <FaPlus size={16} />
                        Create Permission Group
                    </button>
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                        Total: {pagination.total} groups
                    </div>
                </div>
            </motion.div>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
                <div className="relative w-full mx-auto">
                    <input type="text" placeholder="Search permission groups by name, code, or description..."
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

            {loading && !permissionGroups.length && <SkeletonComponent />}

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 shadow-lg"
                    >
                        <div className="flex items-center gap-2"><FaTimes className="text-red-600" /><span>Error: {error}</span></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!loading && !error && filteredGroups.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
                    <FaShieldAlt className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No permission groups found</p>
                    <p className="text-gray-400 mt-2">Click "Create Permission Group" to create your first group</p>
                </motion.div>
            )}

            {!loading && !error && filteredGroups.length > 0 && (
                <>
                    {/* Desktop Table */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Group Name</th>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-6 py-4">Permissions</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Created At</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredGroups.map((group, index) => (
                                        <motion.tr key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FaLayerGroup className="text-purple-500" />
                                                    <span className="font-semibold">{group.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg">{group.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 truncate max-w-[200px]">{group.description || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                    {group.permissions?.length || 0} permissions
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(group.is_active)}`}>
                                                    {getStatusDisplay(group.is_active)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-gray-400 text-xs" />
                                                    <span>{formatDate(group.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button onClick={e => toggleActionMenu(e, group.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md">
                                                    <FaEllipsisV className="text-gray-600" />
                                                </button>
                                                <AnimatePresence>
                                                    {activeActionMenu === group.id && (
                                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <button onClick={() => openViewModal(group)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all duration-300">
                                                                <FaEye size={14} /> View Details
                                                            </button>
                                                            <button onClick={() => openEditModal(group)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all duration-300">
                                                                <FaEdit size={14} /> Edit
                                                            </button>
                                                            <button onClick={() => openDeleteModal(group)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300">
                                                                <FaTrash size={14} /> Delete
                                                            </button>
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
                        {filteredGroups.map((group, index) => (
                            <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl">
                                        <FaLayerGroup className="text-white text-3xl" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-gray-800 truncate">{group.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(group.is_active)}`}>
                                                {getStatusDisplay(group.is_active)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-1 rounded-lg inline-block">{group.code}</p>
                                        <div className="mt-3 space-y-2">
                                            {group.description && (
                                                <p className="text-sm text-gray-600">{group.description}</p>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FaShieldAlt className="text-blue-500" />
                                                    {group.permissions?.length || 0} permissions
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <FaCalendarAlt className="text-green-500" />
                                                    {formatDate(group.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                                    <button onClick={() => openViewModal(group)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-110">
                                        <FaEye size={16} />
                                    </button>
                                    <button onClick={() => openEditModal(group)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110">
                                        <FaEdit size={16} />
                                    </button>
                                    <button onClick={() => openDeleteModal(group)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-110">
                                        <FaTrash size={16} />
                                    </button>
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

            {/* Create/Edit Modal with Toggle Buttons */}
            <AnimatePresence>
                {(modalType === MODAL_TYPES.CREATE || modalType === MODAL_TYPES.EDIT) && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`sticky top-0 flex justify-between items-center p-6 border-b ${modalType === MODAL_TYPES.CREATE ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white rounded-t-2xl`}>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    {modalType === MODAL_TYPES.CREATE ? <FaPlus /> : <FaEdit />}
                                    {modalType === MODAL_TYPES.CREATE ? 'Create Permission Group' : 'Edit Permission Group'}
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <form onSubmit={modalType === MODAL_TYPES.CREATE ? handleCreate : handleEdit} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Left Side - Group Details */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaKey className="text-blue-500" /> Group Details
                                        </h3>

                                        <FormField
                                            icon={<FaLayerGroup className="text-purple-500" />}
                                            label="Group Name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g., HR Manager, Admin Role"
                                            className="border-2 focus:border-purple-500"
                                        />

                                        <FormField
                                            icon={<FaKey className="text-blue-500" />}
                                            label="Group Code"
                                            name="code"
                                            type="text"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g., HR_MGR, ADMIN_ROLE"
                                            className="border-2 focus:border-blue-500"
                                        />

                                        <FormField
                                            icon={<FaInfoCircle className="text-orange-500" />}
                                            label="Description"
                                            name="description"
                                            type="textarea"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe what this permission group is for"
                                            className="border-2 focus:border-orange-500"
                                        />

                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <FaToggleOn className="text-2xl text-blue-500" />
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Group Status</label>
                                                    <p className="text-xs text-gray-500">Enable or disable this permission group</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formData.is_active ? 'bg-green-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Side - Permissions Selection with Toggle Buttons */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <FaShieldAlt className="text-blue-500" /> Permissions
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 flex items-center gap-2 font-medium"
                                            >
                                                {selectAll ? (
                                                    <FaCheckSquare size={14} className="text-blue-600" />
                                                ) : (
                                                    <FaCheckSquare size={14} className="text-white-600" />
                                                )}
                                                {selectAll ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                                            {Object.entries(groupedPermissions).map(([groupName, permissions]) => (
                                                <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 border-b border-gray-200">
                                                        <h4 className="font-semibold text-gray-700">{groupName}</h4>
                                                    </div>
                                                    <div className="divide-y divide-gray-100">
                                                        {permissions.map(permission => {
                                                            const isAllowed = selectedPermissions[permission.id] || false;
                                                            return (
                                                                <div key={permission.id} className="p-4 hover:bg-gray-50 transition-all duration-300">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                                        <div className="flex-1">
                                                                            <p className="font-medium text-gray-800">{permission.name}</p>
                                                                            <p className="text-xs text-gray-500 font-mono">{permission.code}</p>
                                                                            {permission.description && (
                                                                                <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handlePermissionToggle(permission.id)}
                                                                            className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 shadow-md ${isAllowed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'
                                                                                }`}
                                                                        >
                                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${isAllowed ? 'translate-x-7' : 'translate-x-1'
                                                                                }`}>

                                                                            </span>
                                                                            <span className={`absolute text-xs font-medium transition-all duration-300 ${isAllowed ? 'left-2 text-white' : 'right-2 text-gray-600'
                                                                                }`}>

                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                            <p className="text-sm text-blue-700 flex items-center gap-2">
                                                <FaInfoCircle className="text-blue-500" />
                                                <span>Selected: <strong className="font-bold">{selectedCount}</strong> out of <strong>{AVAILABLE_PERMISSIONS.length}</strong> permissions</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                                    <button type="button" onClick={closeModal} className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className={`px-6 py-2 ${modalType === MODAL_TYPES.CREATE ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white rounded-xl flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave size={14} />}
                                        {modalType === MODAL_TYPES.CREATE ? 'Create Group' : 'Update Group'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Modal */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.VIEW && selectedGroup && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FaEye /> Permission Group Details
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <FaLayerGroup className="text-purple-500 text-2xl" />
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{selectedGroup.name}</h3>
                                                <p className="text-sm font-mono text-gray-600">{selectedGroup.code}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <InfoItem icon={<FaInfoCircle className="text-orange-500" />} label="Description" value={selectedGroup.description || 'No description'} />
                                    <InfoItem icon={<FaToggleOn className="text-green-500" />} label="Status"
                                        value={<span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClassName(selectedGroup.is_active)}`}>
                                            {getStatusDisplay(selectedGroup.is_active)}
                                        </span>}
                                    />
                                    <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Created At" value={formatDate(selectedGroup.created_at)} />

                                    <div className="col-span-2">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FaShieldAlt className="text-blue-500" /> Permissions ({selectedGroup.permissions?.length || 0})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {selectedGroup.permissions?.map((perm, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{perm.name}</p>
                                                        <p className="text-xs text-gray-500">{perm.code}</p>
                                                    </div>
                                                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${perm.is_allowed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'
                                                        }`}>
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${perm.is_allowed ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={closeModal} className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedGroup && (
                    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <FaTrash /> Confirm Delete
                                </h2>
                                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            <div className="p-6 text-center">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
                                    className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <FaTrash className="text-4xl text-red-600" />
                                </motion.div>
                                <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                                <p className="text-gray-500 mb-6">
                                    You are about to delete permission group <span className="font-semibold text-red-600">{selectedGroup.name}</span>.
                                    This action cannot be undone.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={closeModal} className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
                                        Cancel
                                    </button>
                                    <button onClick={handleDelete} disabled={loading}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                        Delete Group
                                    </button>
                                </div>
                            </div>
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
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value}</div>
    </div>
);

const FormField = ({ icon, label, name, type, value, onChange, required, placeholder, options, className = '' }) => {
    const base = `w-full p-3 border rounded-xl focus:ring-4 outline-none transition-all duration-300 ${className}`;

    if (type === 'textarea') {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {icon}{label} {required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    rows={3}
                    className={`${base} resize-none`}
                />
            </div>
        );
    }

    if (type === 'select') {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    {icon}{label} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={base}
                >
                    <option value="">Select {label}</option>
                    {options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {icon}{label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={base}
            />
        </div>
    );
};

export default PermissionManagement;