import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaPlus, FaSpinner, FaCheckCircle,
    FaExclamationTriangle, FaTimes,
    FaEdit, FaTrash,
    FaBuilding, FaMapMarkerAlt, FaGlobe, FaSearch,
    FaClock, FaNetworkWired, FaUserCheck, FaRoad,
    FaHistory, FaMapPin,
    FaChevronDown, FaEye
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import { ManagementHub, RefreshButton } from '../components/common';
import ModalScrollLock from '../components/ModalScrollLock';
import CreateCompanyModal from '../components/CompanyModals/CreateCompanyModal';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { ManagementTable, ManagementCard } from '../components/common';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarPalette = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { bg: 'bg-orange-50', text: 'text-orange-700' },
    { bg: 'bg-purple-50', text: 'text-purple-700' },
    { bg: 'bg-blue-50', text: 'text-blue-700' },
];

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value) {
    return value ? String(value).toUpperCase() : '—';
}

function formatDistance(value) {
    if (value === null || value === undefined || value === '') return '—';
    return `${value} m`;
}

function formatAttendanceMethods(methods) {
    if (!methods) return '—';
    const items = Array.isArray(methods) ? methods : [methods];
    const labels = items
        .map(item => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') return item.method || item.key || item.value || '';
            return '';
        })
        .filter(Boolean)
        .map(item => item.charAt(0).toUpperCase() + item.slice(1));
    return labels.length ? labels.join(', ') : '—';
}

function parseMethods(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === 'string') return item.trim().toLowerCase();
                if (item && typeof item === 'object') {
                    return String(item.method || item.key || item.id || item.value || '').trim().toLowerCase();
                }
                return '';
            })
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        try {
            return parseMethods(JSON.parse(value));
        } catch {
            return [value.trim().toLowerCase()].filter(Boolean);
        }
    }
    return [];
}

function hasAttendanceMethod(methods, methodToFind) {
    if (!methods) return false;
    const items = Array.isArray(methods) ? methods : [methods];
    return items.some(item => {
        let val = '';
        if (typeof item === 'string') val = item;
        else if (item && typeof item === 'object') val = item.method || item.key || item.value || '';
        return val.toLowerCase() === methodToFind.toLowerCase();
    });
}

function parseIPs(ips) {
    if (!ips) return [];
    if (!Array.isArray(ips)) {
        if (typeof ips === 'string') {
            try {
                const parsed = JSON.parse(ips);
                if (Array.isArray(parsed)) ips = parsed;
                else return [];
            } catch { return [ips]; }
        } else return [];
    }
    if (ips.length === 0) return [];
    if (ips[0] && typeof ips[0] === 'object' && ips[0].ip_v4) return ips.map(i => i.ip_v4).filter(Boolean);
    if (typeof ips[0] === 'string') return ips;
    return [];
}

// ─── Small Shared Components ──────────────────────────────────────────────────

const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0
        ${isActive
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {isActive ? 'Active' : 'Inactive'}
    </span>
);

const FieldCell = ({ label, value, mono = false }) => (
    <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-sm font-semibold text-slate-700 break-words ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
);

// ─── Section Tabs ─────────────────────────────────────────────────────────────

const TABS = [
    { key: 'address', label: 'Address', icon: <FaRoad size={10} /> },
    { key: 'network', label: 'Company Details', icon: <FaBuilding size={10} /> },
    { key: 'attendance', label: 'Attendance', icon: <FaUserCheck size={10} /> },
    { key: 'system', label: 'System', icon: <FaHistory size={10} /> },
];

const SectionTabs = ({ active, onChange }) => (
    <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70">
        {TABS.map(tab => (
            <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px whitespace-nowrap
                    ${active === tab.key
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                {tab.icon} {tab.label}
            </button>
        ))}
    </div>
);

// ─── Section Panels ───────────────────────────────────────────────────────────

const AddressPanel = ({ company }) => (
    <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Address Line 1" value={company.address_line1} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Address Line 2" value={company.address_line2} />
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="City" value={company.city} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="State" value={company.state} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Postal Code" value={company.postal_code} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Country" value={company.country || 'India'} />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Latitude" value={company.latitude} mono />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Longitude" value={company.longitude} mono />
            </div>
        </div>
    </div>
);

const NetworkPanel = ({ company }) => {
    const ips = parseIPs(company.company_ips || []);
    return (
        <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Company Name" value={company.name} />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Legal Name" value={company.legal_name} />
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Company ID" value={`#${company.id}`} mono />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Owner User" value={company.owner_user_id ? `#${company.owner_user_id}` : null} mono />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Currency" value={formatCurrency(company.transaction_currency)} />
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <FieldCell label="Status" value={company.is_active ? 'Active' : 'Inactive'} />
                </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaNetworkWired className="text-indigo-400" size={10} /> IP Restrictions
                </p>
                {ips.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {ips.map((ip, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-mono font-bold text-indigo-700">
                                {ip}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No IP restrictions configured</p>
                )}
            </div>
        </div>
    );
};

const AttendancePanel = ({ company }) => {
    const hasManual = hasAttendanceMethod(company.attendance_methods, 'manual');
    const hasGps = hasAttendanceMethod(company.attendance_methods, 'gps');
    const hasIp = hasAttendanceMethod(company.attendance_methods, 'ip');
    const ips = parseIPs(company.company_ips || []);

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`border rounded-xl p-4 flex items-center justify-between transition-all ${hasManual ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${hasManual ? 'text-emerald-600' : 'text-gray-400'}`}>Manual Method</p>
                        <p className={`text-sm font-bold ${hasManual ? 'text-emerald-700' : 'text-gray-500'}`}>{hasManual ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    {hasManual ? <FaCheckCircle className="text-emerald-500" size={20} /> : <FaTimes className="text-gray-300" size={20} />}
                </div>

                <div className={`border rounded-xl p-4 flex items-center justify-between transition-all ${hasGps ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${hasGps ? 'text-emerald-600' : 'text-gray-400'}`}>GPS Method</p>
                        <p className={`text-sm font-bold ${hasGps ? 'text-emerald-700' : 'text-gray-500'}`}>{hasGps ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    {hasGps ? <FaCheckCircle className="text-emerald-500" size={20} /> : <FaTimes className="text-gray-300" size={20} />}
                </div>

                <div className={`border rounded-xl p-4 flex items-center justify-between transition-all ${hasIp ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${hasIp ? 'text-emerald-600' : 'text-gray-400'}`}>IP Method</p>
                        <p className={`text-sm font-bold ${hasIp ? 'text-emerald-700' : 'text-gray-500'}`}>{hasIp ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    {hasIp ? <FaCheckCircle className="text-emerald-500" size={20} /> : <FaTimes className="text-gray-300" size={20} />}
                </div>
            </div>

            {(hasGps || hasIp) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hasGps && (
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <FaMapMarkerAlt className="text-emerald-500" size={14} /> GPS Configuration
                            </p>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                <FieldCell label="Latitude" value={company.latitude} mono />
                                <FieldCell label="Longitude" value={company.longitude} mono />
                                <FieldCell label="Max Distance" value={formatDistance(company.max_distance)} />
                            </div>
                        </div>
                    )}

                    {hasIp && (
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                <FaNetworkWired className="text-blue-500" size={14} /> Allowed IPs
                            </p>
                            {ips.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {ips.map((ip, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-mono font-bold text-blue-700">
                                            {ip}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 font-medium">No IPs configured</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SystemPanel = ({ company }) => (
    <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Created At" value={formatDateTime(company.created_at)} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Updated At" value={formatDateTime(company.updated_at)} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Created By" value={company.created_by?.name} />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                <FieldCell label="Updated By" value={company.updated_by?.name} />
            </div>
        </div>
    </div>
);

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = {
    hidden: { opacity: 0, scale: 0.92, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.45 } },
    exit: { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.25 } }
};

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
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
                            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                                <FaTrash className="text-red-500" size={13} />
                            </div>
                            Delete Company
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                            <FaTimes size={15} className="text-gray-500" />
                        </button>
                    </div>
                    <div className="p-6 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}
                            className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaExclamationTriangle className="text-3xl text-red-400" />
                        </motion.div>
                        <p className="text-lg font-bold text-gray-800 mb-2">Are you sure?</p>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                            You are about to permanently delete{' '}
                            <span className="font-bold text-red-500">{company.name}</span>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={onClose}
                                className="flex-1 py-2.5 border-2 border-gray-100 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all text-sm">
                                Keep
                            </button>
                            <button onClick={() => onConfirm(company.id)} disabled={deleting}
                                className="flex-1 py-2.5 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-xl hover:from-red-500 hover:to-rose-600 flex items-center justify-center gap-2 font-semibold disabled:opacity-50 text-sm">
                                {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash size={12} />}
                                {deleting ? 'Deleting...' : 'Delete Now'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ stats }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
            { icon: <FaBuilding className="text-blue-400" />, label: 'Total', value: stats.total, color: 'text-blue-600' },
            { icon: <FaCheckCircle className="text-emerald-400" />, label: 'Active', value: stats.active, color: 'text-emerald-600' },
            { icon: <FaNetworkWired className="text-violet-400" />, label: 'IP Restricted', value: stats.withIP, color: 'text-violet-600' },
            { icon: <FaMapMarkerAlt className="text-orange-400" />, label: 'With Logo', value: stats.withLogo, color: 'text-orange-600' },
        ].map((s, i) => (
            <motion.div key={i}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className="text-base">{s.icon}</div>
                <div>
                    <p className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
            </motion.div>
        ))}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanySettings() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const fetchCompanies = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const companyId = company?.id ?? null;
            let url = `/company/list?page=${page}&limit=${pagination.limit}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            const res = await apiCall(url, 'GET', null, companyId);
            const result = await res.json();
            if (result.success) {
                setCompanies(result.data || []);
                const meta = result.pagination || result.meta || {};
                const currentPage = Number(meta.page ?? result.current_page ?? page);
                const perPage = Number(meta.limit ?? result.per_page ?? pagination.limit);
                const total = Number(meta.total ?? result.total ?? 0);
                const totalPages = Number(meta.total_pages ?? result.last_page ?? Math.max(1, Math.ceil(total / perPage)));
                updatePagination({
                    page: currentPage, limit: perPage, total, total_pages: totalPages,
                    is_last_page: meta.is_last_page ?? (currentPage >= totalPages),
                });
            } else throw new Error(result.message || 'Failed to fetch companies');
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
        if (!isInitialLoad && !fetchInProgress.current) fetchCompanies(pagination.page, debouncedSearch, true);
    }, [pagination.page, pagination.limit]);

    useEffect(() => { fetchCompanies(1, '', true); }, []);

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

    const stats = {
        total: pagination.total || 0,
        active: companies.filter(c => c.is_active).length,
        withGPS: companies.filter(c => parseMethods(c.attendance_methods || []).includes('gps')).length,
        withIP: companies.filter(c => parseIPs(c.company_ips || []).length > 0).length,
    };

    const currentDeleteTarget = deleteTarget ? companies.find(c => c.id === deleteTarget.id) || deleteTarget : null;

    const tableColumns = [
        {
            key: 'name', label: 'Company Name', render: (row) => {
                const palIndex = (row.id && !isNaN(row.id)) ? row.id % 5 : 0;
                const pal = avatarPalette[palIndex] || avatarPalette[0];
                return (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden ${pal.bg} ${pal.text} border border-white/20 shadow-sm`}>
                        {row.logo_url ? <img src={row.logo_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} /> : getInitials(row.name)}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 text-sm">{row.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">#{row.id}</p>
                    </div>
                </div>
            )}
        },
        {
            key: 'location', label: 'Location', render: (row) => (
                <div className="text-sm text-slate-600 font-medium">
                    {[row.city, row.state].filter(Boolean).join(', ') || '—'}
                </div>
            )
        },
        { key: 'status', label: 'Status', render: (row) => <StatusBadge isActive={row.is_active} /> },
        {
            key: 'methods', label: 'Attendance', render: (row) => (
                <span className="text-sm text-slate-600 font-medium">{formatAttendanceMethods(row.attendance_methods)}</span>
            )
        },
        {
            key: 'actions', label: '', render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/company-settings/${row.id}`, { state: { company: row } }); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center border border-transparent hover:border-indigo-100"
                    title="View Details"
                >
                    <FaEye size={14} />
                </button>
            ), headerClassName: 'w-16 text-right'
        }
    ];

    const getRowActions = (company) => [
        {
            label: 'View Details',
            icon: <FaEye size={13} />,
            onClick: () => navigate(`/company-settings/${company.id}`, { state: { company } })
        },
        {
            label: 'Delete',
            icon: <FaTrash size={13} />,
            danger: true,
            onClick: () => setDeleteTarget(company)
        }
    ];

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <ManagementHub
            eyebrow={<><FaBuilding size={11} /> Company settings</>}
            title="Company Management"
            description="Manage your registered companies and their settings."
            accent="blue"
            summary={
                <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <FaBuilding className="text-blue-400" />
                    <span className="font-semibold text-gray-700">{stats.total}</span>
                    <span className="text-gray-400">companies</span>
                </div>
            }
            actions={
                <>
                    <RefreshButton loading={loading} onClick={() => fetchCompanies(pagination.page, debouncedSearch, true)}>
                        Refresh
                    </RefreshButton>
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCreateModalOpen(true)}
                        className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 overflow-hidden">
                        <FaPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-sm">Add Company</span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </motion.button>
                </>
            }
        >
            <div className="w-full mx-auto pb-12 space-y-6">
                {/* Stats */}
                <StatsBar stats={stats} />

                {/* Search & View Switcher */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative flex-1 w-full">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search by company name, city, or state..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm font-medium outline-none shadow-sm transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 min-h-[42px]"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaTimes size={13} />
                            </button>
                        )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full sm:w-auto">
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </motion.div>
                </div>

                {/* Loading */}
                {loading && !companies.length && <SkeletonComponent />}

                {/* Empty state */}
                {!loading && companies.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBuilding className="text-3xl text-blue-200" />
                        </div>
                        <p className="text-lg font-bold text-gray-600 mb-1">No companies found</p>
                        <p className="text-gray-400 text-sm mb-4">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Click "Add Company" to get started'}
                        </p>
                        {debouncedSearch
                            ? <button onClick={() => setSearchTerm('')}
                                className="px-5 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-sm font-semibold">
                                Clear Search
                                </button>
                            : <button onClick={() => setCreateModalOpen(true)}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md">
                                Add Company
                                </button>}
                    </motion.div>
                )}

                {/* Table / Grid views */}
                {!loading && companies.length > 0 && (
                    <>
                        {viewMode === 'table' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <ManagementTable
                                    rows={companies}
                                    columns={tableColumns}
                                    rowKey="id"
                                    onRowClick={(row) => navigate(`/company-settings/${row.id}`, { state: { company: row } })}
                                    activeId={activeActionMenu}
                                    onToggleAction={(e, id) => setActiveActionMenu(cur => cur === id ? null : id)}
                                    accent="blue"
                                    emptyState={
                                        <div className="text-center py-16">
                                            <FaBuilding className="text-6xl text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No companies found</p>
                                        </div>
                                    }
                                />
                            </motion.div>
                        )}

                        {viewMode === 'card' && (
                            <ManagementGrid viewMode={viewMode}>
                                {companies.map((company, index) => (
                                    <ManagementCard
                                        key={company.id}
                                        delay={index * 0.04}
                                        accent="blue"
                                        hoverable
                                        onClick={() => navigate(`/company-settings/${company.id}`, { state: { company } })}
                                        menuId={`company-card-${company.id}`}
                                        activeId={activeActionMenu}
                                        onToggle={(e, id) => { e.stopPropagation(); setActiveActionMenu(cur => cur === id ? null : id); }}
                                        actions={getRowActions(company)}
                                        eyebrow={`#${company.id}`}
                                        icon={
                                            (() => {
                                                const palIndex = (company.id && !isNaN(company.id)) ? company.id % 5 : 0;
                                                const pal = avatarPalette[palIndex] || avatarPalette[0];
                                                return (
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden ${pal.bg} ${pal.text}`}>
                                                    {company.logo_url ? <img src={company.logo_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} /> : getInitials(company.name)}
                                                </div>
                                                );
                                            })()
                                        }
                                        title={company.name}
                                        subtitle={[company.city, company.state].filter(Boolean).join(', ') || company.legal_name || 'No location set'}
                                        badges={[
                                            company.is_active ? { text: 'Active', variant: 'success' } : { text: 'Inactive', variant: 'secondary' }
                                        ]}
                                                footer={
                                                    <>
                                                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                            <FaUserCheck className="text-purple-400" />
                                                            {formatAttendanceMethods(company.attendance_methods)}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                            <FaNetworkWired className="text-emerald-400" />
                                                            {parseIPs(company.company_ips).length} IPs
                                                        </span>
                                                    </>
                                                }
                                            />
                                        ))}
                                    </ManagementGrid>
                                )}

                                {/* Pagination */}
                                <Pagination
                                    currentPage={pagination.page}
                                    totalItems={pagination.total}
                                    itemsPerPage={pagination.limit}
                                    onPageChange={p => { if (p !== pagination.page) goToPage(p); }}
                                    showInfo={true}
                                    onLimitChange={changeLimit}
                                />
                            </>
                        )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {currentDeleteTarget && (
                    <DeleteConfirmModal
                        company={currentDeleteTarget}
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
        </ManagementHub>
    );
}

