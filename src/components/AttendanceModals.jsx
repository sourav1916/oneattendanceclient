import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaClock, FaCheck, FaSpinner, FaPlus, FaSave, FaCalendarAlt, FaTag, FaFingerprint, FaStickyNote } from 'react-icons/fa';
import SelectField from './SelectField';
import TimeDurationPickerField from './TimeDurationPicker';
import { DatePickerField } from './DatePicker';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import ModalScrollLock from './ModalScrollLock';
import { normalizeAttendanceType } from './AttendanceTypeTabs';
import EmployeeSelect from './common/EmployeeSelect';



const TYPE_OPTIONS = [
    { value: 'attendance', label: 'Attendance' },
    { value: 'break', label: 'Break' }
];

const BINARY_FLAG_OPTIONS = [
    { value: 0, label: 'No' },
    { value: 1, label: 'Yes' }
];

const toBackendAttendanceType = (type) => normalizeAttendanceType(type) === 'attendance' ? 'attendance' : 'break';

const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: "40px",
        borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
        "&:hover": { borderColor: "#6366f1" },
        borderRadius: "0.75rem",
        padding: "0 0.5rem",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
        color: state.isSelected ? "white" : "#1e293b",
        "&:active": { backgroundColor: "#6366f1" },
    }),
};

export const CreateAttendanceModal = ({ isOpen, onClose, companyId, onSuccess, forcedType }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        punch_date: new Date().toISOString().split('T')[0],
        type: normalizeAttendanceType(forcedType || 'attendance'),
        start_time: null,
        end_time: null,
        notes: '',
        is_deductible: 0,
        is_overtime: 0,
        is_half_day: 0
    });

    useEffect(() => {
        if (!isOpen) return;
        setFormData({
            employee_id: '',
            punch_date: new Date().toISOString().split('T')[0],
            type: normalizeAttendanceType(forcedType || 'attendance'),
            start_time: null,
            end_time: null,
            notes: '',
            is_deductible: 0,
            is_overtime: 0,
            is_half_day: 0
        });
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employee_id) {
            toast.error('Please select an employee');
            return;
        }

        setLoading(true);
        try {
            const backendType = toBackendAttendanceType(formData.type);
            const payload = {
                type: backendType,
                employee_id: formData.employee_id,
                punch_date: formData.punch_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                notes: formData.notes,
                is_deductible: Number(formData.is_deductible || 0),
                is_overtime: backendType === 'attendance' ? Number(formData.is_overtime || 0) : 0,
                is_half_day: backendType === 'attendance' ? Number(formData.is_half_day || 0) : 0
            };

            const response = await apiCall('/attendance/create', 'POST', payload, companyId);
            const result = await response.json();
            if (result.success) {
                toast.success('Attendance created successfully');
                onSuccess();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to create attendance');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-[100] px-4 sm:px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <ModalScrollLock />
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 18 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 18 }}
                        transition={{ type: "spring", damping: 25, stiffness: 280 }}
                        className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col z-10 m-auto"
                    >
                        <div className="shrink-0 border-b border-slate-100 bg-white p-4 sm:px-6 sm:py-4 z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-100">
                                        <FaPlus className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Create Attendance</h2>
                                        <p className="text-sm text-slate-500">Manually add a new record</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition-all shadow-sm hover:shadow-md bg-white/50"
                                >
                                    <FaTimes className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaUser className="h-4 w-4 text-indigo-500" /> Employee <span className="text-red-500">*</span>
                                    </label>
                                    <EmployeeSelect
                                        value={formData.employee_id}
                                        onChange={(val) => setFormData(prev => ({ ...prev, employee_id: val }))}
                                        placeholder="Type to search employee..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaCalendarAlt className="h-4 w-4 text-indigo-500" /> Date
                                        </label>
                                        <DatePickerField
                                            value={formData.punch_date}
                                            onChange={(val) => setFormData(prev => ({ ...prev, punch_date: val }))}
                                            mode="single"
                                            buttonClassName="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaTag className="h-4 w-4 text-indigo-500" /> Type
                                        </label>
                                        <SelectField
                                            options={TYPE_OPTIONS}
                                            value={TYPE_OPTIONS.find(o => o.value === formData.type)}
                                            onChange={(val) => setFormData(prev => ({ ...prev, type: val.value }))}
                                            isDisabled={!!forcedType}
                                            styles={customSelectStyles}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaClock className="h-4 w-4 text-indigo-500" />
                                            {formData.type === 'break' ? 'Break In Time' : 'Punch In Time'}
                                        </label>
                                        <TimeDurationPickerField
                                            value={formData.start_time}
                                            onChange={(val) => setFormData(prev => ({ ...prev, start_time: val }))}
                                            mode="time"
                                            className="w-full h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaClock className="h-4 w-4 text-indigo-500" />
                                            {formData.type === 'break' ? 'Break Out Time' : 'Punch Out Time'}
                                        </label>
                                        <TimeDurationPickerField
                                            value={formData.end_time}
                                            onChange={(val) => setFormData(prev => ({ ...prev, end_time: val }))}
                                            mode="time"
                                            className="w-full h-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaCheck className="h-4 w-4 text-indigo-500" /> Is Deductible
                                    </label>
                                    <SelectField
                                        options={[
                                            { value: 1, label: 'Yes, Deduct from work hours' },
                                            { value: 0, label: 'No, Do not deduct' }
                                        ]}
                                        value={{ value: Number(formData.is_deductible || 0), label: Number(formData.is_deductible || 0) === 1 ? 'Yes, Deduct from work hours' : 'No, Do not deduct' }}
                                        onChange={(val) => setFormData(prev => ({ ...prev, is_deductible: Number(val.value) }))}
                                        styles={customSelectStyles}
                                    />
                                </div>

                                {formData.type === 'attendance' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <FaCheck className="h-4 w-4 text-indigo-500" /> Is Overtime
                                            </label>
                                            <SelectField
                                                options={BINARY_FLAG_OPTIONS}
                                                value={BINARY_FLAG_OPTIONS.find(o => o.value === Number(formData.is_overtime || 0))}
                                                onChange={(val) => setFormData(prev => ({ ...prev, is_overtime: Number(val.value) }))}
                                                styles={customSelectStyles}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <FaCheck className="h-4 w-4 text-indigo-500" /> Is Half Day
                                            </label>
                                            <SelectField
                                                options={BINARY_FLAG_OPTIONS}
                                                value={BINARY_FLAG_OPTIONS.find(o => o.value === Number(formData.is_half_day || 0))}
                                                onChange={(val) => setFormData(prev => ({ ...prev, is_half_day: Number(val.value) }))}
                                                styles={customSelectStyles}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaStickyNote className="h-4 w-4 text-indigo-500" /> Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add manual entry notes..."
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                                        rows={3}
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                Create Record
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const EditAttendanceModal = ({ isOpen, onClose, attendance, companyId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const resolvedPunchType = normalizeAttendanceType(attendance?.punch_type || attendance?.type || attendance?.record_type || 'attendance');
    const [formData, setFormData] = useState({
        attendance_date: new Date().toISOString().split('T')[0],
        punch_type: 'attendance',
        punch_in: null,
        punch_out: null,
        notes: '',
        is_deductible: 0,
        is_overtime: 0,
        is_half_day: 0
    });

    useEffect(() => {
        if (isOpen && attendance) {
            const startRecord = attendance.start_record || attendance.punch_in || attendance.break_start || attendance.break_start_ || null;
            const endRecord = attendance.end_record || attendance.punch_out || attendance.break_end || attendance.break_end_ || null;
            setFormData({
                attendance_date: attendance.attendance_date || attendance.punch_date || new Date().toISOString().split('T')[0],
                punch_type: resolvedPunchType,
                punch_in: attendance.start_time || startRecord?.time || null,
                punch_out: attendance.end_time || endRecord?.time || null,
                notes: attendance.notes || '',
                is_deductible: Number(attendance?.is_deductible || 0),
                is_overtime: Number(attendance?.is_overtime || 0),
                is_half_day: Number(attendance?.is_half_day || 0)
            });
        }
    }, [isOpen, attendance, resolvedPunchType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const backendType = toBackendAttendanceType(formData.punch_type);
            const payload = {
                type: backendType,
                punch_id: attendance?.punch_uid || attendance?.punch_id || attendance?.id,
                start_time: formData.punch_in,
                end_time: formData.punch_out,
                notes: formData.notes,
                is_deductible: Number(formData.is_deductible || 0),
                is_overtime: backendType === 'attendance' ? Number(formData.is_overtime || 0) : 0,
                is_half_day: backendType === 'attendance' ? Number(formData.is_half_day || 0) : 0
            };

            const response = await apiCall('/attendance/edit-approve', 'PUT', payload, companyId);
            const result = await response.json();
            if (result.success) {
                toast.success('Attendance updated successfully');
                onSuccess();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to update attendance');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-[100] px-4 sm:px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <ModalScrollLock />
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 18 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 18 }}
                        transition={{ type: "spring", damping: 25, stiffness: 280 }}
                        className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col z-10 m-auto"
                    >
                        <div className="shrink-0 border-b border-slate-100 bg-white p-4 sm:px-6 sm:py-4 z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-100">
                                        <FaClock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Edit Attendance</h2>
                                        <p className="text-sm text-slate-500">Update punch timings and details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition-all shadow-sm hover:shadow-md bg-white/50"
                                >
                                    <FaTimes className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaUser className="h-4 w-4 text-indigo-500" /> Employee <span className="text-red-500">*</span>
                                    </label>
                                    <SelectField
                                        options={[]}
                                        value={{ label: attendance?.employee_name || attendance?.employee?.name || 'N/A', value: 'readonly' }}
                                        isDisabled={true}
                                        styles={customSelectStyles}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaCalendarAlt className="h-4 w-4 text-indigo-500" /> Date
                                        </label>
                                        <DatePickerField
                                            value={formData.attendance_date}
                                            onChange={(val) => setFormData(prev => ({ ...prev, attendance_date: val }))}
                                            mode="single"
                                            buttonClassName="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaTag className="h-4 w-4 text-indigo-500" /> Type
                                        </label>
                                        <SelectField
                                            options={TYPE_OPTIONS}
                                            value={TYPE_OPTIONS.find(o => o.value === formData.punch_type)}
                                            onChange={(val) => setFormData(prev => ({ ...prev, punch_type: val.value }))}
                                            isDisabled={true}
                                            styles={customSelectStyles}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaClock className="h-4 w-4 text-indigo-500" />
                                            {formData.punch_type === 'break' ? 'Break In Time' : 'Punch In Time'}
                                        </label>
                                        <TimeDurationPickerField
                                            value={formData.punch_in}
                                            onChange={(val) => setFormData(prev => ({ ...prev, punch_in: val }))}
                                            mode="time"
                                            className="w-full h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <FaClock className="h-4 w-4 text-indigo-500" />
                                            {formData.punch_type === 'break' ? 'Break Out Time' : 'Punch Out Time'}
                                        </label>
                                        <TimeDurationPickerField
                                            value={formData.punch_out}
                                            onChange={(val) => setFormData(prev => ({ ...prev, punch_out: val }))}
                                            mode="time"
                                            className="w-full h-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaCheck className="h-4 w-4 text-indigo-500" /> Is Deductible
                                    </label>
                                    <SelectField
                                        options={BINARY_FLAG_OPTIONS}
                                        value={BINARY_FLAG_OPTIONS.find(o => o.value === Number(formData.is_deductible || 0))}
                                        onChange={(val) => setFormData(prev => ({ ...prev, is_deductible: Number(val.value) }))}
                                        styles={customSelectStyles}
                                    />
                                </div>

                                {formData.punch_type === 'attendance' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <FaCheck className="h-4 w-4 text-indigo-500" /> Is Overtime
                                            </label>
                                            <SelectField
                                                options={BINARY_FLAG_OPTIONS}
                                                value={BINARY_FLAG_OPTIONS.find(o => o.value === Number(formData.is_overtime || 0))}
                                                onChange={(val) => setFormData(prev => ({ ...prev, is_overtime: Number(val.value) }))}
                                                styles={customSelectStyles}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <FaCheck className="h-4 w-4 text-indigo-500" /> Is Half Day
                                            </label>
                                            <SelectField
                                                options={BINARY_FLAG_OPTIONS}
                                                value={BINARY_FLAG_OPTIONS.find(o => o.value === Number(formData.is_half_day || 0))}
                                                onChange={(val) => setFormData(prev => ({ ...prev, is_half_day: Number(val.value) }))}
                                                styles={customSelectStyles}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FaStickyNote className="h-4 w-4 text-indigo-500" /> Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add notes for this edit..."
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                                        rows={2}
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
