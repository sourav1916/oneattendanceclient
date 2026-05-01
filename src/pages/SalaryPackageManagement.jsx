import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FaPlus, FaEdit, FaTrash, FaCog, FaCalendarAlt,
    FaTimes, FaCheck, FaSpinner, FaBriefcase,
    FaExclamationTriangle, FaSave,
    FaLayerGroup, FaArrowUp, FaArrowDown,
    FaEye, FaSearch, FaCheckCircle, FaToggleOn
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import SkeletonComponent from '../components/SkeletonComponent';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { ManagementButton, ManagementCard, ManagementHub, ManagementTable } from '../components/common';
import ModalScrollLock from "../components/ModalScrollLock";

// ─── Constants ────────────────────────────────────────────────────────────────

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const CONFIRM_MODAL_CLASS = "bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col";

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

// ─── Package Detail Modal ─────────────────────────────────────────────────────

const PackageDetailModal = ({ pkg, onClose }) => {
    if (!pkg) return null;
    const earningItems = pkg.items.filter(i => i.type === 'earning');
    const deductionItems = pkg.items.filter(i => i.type === 'deduction');
    const contributionItems = pkg.items.filter(i => i.type?.includes('employer'));

    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                                <FaBriefcase className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{pkg.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{pkg.code}</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                                        {pkg.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all border border-transparent hover:border-slate-100">
                            <FaTimes className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="p-6 space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
                                    <p className="text-lg font-black text-slate-900">{pkg.items.length}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earnings</p>
                                    <p className="text-lg font-black text-green-600">{earningItems.length}</p>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deductions</p>
                                    <p className="text-lg font-black text-rose-600">{deductionItems.length}</p>
                                </div>
                                <div className="bg-indigo-600 p-4 rounded-2xl border border-indigo-700 shadow-lg shadow-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Contributions</p>
                                    <p className="text-lg font-black text-white">{contributionItems.length}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* Description */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Package Description</p>
                                        <p className="text-sm text-slate-600 leading-relaxed italic">
                                            {pkg.description || "No description provided for this package."}
                                        </p>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Metadata</p>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            <div className="flex items-center justify-between px-4 py-3.5">
                                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                                    <FaCalendarAlt className="text-blue-500" /> Created On
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">{formatDate(pkg.created_at)}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3.5">
                                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                                                    <FaCog className="text-indigo-500" /> System ID
                                                </span>
                                                <span className="text-xs font-mono font-bold text-slate-800">#{pkg.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Components List */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Included Components</p>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{pkg.items.length} Total</span>
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                        {[...pkg.items].sort((a, b) => a.display_order - b.display_order).map((item, idx) => (
                                            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:border-slate-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        {item.display_order}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-none">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.code} · {item.calc_type}: {item.calc_value}{item.calc_type === 'percentage' ? '%' : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${item.type === 'earning' ? 'text-green-600' : item.type === 'deduction' ? 'text-rose-600' : 'text-blue-600'}`}>
                                                        {item.type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                        <button onClick={onClose} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Close Details
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
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden m-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                                {isEdit ? <FaEdit className="h-6 w-6 text-white" /> : <FaPlus className="h-6 w-6 text-white" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Salary Package' : 'Create New Package'}</h2>
                                <p className="text-sm text-slate-500 font-medium">Define compensation structure</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Package Name *</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard Corporate"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${errors.name ? 'border-red-400 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-800'}`} />
                                    {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold ml-1 uppercase">{errors.name}</p>}
                                </div>
                                {!isEdit && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Package Code *</label>
                                        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. PKG_001"
                                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${errors.code ? 'border-red-400 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-800'}`} />
                                        {errors.code && <p className="text-[10px] text-red-500 mt-1 font-bold ml-1 uppercase">{errors.code}</p>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this package for?" rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none" />
                            </div>

                            {/* Component Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Components</label>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedComponents.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {selectedComponents.length} Selected
                                    </span>
                                </div>
                                {errors.components && <p className="text-[10px] text-red-500 mb-2 font-bold uppercase ml-1">{errors.components}</p>}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                                    {availableComponents.map(comp => {
                                        const isSelected = selectedComponents.some(c => c.component_id === comp.id);
                                        return (
                                            <div key={comp.id} onClick={() => toggleComponent(comp.id)}
                                                className={`group flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50 border-blue-500 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200 group-hover:border-slate-300'}`}>
                                                        {isSelected && <FaCheck size={8} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-slate-800 leading-tight">{comp.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{comp.code}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-900">{comp.calc_value}{comp.calc_type === 'percentage' ? '%' : ''}</p>
                                                    <p className={`text-[8px] font-bold uppercase tracking-wider ${comp.type === 'earning' ? 'text-green-600' : comp.type === 'deduction' ? 'text-rose-600' : 'text-blue-600'}`}>
                                                        {comp.type === 'earning' ? 'Earn' : comp.type === 'deduction' ? 'Ded' : 'Cont'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Reordering */}
                            {sortedSelected.length > 0 && (
                                <div className="pt-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Display Order & Preview</label>
                                    <div className="space-y-2">
                                        {sortedSelected.map((sel, idx) => {
                                            const comp = availableComponents.find(c => c.id === sel.component_id);
                                            if (!comp) return null;
                                            return (
                                                <div key={sel.component_id} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm group">
                                                    <div className="w-6 h-6 bg-slate-900 text-white text-[10px] rounded-lg flex items-center justify-center font-black flex-shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">{comp.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => moveComponent(sel.component_id, -1)} disabled={idx === 0}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition-all">
                                                            <FaArrowUp size={10} />
                                                        </button>
                                                        <button type="button" onClick={() => moveComponent(sel.component_id, 1)} disabled={idx === sortedSelected.length - 1}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 transition-all">
                                                            <FaArrowDown size={10} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            {saving ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ pkg, onClose, onConfirm, deleting }) => {
    if (!pkg) return null;
    return (
        <AnimatePresence>
            <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 pt-8 sm:pt-16 !mt-0" onClick={onClose}>
                <ModalScrollLock />
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 m-auto flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm border border-red-100">
                                <FaTrash className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Delete Package</h2>
                                <p className="text-sm text-slate-500 font-medium">Confirmation required</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all">
                            <FaTimes className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-8 text-center space-y-6">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 bg-gradient-to-br from-red-50 to-rose-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xl shadow-red-100/50">
                            <FaExclamationTriangle className="text-4xl text-red-500" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                                You are about to permanently delete the salary package <span className="font-bold text-slate-900 underline decoration-red-200 underline-offset-4">{pkg.name}</span>. This may affect employees currently assigned to this package.
                            </p>
                        </div>

                        {/* Summary of package to be deleted */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Package Code</p>
                                <p className="text-sm font-bold text-slate-800">{pkg.code}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Components</p>
                                <p className="text-sm font-bold text-slate-800">{pkg.items?.length || 0} Items</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Keep Package
                        </button>
                        <button onClick={() => onConfirm(pkg.id)} disabled={deleting} className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                            {deleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                            {deleting ? 'Deleting...' : 'Delete Permanently'}
                        </button>
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

    const actions = [
        {
            label: 'View Details',
            icon: <FaEye size={13} />,
            onClick: () => onView(pkg),
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        },
        {
            label: 'Edit',
            icon: <FaEdit size={13} />,
            onClick: () => onEdit(pkg),
            className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
        },
        {
            label: 'Delete',
            icon: <FaTrash size={13} />,
            onClick: () => onDelete(pkg),
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
        },
    ];

    return (
        <ManagementCard
            accent="blue"
            delay={index * 0.05}
            onClick={() => onView(pkg)}
            activeId={activeId}
            onToggle={onToggle}
            menuId={`card-${pkg.id}`}
            actions={actions}
            hoverable
            title={pkg.name}
            subtitle={pkg.code}
            eyebrow={pkg.description || 'Salary package'}
            badge={
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
            }
            footer={
                <div className="flex w-full items-center justify-between text-xs text-gray-400">
                    <span>{pkg.items.length} components</span>
                    <span>{formatDate(pkg.created_at)}</span>
                </div>
            }
        >
            <div className="grid grid-cols-3 gap-2">
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
        </ManagementCard>
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

    const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
    const fetchInProgress = useRef(false);

    // Mini-sidebar is always 80px wide on desktop (ml-20).
    // Subtract it so breakpoints fire at the real *content* width.
    const SIDEBAR_OFFSET = typeof window !== 'undefined' && window.innerWidth >= 768 ? 80 : 0;
    const contentWidth = windowWidth - SIDEBAR_OFFSET;

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
    }, [pagination.page, pagination.limit, debouncedSearch]);

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
            const [endpoint, method] = isEdit
                ? ['/salary/components/update-package', 'PUT']
                : ['/salary/components/create-package', 'POST'];

            const response = await apiCall(endpoint, method, body, company?.id);
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

    // Responsive column visibility — use contentWidth (excludes mini-sidebar)
    const showCode = contentWidth >= 480;
    const showEarnings = contentWidth >= 560;
    const showDeductions = contentWidth >= 640;
    const showTotal = contentWidth >= 480;
    const showStatus = contentWidth >= 768;
    const showCreated = contentWidth >= 1024;

    // Actions per row
    const packageActions = (pkg) => ([
        {
            label: 'View Details',
            icon: <FaEye size={13} />,
            onClick: () => setSelectedPkg(pkg),
            className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
        },
        {
            label: 'Edit',
            icon: <FaEdit size={13} />,
            onClick: () => openEdit(pkg),
            className: 'text-green-600 hover:text-green-700 hover:bg-green-50',
        },
        {
            label: 'Delete',
            icon: <FaTrash size={13} />,
            onClick: () => setDeletePkg(pkg),
            className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
        },
    ]);

    // Column definitions for ManagementTable
    const packageColumns = [
        {
            key: 'name',
            label: 'Package',
            render: (pkg) => (
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
            ),
        },
        {
            key: 'code',
            label: 'Code',
            visible: showCode,
            render: (pkg) => (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold border border-blue-100">
                    {pkg.code}
                </span>
            ),
        },
        {
            key: 'earnings',
            label: 'Earnings',
            visible: showEarnings,
            render: (pkg) => {
                const count = pkg.items.filter(i => i.type === 'earning').length;
                return (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">{count}</span>
                );
            },
        },
        {
            key: 'deductions',
            label: 'Deductions',
            visible: showDeductions,
            render: (pkg) => {
                const count = pkg.items.filter(i => i.type === 'deduction').length;
                return (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">{count}</span>
                );
            },
        },
        {
            key: 'total',
            label: 'Total',
            visible: showTotal,
            render: (pkg) => (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">{pkg.items.length}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            visible: showStatus,
            render: (pkg) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${pkg.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            visible: showCreated,
            className: 'text-xs text-gray-400',
            render: (pkg) => formatDate(pkg.created_at),
        },
    ];

    const activePackages = packages.filter(p => p.is_active).length;
    const totalComponents = packages.reduce((s, p) => s + (p.items?.length || 0), 0);

    const emptyState = (
        <ManagementCard
            accent="blue"
            className="mx-auto max-w-xl"
            hoverable={false}
            bodyClassName="pt-0"
        >
            <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100">
                    <FaBriefcase className="text-4xl text-gray-300" />
                </div>
                <p className="text-xl font-semibold text-gray-700">No packages found</p>
                <p className="mt-2 text-sm text-gray-400">
                    {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Create your first salary package to get started'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {debouncedSearch ? (
                        <ManagementButton tone="blue" variant="soft" onClick={() => setSearchTerm('')}>
                            Clear Search
                        </ManagementButton>
                    ) : (
                        <ManagementButton
                            tone="blue"
                            variant="solid"
                            leftIcon={<FaPlus />}
                            onClick={openCreate}
                        >
                            Create Package
                        </ManagementButton>
                    )}
                </div>
            </div>
        </ManagementCard>
    );

    if (isInitialLoad && loading) return <SkeletonComponent />;

    return (
        <ManagementHub
            eyebrow={<><FaBriefcase size={11} /> Compensation</>}
            title="Salary Packages"
            description="Create and manage structured salary packages by combining multiple earning and deduction components."
            accent="blue"
            actions={
                <div className="flex items-center gap-3">
                    <ManagementButton
                        tone="blue"
                        variant="solid"
                        leftIcon={<FaPlus />}
                        onClick={openCreate}
                    >
                        Create Package
                    </ManagementButton>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Stats Row */}
                {!loading && packages.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Packages', val: pagination.total, color: 'from-blue-600 to-indigo-600', icon: FaBriefcase },
                            { label: 'Active Packages', val: activePackages, color: 'from-green-600 to-emerald-600', icon: FaCheckCircle },
                            { label: 'Total Components', val: totalComponents, color: 'from-purple-600 to-pink-600', icon: FaLayerGroup },
                            { label: 'Avg / Package', val: packages.length ? (totalComponents / packages.length).toFixed(1) : '0', color: 'from-orange-500 to-amber-500', icon: FaCog },
                        ].map((s) => (
                            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 shadow-lg text-white group hover:shadow-xl transition-all`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
                                        <p className="text-2xl font-black mt-1">{s.val}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                                        <s.icon size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ─── Consolidated Filter & View Bar ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"
                >
                    {/* Left Section: Search & Result Info */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Search packages by name or code..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <FaTimes size={14} />
                                </button>
                            )}
                        </div>
                        {!loading && packages.length > 0 && (
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block border-l pl-4 border-gray-200">
                                {pagination.total} Packages
                            </p>
                        )}
                    </div>

                    {/* Right Section: Controls */}
                    <div className="flex items-center justify-end">
                        <ManagementViewSwitcher
                            viewMode={viewMode}
                            onChange={setViewMode}
                            accent="blue"
                        />
                    </div>
                </motion.div>

                {/* Loading skeleton */}
                {loading && !packages.length && <SkeletonComponent />}

                {/* Empty State */}
                {!loading && packages.length === 0 && emptyState}

                {/* Table View */}
                {!loading && packages.length > 0 && viewMode === 'table' && (
                    <ManagementTable
                        rows={packages}
                        columns={packageColumns}
                        rowKey="id"
                        onRowClick={(pkg) => setSelectedPkg(pkg)}
                        activeId={activeActionMenu}
                        onToggleAction={(e, id) => setActiveActionMenu((curr) => (curr === id ? null : id))}
                        getActions={packageActions}
                        accent="blue"
                        headerClassName="xsm:hidden"
                    />
                )}

                {/* Card View */}
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
                                activeId={activeActionMenu}
                                onToggle={(e, id) => setActiveActionMenu(curr => curr === id ? null : id)}
                            />
                        ))}
                    </ManagementGrid>
                )}

                {/* Pagination */}
                {!loading && packages.length > 0 && (
                    <Pagination
                        currentPage={pagination.page}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                        showInfo={true}
                        onLimitChange={changeLimit}
                    />
                )}
            </div>

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
        </ManagementHub>
    );
};

export default SalaryPackages;
