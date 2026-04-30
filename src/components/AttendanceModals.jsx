import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaClock, FaCheck, FaSpinner, FaPlus, FaSave, FaHandPaper } from 'react-icons/fa';
import SelectField from './SelectField';
import TimeDurationPickerField from './TimeDurationPicker';
import { DatePickerField } from './DatePicker';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import ModalScrollLock from './ModalScrollLock';

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const METHOD_OPTIONS = [
    { value: 'manual', label: 'Manual' },
    { value: 'gps', label: 'GPS' },
    { value: 'face', label: 'Face' },
    { value: 'qr', label: 'QR' },
    { value: 'fingerprint', label: 'Fingerprint' },
    { value: 'ip', label: 'IP' }
];

const TYPE_OPTIONS = [
    { value: 'work', label: 'Work' },
    { value: 'break', label: 'Break' }
];

export const CreateAttendanceModal = ({ isOpen, onClose, companyId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: null,
        attendance_date: new Date().toISOString().split('T')[0],
        punch_type: 'work',
        punch_in: '09:00:00',
        punch_out: '18:00:00',
        method: 'manual'
    });

    useEffect(() => {
        if (isOpen && companyId) {
            fetchEmployees();
        }
    }, [isOpen, companyId]);

    const fetchEmployees = async () => {
        setEmployeesLoading(true);
        try {
            const response = await apiCall('/employees/list?limit=1000', 'GET', null, companyId);
            const result = await response.json();
            if (result.success) {
                setEmployees((result.data || []).map(emp => ({
                    value: emp.id,
                    label: emp.name,
                    employee_code: emp.employee_code
                })));
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setEmployeesLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employee_id) {
            toast.error('Please select an employee');
            return;
        }

        setLoading(true);
        try {
            const response = await apiCall('/attendance/create', 'POST', {
                ...formData,
                employee_id: formData.employee_id.value
            }, companyId);
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

    if (!isOpen) return null;

    return (
        <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <ModalScrollLock />
            <motion.div
                variants={modalVariants}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                            <FaPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Create Attendance</h2>
                            <p className="text-sm text-slate-500 text-left">Manually add a new attendance record</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
                        <FaTimes size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FaUser size={12} className="text-blue-500" /> Employee
                        </label>
                        <SelectField
                            options={employees}
                            isLoading={employeesLoading}
                            value={formData.employee_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, employee_id: val }))}
                            placeholder="Search and select employee..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <DatePickerField
                                value={formData.attendance_date}
                                onChange={(val) => setFormData(prev => ({ ...prev, attendance_date: val }))}
                                mode="single"
                                buttonClassName="w-full h-10 bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                            <SelectField
                                options={TYPE_OPTIONS}
                                value={TYPE_OPTIONS.find(o => o.value === formData.punch_type)}
                                onChange={(val) => setFormData(prev => ({ ...prev, punch_type: val.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punch In Time</label>
                            <TimeDurationPickerField
                                value={formData.punch_in}
                                onChange={(val) => setFormData(prev => ({ ...prev, punch_in: val }))}
                                mode="time"
                                className="w-full h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Out Time</label>
                            <TimeDurationPickerField
                                value={formData.punch_out}
                                onChange={(val) => setFormData(prev => ({ ...prev, punch_out: val }))}
                                mode="time"
                                className="w-full h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FaHandPaper size={12} className="text-blue-500" /> Method
                        </label>
                        <SelectField
                            options={METHOD_OPTIONS}
                            value={METHOD_OPTIONS.find(o => o.value === formData.method)}
                            onChange={(val) => setFormData(prev => ({ ...prev, method: val.value }))}
                        />
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                        Create Record
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const EditAttendanceModal = ({ isOpen, onClose, attendance, companyId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        punch_in: '09:00:00',
        punch_out: '18:00:00',
        method: 'manual'
    });

    useEffect(() => {
        if (isOpen && attendance) {
            setFormData({
                punch_in: attendance.start_time || '09:00:00',
                punch_out: attendance.end_time || '18:00:00',
                method: attendance.attendance_method || 'manual'
            });
        }
    }, [isOpen, attendance]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiCall('/attendance/update', 'PUT', {
                punch_id: attendance?.punch_uid || attendance?.punch_id || attendance?.id,
                ...formData
            }, companyId);
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

    if (!isOpen) return null;

    return (
        <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <ModalScrollLock />
            <motion.div
                variants={modalVariants}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
                            <FaClock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 text-left">Edit Attendance</h2>
                            <p className="text-sm text-slate-500 text-left">Update punch timings and method</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
                        <FaTimes size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                <FaUser />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{attendance?.employee_name || attendance?.employee?.name}</p>
                                <p className="text-xs text-slate-500">{attendance?.attendance_date || attendance?.punch_date}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punch In</label>
                            <TimeDurationPickerField
                                value={formData.punch_in}
                                onChange={(val) => setFormData(prev => ({ ...prev, punch_in: val }))}
                                mode="time"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Out</label>
                            <TimeDurationPickerField
                                value={formData.punch_out}
                                onChange={(val) => setFormData(prev => ({ ...prev, punch_out: val }))}
                                mode="time"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method</label>
                        <SelectField
                            options={METHOD_OPTIONS}
                            value={METHOD_OPTIONS.find(o => o.value === formData.method)}
                            onChange={(val) => setFormData(prev => ({ ...prev, method: val.value }))}
                        />
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
