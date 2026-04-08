import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaBuilding, FaEdit, FaTrash, FaEye, FaTimes, FaCheck,
    FaSearch, FaSpinner, FaEllipsisV, FaMapMarkerAlt,
    FaGlobe, FaCity, FaRoad, FaEnvelope, FaLink, FaMapPin,
    FaPlus, FaMinusCircle, FaUserCircle, FaCalendarAlt,
    FaIdCard, FaPhone, FaBriefcase, FaNetworkWired,
    FaShieldAlt, FaClock, FaSave, FaInfoCircle,
    FaUsers, FaCog, FaDatabase, FaCloudUploadAlt,
    FaServer, FaLock, FaUnlockAlt, FaBell, FaEnvelopeOpen
} from 'react-icons/fa';
import { FaPalette } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import SkeletonComponent from '../components/SkeletonComponent';
import Pagination, { usePagination } from '../components/PaginationComponent';
import CreateCompanyModal from '../components/CompanyModals/CreateCompanyModal';
import EditCompanyModal from '../components/CompanyModals/EditCompanyModal';
import usePermissionAccess from '../hooks/usePermissionAccess';
// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
    SETTINGS: 'SETTINGS',
    BRANDING: 'BRANDING',
    SECURITY: 'SECURITY',
    NOTIFICATIONS: 'NOTIFICATIONS',
    BACKUP: 'BACKUP'
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

// ─── Helper Components ───────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value, className = "" }) => (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 ${className}`}>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
            {icon}{label}
        </label>
        <div className="text-gray-800 font-medium">{value || 'Not specified'}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const isActive = status === 1 || status === 'active';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {isActive ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
};

const SettingCard = ({ icon, title, description, onClick, className = "" }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer ${className}`}
    >
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    </motion.div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const CompanySettings = () => {
    const { checkActionAccess, getAccessMessage } = usePermissionAccess();
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Company settings states
    const [companySettings, setCompanySettings] = useState({
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        week_start: 'Monday',
        working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        office_hours: {
            start: '09:00',
            end: '18:00'
        },
        break_hours: {
            start: '13:00',
            end: '14:00'
        },
        overtime_enabled: true,
        overtime_rate: 1.5,
        holiday_calendar: [],
        leave_policy: {
            annual_leave: 12,
            sick_leave: 10,
            casual_leave: 6
        }
    });
    
    const [brandingSettings, setBrandingSettings] = useState({
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6',
        logo_url: '',
        favicon_url: '',
        company_name_display: 'full',
        email_template: 'default'
    });
    
    const [securitySettings, setSecuritySettings] = useState({
        two_factor_auth: false,
        session_timeout: 30,
        password_policy: {
            min_length: 8,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: true,
            expiry_days: 90
        },
        ip_whitelist: [],
        allowed_domains: []
    });
    
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: {
            new_employee: true,
            leave_requests: true,
            attendance_alerts: true,
            payroll_processed: true,
            system_updates: true
        },
        push_notifications: {
            attendance_reminders: true,
            leave_approved: true,
            schedule_changes: true
        },
        sms_notifications: {
            emergency_alerts: true,
            attendance_verification: false
        }
    });
    
    const {
        pagination,
        updatePagination,
        goToPage,
    } = usePagination(1, 10);
    const updateCompanyAccess = checkActionAccess('companySettings', 'updateCompany');
    const updateSettingsAccess = checkActionAccess('companySettings', 'updateSettings');
    const updateBrandingAccess = checkActionAccess('companySettings', 'updateBranding');
    const updateSecurityAccess = checkActionAccess('companySettings', 'updateSecurity');
    const updateNotificationsAccess = checkActionAccess('companySettings', 'updateNotifications');
    const deleteCompanyAccess = checkActionAccess('companySettings', 'delete');
    const updateCompanyMessage = getAccessMessage(updateCompanyAccess);
    const updateSettingsMessage = getAccessMessage(updateSettingsAccess);
    const updateBrandingMessage = getAccessMessage(updateBrandingAccess);
    const updateSecurityMessage = getAccessMessage(updateSecurityAccess);
    const updateNotificationsMessage = getAccessMessage(updateNotificationsAccess);
    const deleteCompanyMessage = getAccessMessage(deleteCompanyAccess);
    
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);
    
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
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
                fetchCompanies(1);
            }
        }
    }, [debouncedSearchTerm, filterStatus]);
    
    // ─── API Calls ────────────────────────────────────────────────────────────────
    
    const fetchCompanies = useCallback(async (page = pagination.page, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString()
            });
            
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            
            const response = await apiCall(`/company/list?${params}`, 'GET');
            const result = await response.json();
            
            if (result.success) {
                setCompanies(result.data);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? (page === result.pagination?.total_pages)
                });
            } else {
                throw new Error(result.message || 'Failed to fetch companies');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to fetch companies');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearchTerm, filterStatus, updatePagination]);
    
    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchCompanies(1, true);
            initialFetchDone.current = true;
        }
    }, [fetchCompanies]);
    
    useEffect(() => {
        if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
            fetchCompanies(pagination.page, true);
        }
    }, [pagination.page, fetchCompanies]);
    
    const fetchCompanySettings = useCallback(async (companyId) => {
        try {
            const response = await apiCall(`/company/settings/${companyId}`, 'GET');
            const result = await response.json();
            if (result.success && result.data) {
                setCompanySettings(prev => ({ ...prev, ...result.data.settings }));
                setBrandingSettings(prev => ({ ...prev, ...result.data.branding }));
                setSecuritySettings(prev => ({ ...prev, ...result.data.security }));
                setNotificationSettings(prev => ({ ...prev, ...result.data.notifications }));
            }
        } catch (e) {
            console.error('Failed to fetch company settings:', e);
        }
    }, []);
    
    const updateCompany = async (id, updatedData) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(updatedData).forEach(key => {
                if (updatedData[key] !== null && updatedData[key] !== undefined) {
                    if (key === 'logo_url' && updatedData[key] instanceof File) {
                        formData.append(key, updatedData[key]);
                    } else if (typeof updatedData[key] === 'object') {
                        formData.append(key, JSON.stringify(updatedData[key]));
                    } else {
                        formData.append(key, updatedData[key]);
                    }
                }
            });
            
            const response = await apiCall(`/company/update/${id}`, 'PUT', formData);
            const result = await response.json();
            
            if (result.success) {
                await fetchCompanies(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Update failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    const deleteCompany = async (id) => {
        setLoading(true);
        try {
            const response = await apiCall(`/company/delete/${id}`, 'DELETE');
            const result = await response.json();
            
            if (result.success) {
                await fetchCompanies(pagination.page, false);
                return { success: true };
            }
            throw new Error(result.message || 'Delete failed');
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    const updateCompanySettings = async (settingsType, settingsData) => {
        setLoading(true);
        try {
            const payload = {
                [settingsType]: settingsData
            };
            
            const response = await apiCall(`/company/settings/${selectedCompany.id}`, 'PUT', payload);
            const result = await response.json();
            
            if (result.success) {
                toast.success(`${settingsType} settings updated successfully!`);
                return { success: true };
            }
            throw new Error(result.message || 'Update failed');
        } catch (e) {
            toast.error(e.message || 'Failed to update settings');
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };
    
    // ─── Modal Handlers ──────────────────────────────────────────────────────
    
    const openCreateModal = () => {
        setModalType(MODAL_TYPES.CREATE);
        setActiveActionMenu(null);
    };
    
    const openEditModal = async (company) => {
        if (updateCompanyAccess.disabled) return;
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.EDIT);
        setActiveActionMenu(null);
    };
    
    const openViewModal = async (company) => {
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.VIEW);
        setActiveActionMenu(null);
    };
    
    const openDeleteModal = (company) => {
        if (deleteCompanyAccess.disabled) return;
        setSelectedCompany(company);
        setModalType(MODAL_TYPES.DELETE_CONFIRM);
        setActiveActionMenu(null);
    };
    
    const openSettingsModal = async (company) => {
        if (updateSettingsAccess.disabled) return;
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.SETTINGS);
        setActiveActionMenu(null);
    };
    
    const openBrandingModal = async (company) => {
        if (updateBrandingAccess.disabled) return;
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.BRANDING);
        setActiveActionMenu(null);
    };
    
    const openSecurityModal = async (company) => {
        if (updateSecurityAccess.disabled) return;
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.SECURITY);
        setActiveActionMenu(null);
    };
    
    const openNotificationsModal = async (company) => {
        if (updateNotificationsAccess.disabled) return;
        setSelectedCompany(company);
        await fetchCompanySettings(company.id);
        setModalType(MODAL_TYPES.NOTIFICATIONS);
        setActiveActionMenu(null);
    };
    
    const closeModal = () => {
        setModalType(MODAL_TYPES.NONE);
        setSelectedCompany(null);
    };
    
    const toggleActionMenu = (e, id) => {
        e.stopPropagation();
        setActiveActionMenu(activeActionMenu === id ? null : id);
    };
    
    // ─── Form Handlers ───────────────────────────────────────────────────────
    
    const handleCompanyCreated = async () => {
        await fetchCompanies(1, true);
    };
    
    const handleCompanyUpdate = async (id, data) => {
        const result = await updateCompany(id, data);
        if (result.success) {
            toast.success('Company updated successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to update company');
        }
    };
    
    const handleCompanyDelete = async () => {
        if (deleteCompanyAccess.disabled) return;
        if (!selectedCompany) return;
        const result = await deleteCompany(selectedCompany.id);
        if (result.success) {
            toast.success('Company deleted successfully!');
            closeModal();
        } else {
            toast.error(result.error || 'Failed to delete company');
        }
    };
    
    const handleSettingsUpdate = async (settingsData) => {
        if (updateSettingsAccess.disabled) return;
        const result = await updateCompanySettings('settings', settingsData);
        if (result.success) {
            setCompanySettings(prev => ({ ...prev, ...settingsData }));
        }
    };
    
    const handleBrandingUpdate = async (brandingData) => {
        if (updateBrandingAccess.disabled) return;
        const result = await updateCompanySettings('branding', brandingData);
        if (result.success) {
            setBrandingSettings(prev => ({ ...prev, ...brandingData }));
        }
    };
    
    const handleSecurityUpdate = async (securityData) => {
        if (updateSecurityAccess.disabled) return;
        const result = await updateCompanySettings('security', securityData);
        if (result.success) {
            setSecuritySettings(prev => ({ ...prev, ...securityData }));
        }
    };
    
    const handleNotificationsUpdate = async (notificationsData) => {
        if (updateNotificationsAccess.disabled) return;
        const result = await updateCompanySettings('notifications', notificationsData);
        if (result.success) {
            setNotificationSettings(prev => ({ ...prev, ...notificationsData }));
        }
    };
    
    // ─── Helpers ─────────────────────────────────────────────────────────────
    
    const formatDate = (s) => {
        if (!s) return 'N/A';
        return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    const getCompanyLogo = (company) => {
        if (company.logo_url && company.logo_url !== 'null') {
            return company.logo_url;
        }
        return null;
    };
    
    // ─── Render ──────────────────────────────────────────────────────────────
    
    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Company Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage company profiles and system settings</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <FaPlus className="w-4 h-4" />
                        New Company
                    </button>
                    <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                        Total: {pagination.total} companies
                    </div>
                </div>
            </motion.div>
            
            {/* Search and Filter */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="mb-6"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Search companies by name, legal name, or email..."
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
                        />
                        <FaSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white shadow-lg"
                    >
                        <option value="all">All Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </motion.div>
            
            {loading && !companies.length && <SkeletonComponent />}
            
            {!loading && companies.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
                    <FaBuilding className="text-8xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl text-gray-500">No companies found</p>
                    <p className="text-gray-400 mt-2">Create your first company to get started</p>
                </motion.div>
            )}
            
            {!loading && companies.length > 0 && (
                <>
                    {/* Company Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company, index) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-xl overflow-visible border border-gray-100 hover:shadow-2xl transition-all duration-300"
                            >
                                {/* Company Header */}
                                <div className="relative h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                                    <div className="absolute -bottom-12 left-6">
                                        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white">
                                            {getCompanyLogo(company) ? (
                                                <img 
                                                    src={getCompanyLogo(company)} 
                                                    alt={company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FaBuilding className="w-10 h-10 text-indigo-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <StatusBadge status={company.status} />
                                    </div>
                                </div>
                                
                                {/* Company Info */}
                                <div className="pt-14 p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{company.name}</h3>
                                            <p className="text-sm text-gray-500">{company.legal_name}</p>
                                        </div>
                                        <div className="relative">
                                            <button 
                                                onClick={e => toggleActionMenu(e, company.id)} 
                                                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300"
                                            >
                                                <FaEllipsisV className="text-gray-600" />
                                            </button>
                                            <AnimatePresence>
                                                {activeActionMenu === company.id && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <button onClick={() => openViewModal(company)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all">
                                                            <FaEye size={14} /> View Details
                                                        </button>
                                                        <button onClick={() => openEditModal(company)} disabled={updateCompanyAccess.disabled} title={updateCompanyAccess.disabled ? updateCompanyMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaEdit size={14} /> Edit Company
                                                        </button>
                                                        <button onClick={() => openSettingsModal(company)} disabled={updateSettingsAccess.disabled} title={updateSettingsAccess.disabled ? updateSettingsMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-indigo-600 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaCog size={14} /> System Settings
                                                        </button>
                                                        <button onClick={() => openBrandingModal(company)} disabled={updateBrandingAccess.disabled} title={updateBrandingAccess.disabled ? updateBrandingMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 text-pink-600 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaPalette size={14} /> Branding
                                                        </button>
                                                        <button onClick={() => openSecurityModal(company)} disabled={updateSecurityAccess.disabled} title={updateSecurityAccess.disabled ? updateSecurityMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 text-red-600 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaLock size={14} /> Security
                                                        </button>
                                                        <button onClick={() => openNotificationsModal(company)} disabled={updateNotificationsAccess.disabled} title={updateNotificationsAccess.disabled ? updateNotificationsMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 text-yellow-600 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaBell size={14} /> Notifications
                                                        </button>
                                                        <button onClick={() => openDeleteModal(company)} disabled={deleteCompanyAccess.disabled} title={deleteCompanyAccess.disabled ? deleteCompanyMessage : ''} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all border-t border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                            <FaTrash size={14} /> Delete Company
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    
                                    {/* Contact Info */}
                                    <div className="space-y-2 mt-4">
                                        {company.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaEnvelope className="text-gray-400" />
                                                <span className="truncate">{company.email}</span>
                                            </div>
                                        )}
                                        {company.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaPhone className="text-gray-400" />
                                                <span>{company.phone}</span>
                                            </div>
                                        )}
                                        {company.city && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FaCity className="text-gray-400" />
                                                <span>{company.city}, {company.state}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-indigo-600">
                                                {company.employee_count || 0}
                                            </div>
                                            <div className="text-xs text-gray-500">Employees</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-indigo-600">
                                                {formatDate(company.created_at).split(',')[0]}
                                            </div>
                                            <div className="text-xs text-gray-500">Created</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Pagination */}
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={goToPage}
                        variant="default"
                        showInfo={true}
                    />
                </>
            )}
            
            {/* Modals */}
            <CreateCompanyModal
                isOpen={modalType === MODAL_TYPES.CREATE}
                onClose={closeModal}
                onSuccess={handleCompanyCreated}
                onCompanyCreated={handleCompanyCreated}
            />
            
            <EditCompanyModal
                isOpen={modalType === MODAL_TYPES.EDIT}
                onClose={closeModal}
                onSuccess={handleCompanyUpdate}
                company={selectedCompany}
                submitDisabled={updateCompanyAccess.disabled}
                submitTitle={updateCompanyAccess.disabled ? updateCompanyMessage : ''}
            />
            
            {/* VIEW MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.VIEW && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                            <FaEye className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">View comprehensive company information</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                        <FaTimes className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Logo */}
                                    <div className="md:col-span-2 flex items-center gap-6 pb-6 border-b">
                                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center overflow-hidden">
                                            {getCompanyLogo(selectedCompany) ? (
                                                <img 
                                                    src={getCompanyLogo(selectedCompany)} 
                                                    alt={selectedCompany.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FaBuilding className="text-white text-4xl" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800">{selectedCompany.name}</h3>
                                            <p className="text-gray-600">{selectedCompany.legal_name}</p>
                                            <div className="mt-2">
                                                <StatusBadge status={selectedCompany.status} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <InfoItem icon={<FaIdCard className="text-blue-500" />} label="Company ID" value={selectedCompany.id} />
                                    <InfoItem icon={<FaEnvelope className="text-green-500" />} label="Email" value={selectedCompany.email || 'N/A'} />
                                    <InfoItem icon={<FaPhone className="text-orange-500" />} label="Phone" value={selectedCompany.phone || 'N/A'} />
                                    <InfoItem icon={<FaCalendarAlt className="text-purple-500" />} label="Created On" value={formatDate(selectedCompany.created_at)} />
                                    
                                    {/* Address */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                            <FaMapMarkerAlt className="text-indigo-500" />
                                            Address
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <p className="text-gray-700">
                                                {selectedCompany.address_line1}
                                                {selectedCompany.address_line2 && <>, {selectedCompany.address_line2}</>}
                                                <br />
                                                {selectedCompany.city && <>{selectedCompany.city}, </>}
                                                {selectedCompany.state && <>{selectedCompany.state} - </>}
                                                {selectedCompany.postal_code}
                                                <br />
                                                {selectedCompany.country}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Location */}
                                    {(selectedCompany.latitude || selectedCompany.longitude) && (
                                        <div className="md:col-span-2">
                                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                                <FaMapPin className="text-red-500" />
                                                Location Coordinates
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InfoItem icon={<FaMapPin />} label="Latitude" value={selectedCompany.latitude || 'N/A'} />
                                                <InfoItem icon={<FaMapPin />} label="Longitude" value={selectedCompany.longitude || 'N/A'} />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* IP Whitelist */}
                                    {selectedCompany.company_ip && selectedCompany.company_ip.length > 0 && (
                                        <div className="md:col-span-2">
                                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                                <FaNetworkWired className="text-indigo-500" />
                                                Allowed IP Addresses
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(selectedCompany.company_ip) ? selectedCompany.company_ip : JSON.parse(selectedCompany.company_ip || '[]')).map((ip, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-mono">
                                                        {ip}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 flex justify-end gap-3">
                                    <button 
                                        onClick={closeModal} 
                                        className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-medium"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => {
                                            closeModal();
                                            openEditModal(selectedCompany);
                                        }}
                                        disabled={updateCompanyAccess.disabled}
                                        title={updateCompanyAccess.disabled ? updateCompanyMessage : ''}
                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <FaEdit className="inline mr-2" />
                                        Edit Company
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* SETTINGS MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.SETTINGS && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <FaCog className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Company Settings</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">Configure system settings for {selectedCompany.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                        <FaTimes className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Time & Date Settings */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaClock className="text-indigo-500" />
                                            Time & Date Settings
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                                <select
                                                    value={companySettings.timezone}
                                                    onChange={(e) => setCompanySettings(prev => ({ ...prev, timezone: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                >
                                                    <option value="Asia/Kolkata">India (IST)</option>
                                                    <option value="Asia/Dubai">UAE (GST)</option>
                                                    <option value="America/New_York">USA (EST)</option>
                                                    <option value="Europe/London">UK (GMT)</option>
                                                    <option value="Asia/Singapore">Singapore (SGT)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                                                <select
                                                    value={companySettings.date_format}
                                                    onChange={(e) => setCompanySettings(prev => ({ ...prev, date_format: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                >
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                                                <select
                                                    value={companySettings.time_format}
                                                    onChange={(e) => setCompanySettings(prev => ({ ...prev, time_format: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                >
                                                    <option value="12h">12-hour (AM/PM)</option>
                                                    <option value="24h">24-hour</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Week Starts On</label>
                                                <select
                                                    value={companySettings.week_start}
                                                    onChange={(e) => setCompanySettings(prev => ({ ...prev, week_start: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                >
                                                    <option value="Monday">Monday</option>
                                                    <option value="Sunday">Sunday</option>
                                                    <option value="Saturday">Saturday</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Working Hours */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaBuilding className="text-indigo-500" />
                                            Working Hours
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Office Start Time</label>
                                                <input
                                                    type="time"
                                                    value={companySettings.office_hours.start}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        office_hours: { ...prev.office_hours, start: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Office End Time</label>
                                                <input
                                                    type="time"
                                                    value={companySettings.office_hours.end}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        office_hours: { ...prev.office_hours, end: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Break Start Time</label>
                                                <input
                                                    type="time"
                                                    value={companySettings.break_hours.start}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        break_hours: { ...prev.break_hours, start: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Break End Time</label>
                                                <input
                                                    type="time"
                                                    value={companySettings.break_hours.end}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        break_hours: { ...prev.break_hours, end: e.target.value }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={companySettings.overtime_enabled}
                                                    onChange={(e) => setCompanySettings(prev => ({ ...prev, overtime_enabled: e.target.checked }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Enable Overtime Tracking</span>
                                            </label>
                                            {companySettings.overtime_enabled && (
                                                <div className="mt-2 ml-6">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Overtime Rate</label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={companySettings.overtime_rate}
                                                        onChange={(e) => setCompanySettings(prev => ({ ...prev, overtime_rate: parseFloat(e.target.value) }))}
                                                        className="w-32 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-500">x base salary</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Leave Policy */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaCalendarAlt className="text-indigo-500" />
                                            Leave Policy
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Leave (days/year)</label>
                                                <input
                                                    type="number"
                                                    value={companySettings.leave_policy.annual_leave}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        leave_policy: { ...prev.leave_policy, annual_leave: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Sick Leave (days/year)</label>
                                                <input
                                                    type="number"
                                                    value={companySettings.leave_policy.sick_leave}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        leave_policy: { ...prev.leave_policy, sick_leave: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Casual Leave (days/year)</label>
                                                <input
                                                    type="number"
                                                    value={companySettings.leave_policy.casual_leave}
                                                    onChange={(e) => setCompanySettings(prev => ({
                                                        ...prev,
                                                        leave_policy: { ...prev.leave_policy, casual_leave: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSettingsUpdate(companySettings)}
                                        disabled={loading || updateSettingsAccess.disabled}
                                        title={updateSettingsAccess.disabled ? updateSettingsMessage : ''}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* BRANDING MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.BRANDING && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                                            <FaPalette className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Branding Settings</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">Customize your company's appearance</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                        <FaTimes className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Color Settings */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Color Scheme</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={brandingSettings.primary_color}
                                                        onChange={(e) => setBrandingSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={brandingSettings.primary_color}
                                                        onChange={(e) => setBrandingSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={brandingSettings.secondary_color}
                                                        onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                                                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={brandingSettings.secondary_color}
                                                        onChange={(e) => setBrandingSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Logo Settings */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo & Favicon</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setBrandingSettings(prev => ({ ...prev, logo_url: reader.result }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                                {brandingSettings.logo_url && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                                        <img 
                                                            src={brandingSettings.logo_url} 
                                                            alt="Logo Preview" 
                                                            className="h-20 w-auto object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                                                <input
                                                    type="file"
                                                    accept="image/x-icon,image/png"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setBrandingSettings(prev => ({ ...prev, favicon_url: reader.result }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Display Settings */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Settings</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name Display</label>
                                            <select
                                                value={brandingSettings.company_name_display}
                                                onChange={(e) => setBrandingSettings(prev => ({ ...prev, company_name_display: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="full">Full Name</option>
                                                <option value="short">Short Name</option>
                                                <option value="logo_only">Logo Only</option>
                                            </select>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
                                            <select
                                                value={brandingSettings.email_template}
                                                onChange={(e) => setBrandingSettings(prev => ({ ...prev, email_template: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                            >
                                                <option value="default">Default Template</option>
                                                <option value="modern">Modern Template</option>
                                                <option value="minimal">Minimal Template</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleBrandingUpdate(brandingSettings)}
                                        disabled={loading || updateBrandingAccess.disabled}
                                        title={updateBrandingAccess.disabled ? updateBrandingMessage : ''}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-medium hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Save Branding
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* SECURITY MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.SECURITY && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                                            <FaLock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">Configure security policies and access controls</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                        <FaTimes className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Authentication Settings */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Authentication</h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.two_factor_auth}
                                                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, two_factor_auth: e.target.checked }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Enable Two-Factor Authentication (2FA)</span>
                                            </label>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                                                <input
                                                    type="number"
                                                    value={securitySettings.session_timeout}
                                                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                                                    className="w-32 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Password Policy */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Password Policy</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
                                                <input
                                                    type="number"
                                                    min="6"
                                                    max="20"
                                                    value={securitySettings.password_policy.min_length}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, min_length: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                                                <input
                                                    type="number"
                                                    value={securitySettings.password_policy.expiry_days}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, expiry_days: parseInt(e.target.value) }
                                                    }))}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.password_policy.require_uppercase}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, require_uppercase: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Require Uppercase Letters</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.password_policy.require_lowercase}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, require_lowercase: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Require Lowercase Letters</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.password_policy.require_numbers}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, require_numbers: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Require Numbers</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securitySettings.password_policy.require_special_chars}
                                                    onChange={(e) => setSecuritySettings(prev => ({
                                                        ...prev,
                                                        password_policy: { ...prev.password_policy, require_special_chars: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">Require Special Characters (@, #, $, etc.)</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* IP Whitelist */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">IP Whitelist</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter IP address"
                                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const input = e.target;
                                                            const ip = input.value.trim();
                                                            if (ip) {
                                                                setSecuritySettings(prev => ({
                                                                    ...prev,
                                                                    ip_whitelist: [...prev.ip_whitelist, ip]
                                                                }));
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.querySelector('input[placeholder="Enter IP address"]');
                                                        const ip = input?.value.trim();
                                                        if (ip) {
                                                            setSecuritySettings(prev => ({
                                                                ...prev,
                                                                ip_whitelist: [...prev.ip_whitelist, ip]
                                                            }));
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                                >
                                                    <FaPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {securitySettings.ip_whitelist.map((ip, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                        <span className="text-sm font-mono">{ip}</span>
                                                        <button
                                                            onClick={() => setSecuritySettings(prev => ({
                                                                ...prev,
                                                                ip_whitelist: prev.ip_whitelist.filter((_, i) => i !== idx)
                                                            }))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <FaTimes className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Allowed Domains */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Allowed Email Domains</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="e.g., company.com"
                                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const input = e.target;
                                                            const domain = input.value.trim();
                                                            if (domain) {
                                                                setSecuritySettings(prev => ({
                                                                    ...prev,
                                                                    allowed_domains: [...prev.allowed_domains, domain]
                                                                }));
                                                                input.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.querySelector('input[placeholder="e.g., company.com"]');
                                                        const domain = input?.value.trim();
                                                        if (domain) {
                                                            setSecuritySettings(prev => ({
                                                                ...prev,
                                                                allowed_domains: [...prev.allowed_domains, domain]
                                                            }));
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                                >
                                                    <FaPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {securitySettings.allowed_domains.map((domain, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                                        <span className="text-sm">@{domain}</span>
                                                        <button
                                                            onClick={() => setSecuritySettings(prev => ({
                                                                ...prev,
                                                                allowed_domains: prev.allowed_domains.filter((_, i) => i !== idx)
                                                            }))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <FaTimes className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleSecurityUpdate(securitySettings)}
                                        disabled={loading || updateSecurityAccess.disabled}
                                        title={updateSecurityAccess.disabled ? updateSecurityMessage : ''}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium hover:from-red-700 hover:to-orange-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Save Security Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* NOTIFICATIONS MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.NOTIFICATIONS && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                                            <FaBell className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                                            <p className="text-sm text-gray-500 mt-0.5">Configure email, push, and SMS notifications</p>
                                        </div>
                                    </div>
                                    <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                        <FaTimes className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                <div className="space-y-8">
                                    {/* Email Notifications */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaEnvelope className="text-indigo-500" />
                                            Email Notifications
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">New Employee Added</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.email_notifications.new_employee}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        email_notifications: { ...prev.email_notifications, new_employee: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Leave Requests</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.email_notifications.leave_requests}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        email_notifications: { ...prev.email_notifications, leave_requests: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Attendance Alerts</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.email_notifications.attendance_alerts}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        email_notifications: { ...prev.email_notifications, attendance_alerts: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Payroll Processed</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.email_notifications.payroll_processed}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        email_notifications: { ...prev.email_notifications, payroll_processed: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">System Updates</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.email_notifications.system_updates}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        email_notifications: { ...prev.email_notifications, system_updates: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* Push Notifications */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaBell className="text-indigo-500" />
                                            Push Notifications
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Attendance Reminders</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.push_notifications.attendance_reminders}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        push_notifications: { ...prev.push_notifications, attendance_reminders: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Leave Approved</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.push_notifications.leave_approved}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        push_notifications: { ...prev.push_notifications, leave_approved: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Schedule Changes</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.push_notifications.schedule_changes}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        push_notifications: { ...prev.push_notifications, schedule_changes: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* SMS Notifications */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaPhone className="text-indigo-500" />
                                            SMS Notifications
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Emergency Alerts</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.sms_notifications.emergency_alerts}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        sms_notifications: { ...prev.sms_notifications, emergency_alerts: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <span className="text-sm text-gray-700">Attendance Verification</span>
                                                <input
                                                    type="checkbox"
                                                    checked={notificationSettings.sms_notifications.attendance_verification}
                                                    onChange={(e) => setNotificationSettings(prev => ({
                                                        ...prev,
                                                        sms_notifications: { ...prev.sms_notifications, attendance_verification: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleNotificationsUpdate(notificationSettings)}
                                        disabled={loading || updateNotificationsAccess.disabled}
                                        title={updateNotificationsAccess.disabled ? updateNotificationsMessage : ''}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-medium hover:from-yellow-700 hover:to-amber-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        Save Notification Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* DELETE CONFIRM MODAL */}
            <AnimatePresence>
                {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedCompany && (
                    <motion.div 
                        variants={backdropVariants} 
                        initial="hidden" 
                        animate="visible" 
                        exit="exit"
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            variants={modalVariants}
                            className="relative flex w-full max-w-lg max-h-[90vh] flex-col bg-white rounded-2xl shadow-2xl overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                                        <FaTrash className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Delete Company</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-1 flex-col justify-center p-6 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaTrash className="text-4xl text-red-600" />
                                </div>
                                <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                                <p className="text-gray-500 mb-6">
                                    You are about to permanently delete <span className="font-semibold text-red-600">{selectedCompany.name}</span>.<br />
                                    This will remove all associated data including employees, attendance records, and leave requests.
                                </p>
                                <div className="flex flex-col-reverse justify-center gap-3 sm:flex-row sm:gap-4">
                                    <button 
                                        onClick={closeModal} 
                                        className="px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCompanyDelete} 
                                        disabled={loading || deleteCompanyAccess.disabled}
                                        title={deleteCompanyAccess.disabled ? deleteCompanyMessage : ''}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all font-medium disabled:opacity-50 shadow-lg"
                                    >
                                        {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={14} />}
                                        Delete Company
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

export default CompanySettings;
