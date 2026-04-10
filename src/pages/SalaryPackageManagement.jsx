import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaCog, FaChevronDown,
    FaTimes, FaCheck, FaSpinner, FaBriefcase,
    FaListUl, FaTh, FaExclamationTriangle,
    FaLayerGroup, FaArrowUp, FaArrowDown,
    FaEye, FaSearch, FaCheckCircle, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import ModalScrollLock from "../components/ModalScrollLock";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const CONFIRM_MODAL_CLASS = "bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTypeStyle = (type) => {
    const map = {
        earning: 'bg-green-50 text-green-700 border-green-200',
        deduction: 'bg-red-50 text-red-700 border-red-200',
        employer_contributio: 'bg-blue-50 text-blue-700 border-blue-200',
        employer_contribution: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return map[type] || 'bg-gray-50 text-gray-600 border-gray-200';
};

const getTypeLabel = (type = '') => {
    const map = {
        earning: 'Earning',
        deduction: 'Deduction',
        employer_contributio: 'Employer Contribution',
        employer_contribution: 'Employer Contribution',
    };
    return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatCalcValue = (calcType, calcValue) => {
    const v = parseFloat(calcValue);
    if (calcType === 'percentage') return `${v.toFixed(1)}%`;
    if (calcType === 'fixed') return `₹${v.toLocaleString()}`;
    return calcValue;
};

const formatDate = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, value, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-pink-600',
        orange: 'from-orange-500 to-amber-500',
        red: 'from-red-500 to-rose-600',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`bg-gradient-to-r ${colorMap[color]} rounded-2xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs opacity-80">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Package Detail Modal ─────────────────────────────────────────────────────

const PackageDetailModal = ({ pkg, onClose }) => {
    if (!pkg) return null;
    const earningItems = pkg.items.filter(i => i.type === 'earning');
    const deductionItems = pkg.items.filter(i => i.type === 'deduction');
    const contributionItems = pkg.items.filter(i => i.type?.includes('employer'));

    const InfoItem = ({ icon, label, value }) => (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                {icon}{label}
            </label>
            <div className="text-gray-800 font-medium">{value}</div>
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaBriefcase /> Package Details
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Package Profile */}
                        <div className="flex items-center gap-6 pb-6 border-b">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl">
                                <FaBriefcase className="text-white text-4xl" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{pkg.name}</h3>
                                <p className="text-gray-600 flex items-center gap-2 mt-1">
                                    <FaCog className="text-blue-500" size={14} />Code: {pkg.code}
                                </p>
                                {pkg.description && (
                                    <p className="text-gray-500 text-sm mt-2">{pkg.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <InfoItem icon={<FaCheckCircle className="text-green-500" />} label="Earnings" value={earningItems.length} />
                            <InfoItem icon={<FaTimes className="text-red-500" />} label="Deductions" value={deductionItems.length} />
                            <InfoItem icon={<FaCog className="text-blue-500" />} label="Employer Contributions" value={contributionItems.length} />
                        </div>

                        {/* Status & Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <InfoItem 
                                icon={<FaToggleOn className="text-green-500" />} 
                                label="Status" 
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {pkg.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                } 
                            />
                            <InfoItem icon={<FaCalendarAlt className="text-purple-500" />} label="Created" value={formatDate(pkg.created_at)} />
                        </div>

                        {/* Components List */}
                        {pkg.items.length > 0 && (
                            <div className="mt-6">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                    <FaLayerGroup className="text-blue-500" /> Components ({pkg.items.length})
                                </label>
                                <div className="space-y-2">
                                    {[...pkg.items]
                                        .sort((a, b) => a.display_order - b.display_order)
                                        .map((item, i) => (
                                            <motion.div
                                                key={item.component_id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-md flex items-center justify-center font-bold flex-shrink-0">
                                                        {item.display_order}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{item.code}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getTypeStyle(item.type)}`}>
                                                        {getTypeLabel(item.type)}
                                                    </span>
                                                    <span className="text-sm font-bold text-blue-600">
                                                        {formatCalcValue(item.calc_type, item.calc_value)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Package Form Modal ───────────────────────────────────────────────────────

const PackageFormModal = ({ pkg, availableComponents, onClose, onSave }) => {
    const isEdit = !!pkg;
    const [name, setName] = useState(pkg?.name || '');
    const [code, setCode] = useState(pkg?.code || '');
    const [description, setDescription] = useState(pkg?.description || '');
    const [selectedComponents, setSelectedComponents] = useState(
        pkg?.items?.map(i => ({ component_id: i.component_id, display_order: i.display_order })) || []
    );
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = 'Name is required';
        if (!isEdit && !code.trim()) e.code = 'Code is required';
        if (selectedComponents.length === 0) e.components = 'Add at least one component';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const toggleComponent = (compId) => {
        setSelectedComponents(prev => {
            const exists = prev.find(c => c.component_id === compId);
            if (exists) return prev.filter(c => c.component_id !== compId);
            return [...prev, { component_id: compId, display_order: prev.length }];
        });
    };

    const moveComponent = (compId, dir) => {
        setSelectedComponents(prev => {
            const arr = [...prev].sort((a, b) => a.display_order - b.display_order);
            const idx = arr.findIndex(c => c.component_id === compId);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= arr.length) return prev;
            const temp = arr[idx].display_order;
            arr[idx].display_order = arr[newIdx].display_order;
            arr[newIdx].display_order = temp;
            return [...arr];
        });
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const body = isEdit
                ? { package_id: pkg.id, name, description, components: selectedComponents }
                : { name, code, description, components: selectedComponents };
            await onSave(body, isEdit);
        } finally {
            setSaving(false);
        }
    };

    const sortedSelected = [...selectedComponents].sort((a, b) => a.display_order - b.display_order);

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            {isEdit ? <FaEdit /> : <FaPlus />} {isEdit ? 'Edit Package' : 'Create Package'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Package Name *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. New Employee Package"
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        {!isEdit && (
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Package Code *</label>
                                <input
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. PKG_001"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${errors.code ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-2 block">
                                Components * <span className="text-blue-500 normal-case font-normal">({selectedComponents.length} selected)</span>
                            </label>
                            {errors.components && <p className="text-xs text-red-500 mb-2">{errors.components}</p>}
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                                {availableComponents.map(comp => {
                                    const isSelected = selectedComponents.some(c => c.component_id === comp.id);
                                    return (
                                        <motion.div
                                            key={comp.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleComponent(comp.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <FaCheck className="text-white" style={{ fontSize: 8 }} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{comp.name}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{comp.code}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getTypeStyle(comp.type)}`}>
                                                    {getTypeLabel(comp.type)}
                                                </span>
                                                <span className="text-xs font-bold text-gray-600 font-mono">{formatCalcValue(comp.calc_type, comp.calc_value)}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {sortedSelected.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-2 block">Display Order</label>
                                <div className="space-y-1.5">
                                    {sortedSelected.map((sel, idx) => {
                                        const comp = availableComponents.find(c => c.id === sel.component_id);
                                        if (!comp) return null;
                                        return (
                                            <div key={sel.component_id} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2.5 border border-gray-200">
                                                <span className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-md flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                                                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{comp.name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${getTypeStyle(comp.type)}`}>
                                                    {formatCalcValue(comp.calc_type, comp.calc_value)}
                                                </span>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button onClick={() => moveComponent(sel.component_id, -1)} disabled={idx === 0}
                                                        className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 disabled:opacity-30 transition-all">
                                                        <FaArrowUp size={10} className="text-gray-500" />
                                                    </button>
                                                    <button onClick={() => moveComponent(sel.component_id, 1)} disabled={idx === sortedSelected.length - 1}
                                                        className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 disabled:opacity-30 transition-all">
                                                        <FaArrowDown size={10} className="text-gray-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-sm">
                            Cancel
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit} disabled={saving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                            {saving ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ pkg, onClose, onConfirm, deleting }) => {
    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <ModalScrollLock />
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className={CONFIRM_MODAL_CLASS}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FaTrash /> Delete Package
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
                            <FaTimes size={20} />
                        </button>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6 text-center">
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
                            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <FaExclamationTriangle className="text-4xl text-red-600" />
                        </motion.div>
                        <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                        <p className="text-gray-500 mb-6">
                            You are about to delete the package{" "}
                            <span className="font-semibold text-red-600">{pkg?.name}</span>.
                            This action cannot be undone.
                        </p>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
                            <button onClick={onClose}
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
                                Keep
                            </button>
                            <button onClick={() => onConfirm(pkg.id)} disabled={deleting}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                                {deleting && <FaSpinner className="animate-spin" />}
                                Delete Package
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Package Card (Grid) ──────────────────────────────────────────────────────

const PackageCard = ({ pkg, index, onView, onEdit, onDelete, activeId, onToggle }) => {
    const earningCount = pkg.items.filter(i => i.type === 'earning').length;
    const deductionCount = pkg.items.filter(i => i.type === 'deduction').length;
    const contributionCount = pkg.items.filter(i => i.type?.includes('employer')).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onView(pkg)}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
        >
            <div className="flex items-start justify-between gap-2.5 mb-3">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                        <FaBriefcase className="text-white text-lg" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{pkg.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{pkg.code}</p>
                        {pkg.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{pkg.description}</p>
                        )}
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-green-700">{earningCount}</p>
                    <p className="text-xs text-green-500">Earnings</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-red-600">{deductionCount}</p>
                    <p className="text-xs text-red-400">Deductions</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-center">
                    <p className="text-sm font-bold text-blue-700">{contributionCount}</p>
                    <p className="text-xs text-blue-400">Contributions</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-gray-400">
                    {pkg.items.length} components
                </span>
                <span className="text-xs text-gray-400">{formatDate(pkg.created_at)}</span>
                <ActionMenu
                    menuId={`card-${pkg.id}`}
                    activeId={activeId}
                    onToggle={onToggle}
                    actions={[
                        {
                            label: 'View Details',
                            icon: <FaEye size={13} />,
                            onClick: () => onView(pkg),
                            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        },
                        {
                            label: 'Edit',
                            icon: <FaEdit size={13} />,
                            onClick: () => onEdit(pkg),
                            className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        },
                        {
                            label: 'Delete',
                            icon: <FaTrash size={13} />,
                            onClick: () => onDelete(pkg),
                            className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }
                    ]}
                />
            </div>
        </motion.div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SalaryPackages = () => {
    const [packages, setPackages] = useState([]);
    const [availableComponents, setAvailableComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editPkg, setEditPkg] = useState(null);
    const [deletePkg, setDeletePkg] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPackages = useCallback(async (page = pagination.page, search = debouncedSearch, resetLoading = true) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        if (resetLoading) setLoading(true);

        try {
            const company = JSON.parse(localStorage.getItem('company'));
            let url = `/salary/components/packages?page=${page}&limit=${pagination.limit}`;
            if (search) url += `&search=${search}`;

            const response = await apiCall(url, 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) {
                setPackages(result.data || []);
                updatePagination({
                    page: result.pagination?.page || page,
                    limit: result.pagination?.limit || pagination.limit,
                    total: result.pagination?.total || 0,
                    total_pages: result.pagination?.total_pages || 1,
                    is_last_page: result.pagination?.is_last_page ?? true
                });
            } else {
                throw new Error(result.message || 'Failed to fetch packages');
            }
        } catch (e) {
            console.error(e);
            toast.error(e.message || 'Failed to load packages');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            setIsInitialLoad(false);
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    const fetchComponents = useCallback(async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/list', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) setAvailableComponents(result.data || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

    // Search trigger
    useEffect(() => {
        if (!isInitialLoad) {
            if (pagination.page !== 1) goToPage(1);
            else fetchPackages(1, debouncedSearch, true);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        if (!isInitialLoad && !fetchInProgress.current) {
            fetchPackages(pagination.page, debouncedSearch, true);
        }
    }, [pagination.page]);

    useEffect(() => {
        const company = JSON.parse(localStorage.getItem('company'));
        if (company && isInitialLoad) {
            fetchPackages(1, "", true);
            fetchComponents();
        } else if (!company) {
            toast.error("Company ID not found. Please ensure you're logged in as a company.");
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, []);

    const handleSave = async (body, isEdit) => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const endpoint = isEdit ? '/salary/components/update-package' : '/salary/components/create-package';
            const response = await apiCall(endpoint, 'POST', body, company?.id);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            toast.success(isEdit ? 'Package updated successfully' : 'Package created successfully');
            setShowForm(false);
            setEditPkg(null);
            fetchPackages(1, debouncedSearch, true);
        } catch (e) {
            toast.error(e.message || 'Something went wrong');
        }
    };

    const handleDelete = async (pkgId) => {
        setDeleting(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/delete-package', 'POST', { package_id: pkgId }, company?.id);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            toast.success('Package deleted successfully');
            setDeletePkg(null);
            fetchPackages(1, debouncedSearch, true);
        } catch (e) {
            toast.error(e.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const openEdit = (pkg) => { setEditPkg(pkg); setShowForm(true); };
    const openCreate = () => { setEditPkg(null); setShowForm(true); };

    const activePackages = packages.filter(p => p.is_active).length;
    const totalComponents = packages.reduce((s, p) => s + (p.items?.length || 0), 0);

    // Responsive column visibility - matching the pattern from other pages
    const showCode = windowWidth >= 480;
    const showEarnings = windowWidth >= 560;
    const showDeductions = windowWidth >= 640;
    const showTotal = windowWidth >= 480;
    const showStatus = windowWidth >= 768;
    const showCreated = windowWidth >= 1024;

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <div className="min-h-screen p-3 md:p-6 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
                >
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Salary Packages
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                            <FaBriefcase className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-700">{pagination.total}</span>
                            <span className="text-gray-500">packages</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={openCreate}
                            className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-600 to-purple-600
                                       text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
                                       transition-all duration-300 flex items-center gap-2 overflow-hidden"
                        >
                            <div className="relative z-10">
                                <svg className="w-4 h-4 group-hover:rotate-90 transition-all duration-300"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="relative z-10 text-sm">Create Package</span>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                                           transition-transform duration-700 bg-gradient-to-r
                                           from-transparent via-white/20 to-transparent" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
                >
                    <SummaryCard icon={<FaBriefcase />} label="Total Packages" value={pagination.total} color="blue" delay={0.05} />
                    <SummaryCard icon={<FaCheckCircle />} label="Active" value={activePackages} color="green" delay={0.1} />
                    <SummaryCard icon={<FaLayerGroup />} label="Components" value={totalComponents} color="purple" delay={0.15} />
                    <SummaryCard icon={<FaCog />} label="Avg / Package" value={packages.length ? (totalComponents / packages.length).toFixed(1) : '0'} color="orange" delay={0.2} />
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6"
                >
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder="Search packages by name or code..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all text-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* View Toggle & Count */}
                {!loading && packages.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-800">{packages.length}</span> of{' '}
                            <span className="font-semibold text-gray-800">{pagination.total}</span> packages
                            {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                        </p>
                        <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && !packages.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && packages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16 bg-white rounded-2xl shadow-xl border border-gray-100"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBriefcase className="text-4xl text-gray-300" />
                        </div>
                        <p className="text-xl font-semibold text-gray-600">No packages found</p>
                        <p className="text-gray-400 mt-2 text-sm">
                            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Create your first salary package to get started'}
                        </p>
                        {debouncedSearch ? (
                            <button onClick={() => setSearchTerm('')}
                                className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium">
                                Clear Search
                            </button>
                        ) : (
                            <button onClick={openCreate}
                                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium">
                                Create Package
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Grid View */}
                {!loading && packages.length > 0 && viewMode === "card" && (
                    <ManagementGrid viewMode={viewMode}>
                        {packages.map((pkg, index) => (
                            <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                index={index}
                                onView={setSelectedPkg}
                                onEdit={openEdit}
                                onDelete={setDeletePkg}
                                activeId={activeActionMenu}
                                onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                            />
                        ))}
                    </ManagementGrid>
                )}

                {/* Table View */}
                {!loading && packages.length > 0 && viewMode === "table" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl overflow-visible"
                    >
                        <div className="overflow-x-auto overflow-y-visible">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Package</th>
                                        {showCode && <th className="px-6 py-4">Code</th>}
                                        {showEarnings && <th className="px-6 py-4">Earnings</th>}
                                        {showDeductions && <th className="px-6 py-4">Deductions</th>}
                                        {showTotal && <th className="px-6 py-4">Total</th>}
                                        {showStatus && <th className="px-6 py-4">Status</th>}
                                        {showCreated && <th className="px-6 py-4">Created</th>}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {packages.map((pkg, index) => {
                                        const earningCount = pkg.items.filter(i => i.type === 'earning').length;
                                        const deductionCount = pkg.items.filter(i => i.type === 'deduction').length;
                                        return (
                                            <motion.tr
                                                key={pkg.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 cursor-pointer"
                                                onClick={() => setSelectedPkg(pkg)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <FaBriefcase className="text-white text-sm" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{pkg.name}</p>
                                                            {pkg.description && (
                                                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{pkg.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {showCode && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold border border-blue-100">
                                                            {pkg.code}
                                                        </span>
                                                    </td>
                                                )}
                                                {showEarnings && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">{earningCount}</span>
                                                    </td>
                                                )}
                                                {showDeductions && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{deductionCount}</span>
                                                    </td>
                                                )}
                                                {showTotal && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">{pkg.items.length}</span>
                                                    </td>
                                                )}
                                                {showStatus && (
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                            {pkg.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                )}
                                                {showCreated && (
                                                    <td className="px-6 py-4 text-xs text-gray-400">{formatDate(pkg.created_at)}</td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <ActionMenu
                                                            menuId={`table-${pkg.id}`}
                                                            activeId={activeActionMenu}
                                                            onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                                                            actions={[
                                                                {
                                                                    label: 'View Details',
                                                                    icon: <FaEye size={13} />,
                                                                    onClick: () => setSelectedPkg(pkg),
                                                                    className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                                },
                                                                {
                                                                    label: 'Edit',
                                                                    icon: <FaEdit size={13} />,
                                                                    onClick: () => openEdit(pkg),
                                                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                                },
                                                                {
                                                                    label: 'Delete',
                                                                    icon: <FaTrash size={13} />,
                                                                    onClick: () => setDeletePkg(pkg),
                                                                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Pagination */}
                {!loading && packages.length > 0 && (
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
                <AnimatePresence>
                    {selectedPkg && (
                        <PackageDetailModal
                            pkg={selectedPkg}
                            onClose={() => setSelectedPkg(null)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showForm && (
                        <PackageFormModal
                            pkg={editPkg}
                            availableComponents={availableComponents}
                            onClose={() => { setShowForm(false); setEditPkg(null); }}
                            onSave={handleSave}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {deletePkg && (
                        <DeleteModal
                            pkg={deletePkg}
                            onClose={() => setDeletePkg(null)}
                            onConfirm={handleDelete}
                            deleting={deleting}
                        />
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default SalaryPackages;