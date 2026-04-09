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

// ─── Constants ────────────────────────────────────────────────────────────────

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

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
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-amber-500',
    };
    const textMap = {
        blue: 'text-blue-700',
        green: 'text-green-700',
        purple: 'text-purple-700',
        orange: 'text-orange-700',
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex items-center gap-3 hover:shadow-lg transition-all duration-300"
        >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-sm">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
                <p className={`text-lg font-bold ${textMap[color]}`}>{value}</p>
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

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaEye className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Package Details</h2>
                                    <p className="text-xs text-gray-400">Component breakdown</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-5">

                        {/* Package Profile */}
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                <FaBriefcase className="text-white text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-lg truncate">{pkg.name}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{pkg.description || 'No description'}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200">{pkg.code}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${pkg.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {pkg.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-green-700">{earningItems.length}</p>
                                <p className="text-xs text-green-500">Earnings</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-red-600">{deductionItems.length}</p>
                                <p className="text-xs text-red-400">Deductions</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-blue-700">{contributionItems.length}</p>
                                <p className="text-xs text-blue-400">Contributions</p>
                            </div>
                        </div>

                        {/* Components List */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FaLayerGroup className="text-blue-400" /> Components ({pkg.items.length})
                            </p>
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
                                                <span className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-md flex items-center justify-center font-bold flex-shrink-0">
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

                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                            <FaInfoCircle />
                            <span>Package ID: #{pkg.id} · Created {formatDate(pkg.created_at)}</span>
                        </div>
                    </div>

                    <div className="px-6 pb-5 pt-2">
                        <button onClick={onClose}
                            className="w-full py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
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
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                    <FaBriefcase className="text-white text-sm" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Package' : 'Create Package'}</h2>
                                    <p className="text-xs text-gray-400">{isEdit ? `Editing: ${pkg.code}` : 'Configure salary components'}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-gray-400" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Package Name *</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. New Employee Package"
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        {!isEdit && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Package Code *</label>
                                <input
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. PKG_001"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all ${errors.code ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                                />
                                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description..."
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
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
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Display Order</label>
                                <div className="space-y-1.5">
                                    {sortedSelected.map((sel, idx) => {
                                        const comp = availableComponents.find(c => c.id === sel.component_id);
                                        if (!comp) return null;
                                        return (
                                            <div key={sel.component_id} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-2.5 border border-gray-200">
                                                <span className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs rounded-md flex items-center justify-center font-bold flex-shrink-0">{idx}</span>
                                                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{comp.name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${getTypeStyle(comp.type)}`}>
                                                    {formatCalcValue(comp.calc_type, comp.calc_value)}
                                                </span>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button onClick={() => moveComponent(sel.component_id, -1)} disabled={idx === 0}
                                                        className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 disabled:opacity-30 transition-all">
                                                        <FaArrowUp size={9} className="text-gray-500" />
                                                    </button>
                                                    <button onClick={() => moveComponent(sel.component_id, 1)} disabled={idx === sortedSelected.length - 1}
                                                        className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 disabled:opacity-30 transition-all">
                                                        <FaArrowDown size={9} className="text-gray-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium text-sm">
                            Cancel
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit} disabled={saving}
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
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

const DeleteModal = ({ pkg, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try { await onConfirm(pkg.id); } finally { setDeleting(false); }
    };
    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden" animate="visible" exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden" animate="visible" exit="exit"
                    className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
                            <FaExclamationTriangle className="text-red-500 text-xl" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Package?</h3>
                        <p className="text-sm text-gray-500 mb-1">You are about to delete</p>
                        <p className="text-base font-semibold text-gray-800 mb-4">"{pkg.name}"</p>
                        <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 mb-5 border border-red-100">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={onClose}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm">
                                Cancel
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-md"
                            >
                                {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </motion.button>
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
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                        <FaBriefcase className="text-white text-xs" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate text-sm">{pkg.name}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{pkg.code}</p>
                    </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${pkg.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-green-50 border border-green-100 rounded-xl p-1.5 text-center">
                    <p className="text-xs font-bold text-green-700">{earningCount}</p>
                    <p className="text-xs text-green-500">Earnings</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-1.5 text-center">
                    <p className="text-xs font-bold text-red-600">{deductionCount}</p>
                    <p className="text-xs text-red-400">Deductions</p>
                </div>
            </div>

            <div className="mb-2.5">
                <p className="text-xs font-bold text-purple-700">{pkg.items.length} items</p>
                {pkg.description && (
                    <p className="mt-1 text-[10px] text-gray-400 line-clamp-2">{pkg.description}</p>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-gray-400">{contributionCount} contrib</span>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('card');
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editPkg, setEditPkg] = useState(null);
    const [deletePkg, setDeletePkg] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const { pagination, updatePagination, goToPage } = usePagination(1, 10);
    const fetchInProgress = useRef(false);
    const initialFetchDone = useRef(false);
    const isInitialLoad = useRef(true);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        if (!isInitialLoad.current) {
            if (pagination.page !== 1) goToPage(1);
            else fetchPackages(1);
        }
    }, [debouncedSearch]);

    const fetchPackages = useCallback(async (page = pagination.page) => {
        if (fetchInProgress.current) return;
        fetchInProgress.current = true;
        setLoading(true);
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const params = new URLSearchParams({ page, limit: pagination.limit });
            if (debouncedSearch) params.append('search', debouncedSearch);

            const response = await apiCall(
                `/salary/components/packages?${params}`, 'GET', null, company?.id
            );
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
            toast.error(e.message || 'Failed to fetch packages');
        } finally {
            setLoading(false);
            fetchInProgress.current = false;
            isInitialLoad.current = false;
        }
    }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

    const fetchComponents = useCallback(async () => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components', 'GET', null, company?.id);
            const result = await response.json();
            if (result.success) setAvailableComponents(result.data || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        if (!initialFetchDone.current) {
            fetchPackages(1);
            fetchComponents();
            initialFetchDone.current = true;
        }
    }, [fetchPackages, fetchComponents]);

    useEffect(() => {
        if (initialFetchDone.current && !fetchInProgress.current) {
            fetchPackages(pagination.page);
        }
    }, [pagination.page]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage !== pagination.page) goToPage(newPage);
    }, [pagination.page, goToPage]);

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
            fetchPackages(1);
        } catch (e) {
            toast.error(e.message || 'Something went wrong');
        }
    };

    const handleDelete = async (pkgId) => {
        try {
            const company = JSON.parse(localStorage.getItem('company'));
            const response = await apiCall('/salary/components/delete-package', 'POST', { package_id: pkgId }, company?.id);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            toast.success('Package deleted');
            setDeletePkg(null);
            fetchPackages(1);
        } catch (e) {
            toast.error(e.message || 'Delete failed');
        }
    };

    const openEdit = (pkg) => { setEditPkg(pkg); setShowForm(true); };
    const openCreate = () => { setEditPkg(null); setShowForm(true); };

    const activePackages = packages.filter(p => p.is_active).length;
    const totalComponents = packages.reduce((s, p) => s + (p.items?.length || 0), 0);

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="max-w-7xl m-auto min-h-screen p-3 md:p-6 font-sans">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Salary Packages
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and configure salary component packages</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm font-semibold"
                >
                    <FaPlus size={11} /> Create Package
                </motion.button>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-4"
            >
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search packages by name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all text-sm"
                    />
                    <FaSearch className="absolute left-4 top-4 text-gray-400 text-lg" />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <FaTimes />
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <SummaryCard icon={<FaBriefcase />} label="Total Packages" value={pagination.total} color="blue" delay={0.1} />
                <SummaryCard icon={<FaCheckCircle />} label="Active" value={activePackages} color="green" delay={0.15} />
                <SummaryCard icon={<FaLayerGroup />} label="Components" value={totalComponents} color="purple" delay={0.2} />
                <SummaryCard icon={<FaCog />} label="Avg / Package" value={packages.length ? (totalComponents / packages.length).toFixed(1) : '0'} color="orange" delay={0.25} />
            </div>

            {/* View Toggle + Count */}
            {!loading && packages.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{packages.length}</span> of{' '}
                        <span className="font-semibold text-gray-800">{pagination.total}</span> packages
                        {debouncedSearch && <span className="ml-1 text-blue-600">· "{debouncedSearch}"</span>}
                    </p>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="blue" />
                </div>
            )}

            {/* Loading */}
            {loading && <SkeletonComponent />}

            {/* Empty State */}
            {!loading && packages.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
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
                            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold text-sm">
                            <FaPlus size={11} /> Create Package
                        </button>
                    )}
                </motion.div>
            )}

            {/* Grid View */}
            {!loading && packages.length > 0 && viewMode === 'card' && (
                <ManagementGrid viewMode={viewMode}>
                    {packages.map((pkg, index) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            index={index}
                            onView={setSelectedPkg}
                            onEdit={openEdit}
                            onDelete={setDeletePkg}
                        />
                    ))}
                </ManagementGrid>
            )}

            {/* List View */}
            {!loading && packages.length > 0 && viewMode === 'table' && (
                <>
                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-4"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-[1200px] w-full text-sm text-left text-gray-700">
                                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Package</th>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Earnings</th>
                                        <th className="px-6 py-4">Deductions</th>
                                        <th className="px-6 py-4">Contributions</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {packages.map((pkg, index) => {
                                        const earningCount = pkg.items.filter(i => i.type === 'earning').length;
                                        const deductionCount = pkg.items.filter(i => i.type === 'deduction').length;
                                        const contributionCount = pkg.items.filter(i => i.type?.includes('employer')).length;
                                        return (
                                            <motion.tr
                                                key={pkg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                                                onClick={() => setSelectedPkg(pkg)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <FaBriefcase className="text-white text-xs" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{pkg.name}</p>
                                                            {pkg.description && (
                                                                <p className="text-xs text-gray-400 truncate max-w-[160px]">{pkg.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold border border-blue-100">
                                                        {pkg.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">{earningCount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{deductionCount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{contributionCount}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">{pkg.items.length}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${pkg.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                        {pkg.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400">{formatDate(pkg.created_at)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
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

                </>
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

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedPkg && (
                    <PackageDetailModal
                        pkg={selectedPkg}
                        onClose={() => setSelectedPkg(null)}
                    />
                )}
            </AnimatePresence>

            {/* Form Modal */}
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

            {/* Delete Modal */}
            <AnimatePresence>
                {deletePkg && (
                    <DeleteModal
                        pkg={deletePkg}
                        onClose={() => setDeletePkg(null)}
                        onConfirm={handleDelete}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                @media (min-width: 475px) {
                    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default SalaryPackages;
