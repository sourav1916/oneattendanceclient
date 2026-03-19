import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaUserCircle, FaSearch, FaSpinner, FaEllipsisV, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonComponent from '../components/SkeletonComponent';

// --- Modal Types ---
const MODAL_TYPES = {
    NONE: 'NONE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
};

// Animation variants
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
        employee_statuses: []
    });
    const [loading, setLoading] = useState(false);
    const [constantsLoading, setConstantsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        email: '',
        phone: '',
        employee_code: '',
        employment_type: '',
        joining_date: '',
        status: '',
        permissions: []
    });

    // Use refs to track if data has been fetched
    const constantsFetched = useRef(false);
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);

    const API_BASE = "https://api-attendance.onesaas.in";

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 1,
        is_last_page: true
    });

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Set isMounted to false on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // --- API Call Functions with AbortController ---
    const fetchConstants = useCallback(async () => {
        // Skip if already fetched
        if (constantsFetched.current) return;

        setConstantsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const companyString = localStorage.getItem('company');

            if (!token || !companyString) {
                throw new Error('Authentication credentials not found');
            }

            const companyData = JSON.parse(companyString);
            const companyId = companyData.id;

            const response = await fetch(`${API_BASE}/constants/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'company': companyId.toString(),
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setConstants(result.data);
                constantsFetched.current = true;
            }
        } catch (err) {
            console.error('Error fetching constants:', err);
            setError('Failed to load constants');
        } finally {
            setConstantsLoading(false);
        }
    }, []);

    // Add this ref with your other refs (around line 45)
    const initialFetchDone = useRef(false);

    // Replace your fetchEmployees function with this (around line 120)
    const fetchEmployees = useCallback(async () => {
        // Prevent multiple simultaneous requests
        if (fetchInProgress.current) return;

        fetchInProgress.current = true;
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const companyString = localStorage.getItem('company');

            if (!token || !companyString) {
                throw new Error('Authentication credentials not found');
            }

            const companyData = JSON.parse(companyString);
            const companyId = companyData.id;

            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm);
            }

            const response = await fetch(`${API_BASE}/employees/list?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'company': companyId.toString(),
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setEmployees(result.data);
                setPagination(result.pagination);
            } else {
                throw new Error(result.message || 'Failed to fetch employees');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching employees:', err);
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm]);

    // REPLACE all your useEffect sections from line 150-180 with this:

    // Initial data fetch - only once
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchEmployees();
            initialFetchDone.current = true;
        }

        // Cleanup function
        return () => {
            // No need to abort here since we removed AbortController
        };
    }, []); // Empty dependency array - runs only once

    // Fetch employees when pagination or search changes (but skip initial load)
    useEffect(() => {
        // Skip if this is the initial render (handled by the first useEffect)
        if (!initialFetchDone.current) return;

        // Add a small delay to prevent multiple rapid requests
        const timer = setTimeout(() => {
            fetchEmployees();
        }, 300);

        return () => clearTimeout(timer);
    }, [pagination.page, pagination.limit, debouncedSearchTerm]);

    // Update the updateEmployee and deleteEmployee functions (remove parameters)
    const updateEmployee = async (id, employeeData) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const companyString = localStorage.getItem('company');

            if (!token || !companyString) {
                throw new Error('Authentication credentials not found');
            }

            const companyData = JSON.parse(companyString);
            const companyId = companyData.id;

            const updateData = {
                employee_id: id,
                ...employeeData
            };

            if (employeeData.permissions) {
                updateData.permissions = employeeData.permissions.map(perm => ({
                    permission_id: perm.permission_id,
                    is_allowed: perm.is_allowed
                }));
            }

            const response = await fetch(`${API_BASE}/employees/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'company': companyId.toString(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                await fetchEmployees(); // Remove parameters
                return { success: true, data: result.data };
            } else {
                throw new Error(result.message || 'Failed to update employee');
            }
        } catch (err) {
            console.error('Error updating employee:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteEmployee = async (id) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const companyString = localStorage.getItem('company');

            if (!token || !companyString) {
                throw new Error('Authentication credentials not found');
            }

            const companyData = JSON.parse(companyString);
            const companyId = companyData.id;

            const response = await fetch(`${API_BASE}/employees/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'company': companyId.toString(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                await fetchEmployees(); // Remove parameters
                return { success: true };
            } else {
                throw new Error(result.message || 'Failed to delete employee');
            }
        } catch (err) {
            console.error('Error deleting employee:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Handlers ---
    const openEditModal = async (employee) => {
        // Fetch constants only when opening edit modal
        await fetchConstants();

        setSelectedEmployee(employee);
        setFormData({
            name: employee.name || '',
            designation: employee.designation || '',
            email: employee.email || '',
            phone: employee.phone || '',
            employee_code: employee.employee_code || '',
            employment_type: employee.employment_type || '',
            joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : '',
            status: employee.status || '',
            permissions: employee.permissions || []
        });
        setModalType(MODAL_TYPES.EDIT);
        setActiveActionMenu(null);
    };

    const openViewModal = (employee) => {
        setSelectedEmployee(employee);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };

    const openDeleteModal = (employee) => {
        setSelectedEmployee(employee);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };

    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedEmployee(null);
    };

    const toggleActionMenu = (e, employeeId) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === employeeId ? null : employeeId);
    };

    // --- CRUD Actions ---
    const handleEdit = async (e) => {
        e.preventDefault();

        if (!selectedEmployee) return;

        const updateData = {
            designation: formData.designation,
            employment_type: formData.employment_type,
            status: formData.status,
            permissions: formData.permissions
        };

        if (formData.name !== selectedEmployee.name) updateData.name = formData.name;
        if (formData.email !== selectedEmployee.email) updateData.email = formData.email;
        if (formData.phone !== selectedEmployee.phone) updateData.phone = formData.phone;
        if (formData.joining_date !== selectedEmployee.joining_date?.split('T')[0]) {
            updateData.joining_date = formData.joining_date;
        }

        const result = await updateEmployee(selectedEmployee.id, updateData);

        if (result.success) {
            closeModal();
        } else {
            setError(result.error);
        }
    };

    const handleDelete = async () => {
        if (!selectedEmployee) return;

        const result = await deleteEmployee(selectedEmployee.id);

        if (result.success) {
            closeModal();
        } else {
            setError(result.error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePermissionChange = (permissionId, isAllowed) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(perm =>
                perm.permission_id === permissionId
                    ? { ...perm, is_allowed: isAllowed }
                    : perm
            )
        }));
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Memoized helper functions to prevent unnecessary re-renders
    const getDesignationDisplay = useCallback((designationValue) => {
        const designation = constants.designations?.find(d => d.value === designationValue);
        return designation ? designation.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : designationValue || 'N/A';
    }, [constants.designations]);

    const getEmploymentTypeDisplay = useCallback((typeValue) => {
        const type = constants.employment_types?.find(t => t.value === typeValue);
        return type ? type.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : typeValue || 'N/A';
    }, [constants.employment_types]);

    const getStatusDisplay = useCallback((statusValue) => {
        const status = constants.employee_statuses?.find(s => s.value === statusValue);
        return status ? status.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : statusValue || 'N/A';
    }, [constants.employee_statuses]);

    const getStatusClassName = useCallback((statusValue) => {
        const statusColors = {
            'active': 'bg-green-100 text-green-800 border border-green-200',
            'inactive': 'bg-gray-100 text-gray-800 border border-gray-200',
            'suspended': 'bg-red-100 text-red-800 border border-red-200',
            'on_leave': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        };
        return statusColors[statusValue] || 'bg-gray-100 text-gray-800 border border-gray-200';
    }, []);

    // Pagination handlers
    const goToNextPage = useCallback(() => {
        if (!pagination.is_last_page) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }, [pagination.is_last_page]);

    const goToPrevPage = useCallback(() => {
        if (pagination.page > 1) {
            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        }
    }, [pagination.page]);

    // Determine which columns to show based on screen size
    const [visibleColumns, setVisibleColumns] = useState(() => ({
        showEmployeeCode: true,
        showName: true,
        showDesignation: window.innerWidth >= 768,
        showEmail: window.innerWidth >= 1024,
        showPhone: window.innerWidth >= 1280,
        showType: window.innerWidth >= 1024,
        showStatus: window.innerWidth >= 768,
        showJoiningDate: window.innerWidth >= 1280,
    }));

    // Update visible columns on resize with debounce
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setVisibleColumns({
                    showEmployeeCode: true,
                    showName: true,
                    showDesignation: window.innerWidth >= 768,
                    showEmail: window.innerWidth >= 1024,
                    showPhone: window.innerWidth >= 1280,
                    showType: window.innerWidth >= 1024,
                    showStatus: window.innerWidth >= 768,
                    showJoiningDate: window.innerWidth >= 1280,
                });
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Memoized options
    const designationOptions = useMemo(() => {
        return constants.designations?.map(des => ({
            value: des.value,
            label: des.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })) || [];
    }, [constants.designations]);

    const employmentTypeOptions = useMemo(() => {
        return constants.employment_types?.map(type => ({
            value: type.value,
            label: type.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })) || [];
    }, [constants.employment_types]);

    const statusOptions = useMemo(() => {
        return constants.employee_statuses?.map(status => ({
            value: status.value,
            label: status.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })) || [];
    }, [constants.employee_statuses]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Employee Management
                </h1>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex align-center justify-center gap-2">
                <div className="relative w-full mx-auto sm:mx-0">
                    <input
                        type="text"
                        placeholder="Search employees by name, email, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                    />
                    <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                </div>
                <select
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                >                    
                </select>
            </div>

            {/* Loading State */}
            {loading && !employees.length && <SkeletonComponent />}

            {/* Error State */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200"
                    >
                        Error: {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No Data State */}
            {!loading && !error && employees.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 bg-white rounded-xl shadow-md"
                >
                    <FaUserCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No employees found</p>
                </motion.div>
            )}

            {/* --- Responsive Display --- */}
            {!loading && !error && employees.length > 0 && (
                <>
                    {/* Table View */}
                    <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        {visibleColumns.showEmployeeCode && <th className="px-4 py-4">Employee Code</th>}
                                        {visibleColumns.showName && <th className="px-4 py-4">Name</th>}
                                        {visibleColumns.showDesignation && <th className="px-4 py-4">Designation</th>}
                                        {visibleColumns.showEmail && <th className="px-4 py-4">Email</th>}
                                        {visibleColumns.showPhone && <th className="px-4 py-4">Phone</th>}
                                        {visibleColumns.showType && <th className="px-4 py-4">Type</th>}
                                        {visibleColumns.showStatus && <th className="px-4 py-4">Status</th>}
                                        {visibleColumns.showJoiningDate && <th className="px-4 py-4">Joining Date</th>}
                                        <th className="px-4 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                            {visibleColumns.showEmployeeCode && (
                                                <td className="px-4 py-4 font-mono text-xs">{emp.employee_code}</td>
                                            )}
                                            {visibleColumns.showName && (
                                                <td className="px-4 py-4 font-medium">{emp.name}</td>
                                            )}
                                            {visibleColumns.showDesignation && (
                                                <td className="px-4 py-4">{getDesignationDisplay(emp.designation)}</td>
                                            )}
                                            {visibleColumns.showEmail && (
                                                <td className="px-4 py-4 truncate max-w-[150px]">{emp.email}</td>
                                            )}
                                            {visibleColumns.showPhone && (
                                                <td className="px-4 py-4">{emp.phone}</td>
                                            )}
                                            {visibleColumns.showType && (
                                                <td className="px-4 py-4">{getEmploymentTypeDisplay(emp.employment_type)}</td>
                                            )}
                                            {visibleColumns.showStatus && (
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(emp.status)}`}>
                                                        {getStatusDisplay(emp.status)}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.showJoiningDate && (
                                                <td className="px-4 py-4">{formatDate(emp.joining_date)}</td>
                                            )}
                                            <td className="px-4 py-4 text-right relative">
                                                <button
                                                    onClick={(e) => toggleActionMenu(e, emp.id)}
                                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <FaEllipsisV className="text-gray-600" />
                                                </button>

                                                <AnimatePresence>
                                                    {activeActionMenu === emp.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => openViewModal(emp)}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 flex items-center gap-2 transition-colors"
                                                            >
                                                                <FaEye size={14} /> View Details
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(emp)}
                                                                className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-600 flex items-center gap-2 transition-colors"
                                                            >
                                                                <FaEdit size={14} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(emp)}
                                                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors rounded-b-lg"
                                                            >
                                                                <FaTrash size={14} /> Delete
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {employees.map((emp) => (
                            <motion.div
                                key={emp.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-md p-4 border border-gray-100 relative"
                            >
                                <div className="flex items-start gap-3">
                                    <FaUserCircle className="text-gray-400 text-4xl flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-800 truncate">{emp.name}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(emp.status)}`}>
                                                {getStatusDisplay(emp.status)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono mt-1">{emp.employee_code}</p>
                                        <p className="text-sm text-gray-600 truncate">{getDesignationDisplay(emp.designation)}</p>
                                        <p className="text-xs text-gray-500 mt-2 truncate">{emp.email}</p>
                                        <p className="text-xs text-gray-500">{emp.phone}</p>
                                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                            <span>{getEmploymentTypeDisplay(emp.employment_type)}</span>
                                            <span>Joined: {formatDate(emp.joining_date)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-3 pt-2 border-t border-gray-100">
                                    <button onClick={() => openViewModal(emp)} className="text-blue-600 hover:text-blue-800 p-2">
                                        <FaEye size={18} />
                                    </button>
                                    <button onClick={() => openEditModal(emp)} className="text-green-600 hover:text-green-800 p-2">
                                        <FaEdit size={18} />
                                    </button>
                                    <button onClick={() => openDeleteModal(emp)} className="text-red-600 hover:text-red-800 p-2">
                                        <FaTrash size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                            <span className="font-medium">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>{' '}
                            of <span className="font-medium">{pagination.total}</span> results
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={goToPrevPage}
                                disabled={pagination.page === 1}
                                className={`px-3 py-1 rounded border flex items-center gap-1 ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <FaChevronLeft size={12} /> Previous
                            </button>
                            <span className="px-3 py-1 bg-blue-600 text-white rounded min-w-[40px] text-center">
                                {pagination.page}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={pagination.is_last_page}
                                className={`px-3 py-1 rounded border flex items-center gap-1 ${pagination.is_last_page ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next <FaChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Modals - Rest of the code remains the same */}
            <AnimatePresence>
                {modalType !== MODAL_TYPES.NONE && (
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* View Modal */}
                            {modalType === MODAL_TYPES.VIEW && selectedEmployee && (
                                <>
                                    <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                            <FaEye className="text-blue-600" /> Employee Details
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <FaTimes size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-2 flex items-center gap-4 pb-4 border-b">
                                                <FaUserCircle className="text-gray-400 text-5xl" />
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800">{selectedEmployee.name}</h3>
                                                    <p className="text-sm text-gray-600">{getDesignationDisplay(selectedEmployee.designation)}</p>
                                                </div>
                                            </div>

                                            <InfoItem label="Employee Code" value={selectedEmployee.employee_code} />
                                            <InfoItem label="Status" value={
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(selectedEmployee.status)}`}>
                                                    {getStatusDisplay(selectedEmployee.status)}
                                                </span>
                                            } />
                                            <InfoItem label="Email" value={selectedEmployee.email} />
                                            <InfoItem label="Phone" value={selectedEmployee.phone} />
                                            <InfoItem label="Employment Type" value={getEmploymentTypeDisplay(selectedEmployee.employment_type)} />
                                            <InfoItem label="Joining Date" value={formatDate(selectedEmployee.joining_date)} />

                                            {selectedEmployee.permissions && selectedEmployee.permissions.length > 0 && (
                                                <div className="col-span-2 mt-4">
                                                    <label className="text-sm font-semibold text-gray-600 block mb-2">Permissions</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {selectedEmployee.permissions.map((perm, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                                <span className="font-medium">{perm.name}</span>
                                                                {perm.is_allowed === 1 && <FaCheck className="text-green-600" size={12} />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={closeModal}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Edit Modal */}
                            {modalType === MODAL_TYPES.EDIT && (
                                <>
                                    <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                            <FaEdit className="text-green-600" /> Edit Employee
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <FaTimes size={20} />
                                        </button>
                                    </div>
                                    <form onSubmit={handleEdit} className="p-6">
                                        {constantsLoading ? (
                                            <div className="flex justify-center py-8">
                                                <FaSpinner className="animate-spin text-3xl text-blue-600" />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        label="Full Name"
                                                        name="name"
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                    <FormField
                                                        label="Designation"
                                                        name="designation"
                                                        type="select"
                                                        value={formData.designation}
                                                        onChange={handleInputChange}
                                                        options={designationOptions}
                                                        required
                                                    />
                                                    <FormField
                                                        label="Email"
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                    <FormField
                                                        label="Phone"
                                                        name="phone"
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                    <FormField
                                                        label="Employment Type"
                                                        name="employment_type"
                                                        type="select"
                                                        value={formData.employment_type}
                                                        onChange={handleInputChange}
                                                        options={employmentTypeOptions}
                                                        required
                                                    />
                                                    <FormField
                                                        label="Joining Date"
                                                        name="joining_date"
                                                        type="date"
                                                        value={formData.joining_date}
                                                        onChange={handleInputChange}
                                                    />
                                                    <FormField
                                                        label="Status"
                                                        name="status"
                                                        type="select"
                                                        value={formData.status}
                                                        onChange={handleInputChange}
                                                        options={statusOptions}
                                                        required
                                                    />
                                                </div>

                                                {/* Permissions Section */}
                                                {formData.permissions && formData.permissions.length > 0 && (
                                                    <div className="mt-6">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Permissions</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {formData.permissions.map((perm) => (
                                                                <div key={perm.permission_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                    <span className="font-medium text-gray-700">{perm.name}</span>
                                                                    <div className="flex items-center gap-3">
                                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`permission_${perm.permission_id}`}
                                                                                checked={perm.is_allowed === 1}
                                                                                onChange={() => handlePermissionChange(perm.permission_id, 1)}
                                                                                className="w-4 h-4 text-green-600"
                                                                            />
                                                                            <span className="text-sm text-green-600">Allow</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                                            <input
                                                                                type="radio"
                                                                                name={`permission_${perm.permission_id}`}
                                                                                checked={perm.is_allowed === 0}
                                                                                onChange={() => handlePermissionChange(perm.permission_id, 0)}
                                                                                className="w-4 h-4 text-red-600"
                                                                            />
                                                                            <span className="text-sm text-red-600">Deny</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
                                                    <button
                                                        type="button"
                                                        onClick={closeModal}
                                                        className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

                            {/* Delete Confirmation Modal */}
                            {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedEmployee && (
                                <>
                                    <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
                                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                            <FaTrash className="text-red-600" /> Confirm Delete
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                            <FaTimes size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaTrash className="text-3xl text-red-600" />
                                            </div>
                                            <p className="text-lg text-gray-700 mb-2">Are you sure?</p>
                                            <p className="text-gray-500 mb-6">
                                                You are about to delete <span className="font-semibold">{selectedEmployee.name}</span>.
                                                This action cannot be undone.
                                            </p>
                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={closeModal}
                                                    className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={loading}
                                                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                                    Delete Employee
                                                </button>
                                            </div>
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
const InfoItem = ({ label, value }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 block mb-1">{label}</label>
        <div className="text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200">{value}</div>
    </div>
);

const FormField = ({ label, name, type, value, onChange, options, required, disabled }) => {
    if (type === 'select') {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">Select {label}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
        </div>
    );
};

export default EmployeeManagement;