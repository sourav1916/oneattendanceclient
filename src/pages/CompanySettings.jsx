import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaPlus, FaSpinner, FaCheckCircle,
    FaTimesCircle, FaExclamationTriangle, FaTimes,
    FaEdit, FaTrash, FaInfoCircle,
    FaListUl, FaTh, FaEye,
    FaBuilding, FaMapMarkerAlt, FaGlobe, FaSearch,
    FaClock, FaNetworkWired, FaUserCheck, FaRoad, FaCity,
    FaCrosshairs, FaHistory, FaLink, FaMapPin, FaEnvelope,
    FaCheck, FaMinusCircle, FaCog
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ModalScrollLock from '../components/ModalScrollLock';
import CreateCompanyModal from '../components/CompanyModals/CreateCompanyModal';
import EditCompanyModal from '../components/CompanyModals/EditCompanyModal';
import ManageMoreCompanyModal from '../components/CompanyModals/ManageMoreCompanyModal';

// ─── Variants ─────────────────────────────────────────────────────────────────

const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.45 } },
    exit: { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.25 } }
};
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarPalette = [
    { bg: '#EEF2FF', text: '#4338CA' },
    { bg: '#F0FDF4', text: '#15803D' },
    { bg: '#FFF7ED', text: '#C2410C' },
    { bg: '#FDF4FF', text: '#9333EA' },
    { bg: '#EFF6FF', text: '#1D4ED8' },
];

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// FIXED: Parse IPs to handle both object and string formats
function parseIPs(ips) {
    if (!ips) return [];

    // If it's not an array, try to parse or handle as string
    if (!Array.isArray(ips)) {
        if (typeof ips === 'string') {
            try {
                const parsed = JSON.parse(ips);
                if (Array.isArray(parsed)) {
                    ips = parsed;
                } else {
                    return [];
                }
            } catch {
                // Not JSON, treat as single string
                return [ips];
            }
        } else {
            return [];
        }
    }

    if (ips.length === 0) return [];

    // Check if first item has ip_v4 property (object format from API)
    if (ips[0] && typeof ips[0] === 'object' && ips[0].ip_v4) {
        return ips.map(item => item.ip_v4).filter(Boolean);
    }

    // Handle array of strings
    if (typeof ips[0] === 'string') {
        return ips;
    }

    return [];
}

// ─── Small Reusable Components ────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            {icon} {label}
        </label>
        <div className="text-gray-800 font-semibold text-sm break-words">{value || '—'}</div>
    </div>
);

const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
        ${isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const SummaryCard = ({ icon, label, value, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className={`bg-gradient-to-r ${gradient} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs opacity-80 mb-1">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {icon}
            </div>
        </div>
    </motion.div>
);

// ─── Company Detail Modal ─────────────────────────────────────────────────────

const CompanyDetailModal = ({ company, onClose, onEdit, onDelete }) => {
    if (!company) return null;
    const idx = company.id % 5;
    const ips = parseIPs(company.company_ips || []);

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                <FaBuilding className="text-base" />
                            </div>
                            <h2 className="text-lg font-bold">Company Details</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                            <FaTimes size={17} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Identity */}
                        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
                            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black overflow-hidden shadow-lg ring-4 ring-white flex-shrink-0"
                                style={{ background: avatarPalette[idx].bg, color: avatarPalette[idx].text }}>
                                {company.logo_url
                                    ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                    : getInitials(company.name)}
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-2xl font-black text-gray-900">{company.name}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{company.legal_name}</p>
                                <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                                    <StatusBadge isActive={company.is_active} />
                                    <span className="text-xs text-gray-300 font-mono">#{company.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-3 bg-blue-500 rounded-full" /> Address Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoItem icon={<FaRoad className="text-blue-400" />} label="Address Line 1" value={company.address_line1} />
                                <InfoItem icon={<FaRoad className="text-blue-400" />} label="Address Line 2" value={company.address_line2} />
                                <InfoItem icon={<FaCity className="text-blue-400" />} label="City" value={company.city} />
                                <InfoItem icon={<FaGlobe className="text-blue-400" />} label="State" value={company.state} />
                                <InfoItem icon={<FaMapMarkerAlt className="text-blue-400" />} label="Postal Code" value={company.postal_code} />
                                <InfoItem icon={<FaGlobe className="text-blue-400" />} label="Country" value={company.country || 'India'} />
                            </div>
                        </div>

                        {/* Network */}
                        <div>
                            <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-3 bg-indigo-500 rounded-full" /> Location & Network
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoItem icon={<FaCrosshairs className="text-indigo-400" />} label="Latitude" value={company.latitude} />
                                <InfoItem icon={<FaCrosshairs className="text-indigo-400" />} label="Longitude" value={company.longitude} />
                                <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <FaNetworkWired /> IP Addresses
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ips.length > 0
                                            ? ips.map((ip, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-mono font-bold text-indigo-700">
                                                    {ip}
                                                </span>
                                            ))
                                            : <span className="text-gray-400 text-xs">No IP restrictions configured</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-3 bg-gray-300 rounded-full" /> System Info
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoItem icon={<FaHistory className="text-gray-400" />} label="Created" value={formatDateTime(company.created_at)} />
                                <InfoItem icon={<FaHistory className="text-gray-400" />} label="Updated" value={formatDateTime(company.updated_at)} />
                                <InfoItem icon={<FaUserCheck className="text-gray-400" />} label="Created By" value={company.created_by?.name} />
                                <InfoItem icon={<FaUserCheck className="text-gray-400" />} label="Updated By" value={company.updated_by?.name} />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                        <button onClick={() => { onEdit(company); onClose(); }}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md">
                            <FaEdit size={14} /> Edit Company
                        </button>
                        <button onClick={() => { onDelete(company); onClose(); }}
                            className="flex-1 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl hover:from-red-500 hover:to-rose-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md">
                            <FaTrash size={14} /> Delete
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteConfirmModal = ({ company, onClose, onConfirm, deleting }) => {
    if (!company) return null;
    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 flex justify-between items-center p-5 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-t-xl">
                        <h2 className="text-lg font-bold flex items-center gap-2"><FaTrash /> Delete Company</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl"><FaTimes size={17} /></button>
                    </div>
                    <div className="p-6 sm:p-8 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}
                            className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaExclamationTriangle className="text-4xl text-red-400" />
                        </motion.div>
                        <p className="text-xl font-bold text-gray-800 mb-2">Are you sure?</p>
                        <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                            You are about to permanently delete{' '}
                            <span className="font-bold text-red-500">{company.name}</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={onClose}
                                className="flex-1 py-3 border-2 border-gray-100 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all">
                                Keep
                            </button>
                            <button onClick={() => onConfirm(company.id)} disabled={deleting}
                                className="flex-1 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl hover:from-red-500 hover:to-rose-600 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 shadow-md">
                                {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                {deleting ? 'Deleting...' : 'Delete Now'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [detailTarget, setDetailTarget] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalTarget, setEditModalTarget] = useState(null);
    const [manageMoreTarget, setManageMoreTarget] = useState(null);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const fetchCompanies = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        try {
            let url = `/company/list?page=${page}&limit=${pagination.limit}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            const res = await apiCall(url, 'GET');
            const result = await res.json();
            if (result.success) {
                setCompanies(result.data || []);
                const currentPage = Number(result.pagination?.page ?? result.current_page ?? result.page ?? page);
                const perPage = Number(result.pagination?.limit ?? result.per_page ?? result.limit ?? pagination.limit);
                const total = Number(result.pagination?.total ?? result.total ?? result.meta?.total ?? result.count ?? 0);
                const totalPages = Number(
                    result.pagination?.total_pages ??
                    result.meta?.total_pages ??
                    result.last_page ??
                    Math.max(1, Math.ceil(total / perPage))
                );
                updatePagination({
                    page: currentPage,
                    limit: perPage,
                    total,
                    total_pages: totalPages,
                    is_last_page: result.pagination?.is_last_page ?? result.meta?.is_last_page ?? (currentPage >= totalPages),
                });
            } else {
                throw new Error(result.message || 'Failed to fetch companies');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to load companies');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchCompanies(1, debouncedSearch, true);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchCompanies(pagination.page, debouncedSearch, true);
        }
    }, [pagination.page, pagination.limit, debouncedSearch]);

    useEffect(() => {
        fetchCompanies(1, '', true);
    }, []);

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            const res = await apiCall('/company/delete', 'DELETE', { id });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);
            toast.success('Company deleted successfully!');
            setDeleteTarget(null);
            fetchCompanies(1, debouncedSearch, true);
        } catch (e) {
            toast.error(e.message || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleEditSuccess = async (id, changedFields) => {
        try {
            const payload = {
                id: id,
                ...changedFields
            };

            const res = await apiCall('/company/update', 'PUT', payload);
            const result = await res.json();

            if (result.success) {
                toast.success('Company updated successfully!');
                setEditModalTarget(null);
                fetchCompanies(pagination.page, debouncedSearch, true);
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to update company');
        }
    };

    const handleManageMoreSuccess = async (payload) => {
        try {
            if (payload?.id) {
                try {
                    const stored = JSON.parse(localStorage.getItem('company'));
                    if (stored?.id === payload.id) {
                        localStorage.setItem('company', JSON.stringify({ ...stored, ...payload }));
                    }
                } catch {
                    // ignore cache update failures
                }
            }

            setManageMoreTarget(null);
            fetchCompanies(pagination.page, debouncedSearch, true);
        } catch (e) {
            toast.error(e.message || 'Failed to refresh company data');
        }
    };

    const stats = {
        total: pagination.total || 0,
        active: companies.filter(c => c.is_active).length,
        withLogo: companies.filter(c => c.logo_url).length,
        withIP: companies.filter(c => parseIPs(c.company_ips || []).length > 0).length,
    };

    const isMobile = windowWidth < 640;
    const isTablet = windowWidth < 1024;
    const showLegal = !isMobile;
    const showLocation = !isMobile;
    const showIP = !isTablet;
    const showCreated = !isTablet;

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                                Company Management
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Manage your registered companies and their details</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <FaBuilding className="text-blue-400" />
                            <span className="font-semibold text-gray-700">{stats.total}</span>
                            <span className="text-gray-400">companies</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setCreateModalOpen(true)}
                            className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 overflow-hidden">
                            <FaPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-sm">Add Company</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <SummaryCard icon={<FaBuilding />} label="Total Companies" value={stats.total} gradient="from-blue-400 to-indigo-500" delay={0.05} />
                    <SummaryCard icon={<FaCheckCircle />} label="Active" value={stats.active} gradient="from-emerald-400 to-teal-500" delay={0.10} />
                    <SummaryCard icon={<FaNetworkWired />} label="IP Restricted" value={stats.withIP} gradient="from-violet-400 to-purple-500" delay={0.15} />
                    <SummaryCard icon={<FaMapMarkerAlt />} label="With Logo" value={stats.withLogo} gradient="from-orange-400 to-amber-500" delay={0.20} />
                </div>

                {/* Search */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                        <input type="text"
                            placeholder="Search by company name, city, or state..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400 outline-none shadow-sm transition-all text-sm" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* View Toggle */}
                {!loading && companies.length > 0 && (
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-700">{companies.length}</span> of{' '}
                            <span className="font-semibold text-gray-700">{stats.total}</span> companies
                            {debouncedSearch && <span className="ml-1 text-blue-500">· "{debouncedSearch}"</span>}
                        </p>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !companies.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && companies.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-md border border-gray-100 p-16 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <FaBuilding className="text-4xl text-blue-200" />
                        </div>
                        <p className="text-xl font-bold text-gray-600 mb-2">No companies found</p>
                        <p className="text-gray-400 text-sm">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Click "Add Company" to get started'}
                        </p>
                        {debouncedSearch
                            ? <button onClick={() => setSearchTerm('')} className="mt-4 px-5 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-sm font-semibold">Clear Search</button>
                            : <button onClick={() => setCreateModalOpen(true)} className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg">Add Company</button>}
                    </motion.div>
                )}

                {/* Table View */}
                {!loading && companies.length > 0 && viewMode === 'table' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="xsm:hidden bg-gradient-to-r from-gray-50 to-slate-50 text-gray-500 uppercase text-xs border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Company</th>
                                        {showLegal && <th className="px-5 py-4 font-semibold tracking-wider">Legal Name</th>}
                                        {showLocation && <th className="px-5 py-4 font-semibold tracking-wider">Location</th>}
                                        {showIP && <th className="px-5 py-4 font-semibold tracking-wider">IP Address</th>}
                                        <th className="px-5 py-4 font-semibold tracking-wider">Status</th>
                                        {showCreated && <th className="px-5 py-4 font-semibold tracking-wider">Created</th>}
                                        <th className="px-5 py-4 text-right font-semibold tracking-wider"><FaCog className="w-4 h-4 ml-auto" /></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {companies.map((company, i) => {
                                        const idx = company.id % 5;
                                        const ips = parseIPs(company.company_ips || []);
                                        return (
                                            <motion.tr key={company.id}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                                className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                                onClick={() => setDetailTarget(company)}>

                                                {/* Company */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden shadow-sm group-hover:scale-105 transition-transform"
                                                            style={{ background: avatarPalette[idx].bg, color: avatarPalette[idx].text }}>
                                                            {company.logo_url
                                                                ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                                                : getInitials(company.name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{company.name}</p>
                                                            <p className="text-xs text-indigo-400 font-mono">#{company.id}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Legal Name */}
                                                {showLegal && (
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs text-gray-500 font-medium">{company.legal_name || '—'}</p>
                                                    </td>
                                                )}

                                                {/* Location */}
                                                {showLocation && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <FaMapMarkerAlt className="text-rose-400 flex-shrink-0" />
                                                            <span>{[company.city, company.state].filter(Boolean).join(', ') || '—'}</span>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* IP */}
                                                {showIP && (
                                                    <td className="px-5 py-4">
                                                        {ips.length > 0 ? (
                                                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-mono text-indigo-700">
                                                                {ips[0]}{ips.length > 1 ? ` +${ips.length - 1}` : ''}
                                                            </span>
                                                        ) : <span className="text-gray-300 text-xs">—</span>}
                                                    </td>
                                                )}

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <StatusBadge isActive={company.is_active} />
                                                </td>

                                                {/* Created */}
                                                {showCreated && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                            <FaClock className="flex-shrink-0" />
                                                            {formatDate(company.created_at)}
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <ActionMenu
                                                        menuId={`table-${company.id}`}
                                                        activeId={activeActionMenu}
                                                        onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                                        actions={[
                                                            { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setDetailTarget(company), className: 'text-blue-600 hover:bg-blue-50' },
                                                            { label: 'Edit', icon: <FaEdit size={13} />, onClick: () => setEditModalTarget(company), className: 'text-emerald-600 hover:bg-emerald-50' },
                                                            { label: 'Manage More', icon: <FaCog size={13} />, onClick: () => setManageMoreTarget(company), className: 'text-slate-700 hover:bg-slate-100' },
                                                            { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => setDeleteTarget(company), className: 'text-red-500 hover:bg-red-50' },
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
                )}

                {/* Card View */}
                {!loading && companies.length > 0 && viewMode === 'card' && (
                    <ManagementGrid viewMode={viewMode}>
                        {companies.map((company, i) => {
                            const idx = company.id % 5;
                            const ips = parseIPs(company.company_ips || []);
                            return (
                                <motion.div key={company.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={() => setDetailTarget(company)}
                                    className="bg-white rounded-xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">

                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-base font-bold overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300"
                                                style={{ background: avatarPalette[idx].bg, color: avatarPalette[idx].text }}>
                                                {company.logo_url
                                                    ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                                    : getInitials(company.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">{company.name}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">{company.legal_name || '—'}</p>
                                            </div>
                                        </div>
                                        <StatusBadge isActive={company.is_active} />
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-2.5 mb-4 flex-1">
                                        {(company.city || company.state) && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <FaMapMarkerAlt className="text-rose-400 flex-shrink-0 w-3 h-3" />
                                                <span>{[company.city, company.state].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                        {company.address_line1 && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <FaRoad className="text-blue-400 flex-shrink-0 w-3 h-3" />
                                                <span className="truncate">{company.address_line1}</span>
                                            </div>
                                        )}
                                        {ips.length > 0 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <FaNetworkWired className="text-indigo-400 flex-shrink-0 w-3 h-3" />
                                                <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    {ips[0]}{ips.length > 1 ? ` +${ips.length - 1}` : ''}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <FaClock className="flex-shrink-0 w-3 h-3" />
                                            <span>{formatDate(company.created_at)}</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                                        <span className="text-xs text-gray-300 font-mono">#{company.id}</span>
                                        <ActionMenu
                                            menuId={`card-${company.id}`}
                                            activeId={activeActionMenu}
                                            onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                            actions={[
                                                { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setDetailTarget(company), className: 'text-blue-600 hover:bg-blue-50' },
                                                { label: 'Edit', icon: <FaEdit size={13} />, onClick: () => setEditModalTarget(company), className: 'text-emerald-600 hover:bg-emerald-50' },
                                                { label: 'Manage More', icon: <FaCog size={13} />, onClick: () => setManageMoreTarget(company), className: 'text-slate-700 hover:bg-slate-100' },
                                                { label: 'Delete', icon: <FaTrash size={13} />, onClick: () => setDeleteTarget(company), className: 'text-red-500 hover:bg-red-50' },
                                            ]}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && (companies.length > 0 || pagination.total > 0) && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={(p) => { if (p !== pagination.page) goToPage(p); }}
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {detailTarget && (
                    <CompanyDetailModal
                        company={detailTarget}
                        onClose={() => setDetailTarget(null)}
                        onEdit={(c) => { setDetailTarget(null); setEditModalTarget(c); }}
                        onDelete={(c) => { setDetailTarget(null); setDeleteTarget(c); }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <DeleteConfirmModal
                        company={deleteTarget}
                        deleting={deleting}
                        onClose={() => setDeleteTarget(null)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>

            <CreateCompanyModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => { setCreateModalOpen(false); fetchCompanies(1, debouncedSearch, true); }}
                onCompanyCreated={() => fetchCompanies(1, debouncedSearch, true)}
            />

            <EditCompanyModal
                isOpen={!!editModalTarget}
                company={editModalTarget}
                onClose={() => setEditModalTarget(null)}
                onSuccess={handleEditSuccess}
            />

            <ManageMoreCompanyModal
                isOpen={!!manageMoreTarget}
                company={manageMoreTarget}
                onClose={() => setManageMoreTarget(null)}
                onSuccess={handleManageMoreSuccess}
            />
        </div>
    );
};

export default CompanyManagement;
