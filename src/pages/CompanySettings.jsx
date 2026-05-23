import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaPlus, FaSpinner, FaCheckCircle,
    FaExclamationTriangle, FaTimes,
    FaEdit, FaTrash,
    FaBuilding, FaMapMarkerAlt, FaGlobe, FaSearch,
    FaClock, FaNetworkWired, FaUserCheck, FaRoad,
    FaHistory, FaMapPin,
    FaChevronDown, FaCog
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import { ManagementHub, RefreshButton } from '../components/common';
import ModalScrollLock from '../components/ModalScrollLock';
import CreateCompanyModal from '../components/CompanyModals/CreateCompanyModal';
import EditCompanyModal from '../components/CompanyModals/EditCompanyModal';
import ManageMoreCompanyModal from '../components/CompanyModals/ManageMoreCompanyModal';

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

// ─── Accordion Item ───────────────────────────────────────────────────────────

const CompanyAccordionItem = ({ company, index, onEdit, onDelete, onManageMore }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('address');

    const idx = company.id % 5;
    const pal = avatarPalette[idx];
    const ips = parseIPs(company.company_ips || []);

    const summaryParts = [
        [company.city, company.state].filter(Boolean).join(', '),
        ips.length > 0 ? `${ips.length} IP${ips.length > 1 ? 's' : ''}` : null,
        formatAttendanceMethods(company.attendance_methods) !== '—'
            ? formatAttendanceMethods(company.attendance_methods)
            : null,
    ].filter(Boolean).join(' · ');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`bg-white rounded-xl border transition-all duration-200
                ${isOpen
                    ? 'border-indigo-200 shadow-md shadow-indigo-50/60'
                    : 'border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md'}
                ${!company.is_active ? 'opacity-70' : ''}`}>

            {/* Header */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden
                    ${pal.bg} ${pal.text}`}>
                    {company.logo_url
                        ? <img src={company.logo_url} alt="" className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }} />
                        : getInitials(company.name)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{company.name}</span>
                        <span className="text-xs text-gray-300 font-mono">#{company.id}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{summaryParts || company.legal_name || '—'}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge isActive={company.is_active} />
                    <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <FaChevronDown size={12} />
                    </span>
                </div>
            </button>

            {/* Expanded body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}>
                        <div className="border-t border-gray-100">

                            {/* Action bar */}
                            <div className="flex items-center justify-between px-5 py-2.5">
                                <p className="text-xs text-gray-400 truncate max-w-xs">{company.legal_name || '—'}</p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit(company)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                                        <FaEdit size={12} /> Edit
                                    </button>
                                    <button
                                        onClick={() => onManageMore(company)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                                        <FaCog size={12} /> More
                                    </button>
                                    <button
                                        onClick={() => onDelete(company)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                                        <FaTrash size={12} /> Delete
                                    </button>
                                </div>
                            </div>

                            <SectionTabs active={activeTab} onChange={setActiveTab} />

                            <div className="bg-gray-50/50">
                                {activeTab === 'address' && <AddressPanel company={company} />}
                                {activeTab === 'network' && <NetworkPanel company={company} />}
                                {activeTab === 'attendance' && <AttendancePanel company={company} />}
                                {activeTab === 'system' && <SystemPanel company={company} />}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

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

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalTarget, setEditModalTarget] = useState(null);
    const [manageMoreTarget, setManageMoreTarget] = useState(null);

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
                const currentPage = Number(result.pagination?.page ?? result.current_page ?? page);
                const perPage = Number(result.pagination?.limit ?? result.per_page ?? pagination.limit);
                const total = Number(result.pagination?.total ?? result.total ?? 0);
                const totalPages = Number(result.pagination?.total_pages ?? result.last_page ?? Math.max(1, Math.ceil(total / perPage)));
                updatePagination({
                    page: currentPage, limit: perPage, total, total_pages: totalPages,
                    is_last_page: result.pagination?.is_last_page ?? (currentPage >= totalPages),
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

    const handleEditSuccess = async (id, changedFields) => {
        try {
            const res = await apiCall('/company/update', 'PUT', { id, ...changedFields });
            const result = await res.json();
            if (result.success) {
                const updated = result.data || { id, ...changedFields };
                setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
                toast.success('Company updated successfully!');
                setEditModalTarget(null);
                fetchCompanies(pagination.page, debouncedSearch, true);
            } else throw new Error(result.message || 'Update failed');
        } catch (e) {
            toast.error(e.message || 'Failed to update company');
        }
    };

    const handleManageMoreSuccess = async (payload) => {
        try {
            if (payload?.id) {
                try {
                    const stored = JSON.parse(localStorage.getItem('company'));
                    if (stored?.id === payload.id) localStorage.setItem('company', JSON.stringify({ ...stored, ...payload }));
                } catch { }
                setCompanies(prev => prev.map(c => c.id === payload.id ? { ...c, ...payload } : c));
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

    const currentDeleteTarget = deleteTarget ? companies.find(c => c.id === deleteTarget.id) || deleteTarget : null;
    const currentEditTarget = editModalTarget ? companies.find(c => c.id === editModalTarget.id) || editModalTarget : null;
    const currentManageMoreTarget = manageMoreTarget ? companies.find(c => c.id === manageMoreTarget.id) || manageMoreTarget : null;

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
            <div className="space-y-6">

                {/* Stats */}
                <StatsBar stats={stats} />

                {/* Search */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by company name, city, or state..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm font-medium outline-none shadow-sm transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 min-h-[42px]"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <FaTimes size={13} />
                        </button>
                    )}
                </motion.div>

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

                {/* Accordion list */}
                {!loading && companies.length > 0 && (
                    <div className="space-y-3">
                        {companies.map((company, i) => (
                            <CompanyAccordionItem
                                key={company.id}
                                company={company}
                                index={i}
                                onEdit={setEditModalTarget}
                                onDelete={setDeleteTarget}
                                onManageMore={setManageMoreTarget}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && (companies.length > 0 || pagination.total > 0) && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={p => { if (p !== pagination.page) goToPage(p); }}
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
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

            <EditCompanyModal
                isOpen={!!currentEditTarget}
                company={currentEditTarget}
                onClose={() => setEditModalTarget(null)}
                onSuccess={handleEditSuccess}
            />

            <ManageMoreCompanyModal
                isOpen={!!currentManageMoreTarget}
                company={currentManageMoreTarget}
                onClose={() => setManageMoreTarget(null)}
                onSuccess={handleManageMoreSuccess}
            />
        </ManagementHub>
    );
};

export default CompanyManagement;

