import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
  FaUser, FaBuilding, FaMapMarkerAlt,
  FaInfoCircle, FaEye, FaSpinner, FaHourglassStart, FaHourglassEnd, FaCheck,
  FaBan, FaComment, FaCog, FaTimes, FaCoffee, FaBriefcase, FaPlus, FaEdit, FaHistory
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';
import usePermissionAccess from '../hooks/usePermissionAccess';
import ActionMenu from '../components/ActionMenu';
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import { DatePickerField } from '../components/DatePicker';
import { CreateAttendanceModal, EditAttendanceModal } from '../components/AttendanceModals';
import AttendanceTypeTabs, { getAttendanceTypeConfig } from '../components/AttendanceTypeTabs';
import { ManagementHub, ManagementButton } from '../components/common';
import AttendanceLogsModal from '../components/AttendanceLogsModal';

const NOTES_MODAL_CLASS = "bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col";

// Configuration moved to shared AttendanceTypeTabs component

const Placeholder = () => <span className="text-red-500 font-bold">---</span>;

const formatDateLabel = (value) => {
  if (!value) return <Placeholder />;
  const parsed = String(value).includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return <Placeholder />;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTimeLabel = (value) => {
  if (!value) return <Placeholder />;
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderRecordLabel = (record) => {
  if (!record) return <Placeholder />;
  return [record.time, record.method].filter(Boolean).join(' • ') || <Placeholder />;
};

const attendanceAPI = {
  fetchCompanyAttendances: async (companyId, page = 1, limit = 10, search = '', dateParams = {}, attendanceType = 'work') => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      type: attendanceType,
      ...(search && { search })
    });

    Object.entries(dateParams || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiCall(`/attendance/past-attendance?${queryParams.toString()}`, 'GET', null, companyId);

    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }

    return response.json();
  },

  updateAttendanceStatus: async (companyId, punchIds, action, notes = '') => {
    let endpoint = '';

    if (action === 'verify' || action === 'approve') {
      endpoint = '/attendance/approve';
    } else {
      throw new Error('Invalid action type');
    }

    const response = await apiCall(endpoint, 'PUT', {
      punch_ids: Array.isArray(punchIds) ? punchIds : [punchIds],
      notes
    }, companyId);

    if (!response.ok) {
      throw new Error(`Failed to verify attendance`);
    }

    return response.json();
  }
};

const formatFilterLabel = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

const normalizeAttendanceRow = (row) => ({
  ...row,
  attendance_type: row?.type === 'break' || row?.break_start || row?.break_end ? 'break' : 'work',
  punch_uid: row?.id,
  attendance_date: row?.punch_date || row?.attendance_date || null,
  type: row?.type === 'break' || row?.break_start || row?.break_end ? 'break' : 'work',
  attendance_method: row?.punch_in?.method || row?.punch_out?.method || row?.break_start?.method || row?.break_end?.method || row?.type || 'manual',
  start_label: row?.type === 'break' || row?.break_start || row?.break_end ? 'Break In' : 'Punch In',
  end_label: row?.type === 'break' || row?.break_start || row?.break_end ? 'Break Out' : 'Punch Out',
  start_time: row?.punch_in?.time || row?.break_start?.time || row?.start_time || null,
  end_time: row?.punch_out?.time || row?.break_end?.time || row?.end_time || null,
  start_record: row?.punch_in || row?.break_start || null,
  end_record: row?.punch_out || row?.break_end || null,
  status: row?.status || 'pending',
  notes: row?.notes || '',
  reviewed_by: row?.reviewed_by_name || row?.reviewed_by || null,
  reviewed_at: row?.reviewed_at || null,
  employee: {
    id: row?.employee_id ?? null,
    code: row?.employee_code ?? '',
    name: row?.name ?? '',
    designation: row?.designation ?? '',
    email: row?.email ?? '',
    phone: row?.phone ?? '',
  },
});

const normalizeAttendanceResponse = (response) => {
  if (!Array.isArray(response?.data)) return [];
  return response.data.map(normalizeAttendanceRow);
};

const attendanceMatchesDateFilter = (attendance, filter) => {
  if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return true;

  const sourceDate = attendance?.attendance_date || attendance?.punch_date || attendance?.punch_time || null;
  const punchDate = sourceDate ? new Date(`${String(sourceDate).slice(0, 10)}T00:00:00`) : null;
  if (!punchDate || Number.isNaN(punchDate.getTime())) return false;

  if (filter.date) {
    const selected = new Date(`${filter.date}T00:00:00`);
    return punchDate.toDateString() === selected.toDateString();
  }

  const start = new Date(`${filter.from_date}T00:00:00`);
  const end = new Date(`${filter.to_date}T23:59:59.999`);
  return punchDate >= start && punchDate <= end;
};

// Helper Components
const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { icon: FaCheckCircle, text: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' };
      case 'rejected':
        return { icon: FaTimesCircle, text: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' };
      case 'pending':
        return { icon: FaClock, text: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      default:
        return { icon: FaInfoCircle, text: status || 'Unknown', className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`} title={config.text}>
      <Icon size={12} />
      <span className="hidden min-[400px]:inline">{config.text}</span>
    </span>
  );
};

const PunchTypeBadge = ({ type }) => {
  const getTypeConfig = () => {
    switch (type?.toLowerCase()) {
      case 'in':
        return { icon: FaHourglassStart, text: 'In', className: 'bg-blue-100 text-blue-800' };
      case 'out':
        return { icon: FaHourglassEnd, text: 'Out', className: 'bg-purple-100 text-purple-800' };
      case 'break_start':
        return { icon: FaHourglassStart, text: 'Break Start', className: 'bg-orange-100 text-orange-800' };
      case 'break_end':
        return { icon: FaHourglassEnd, text: 'Break End', className: 'bg-orange-100 text-orange-800' };
      default:
        return { icon: FaClock, text: type || 'Unknown', className: 'bg-gray-100 text-gray-700' };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      <Icon size={10} /> {config.text}
    </span>
  );
};

const AttendanceDetailsModal = ({ attendance, onClose }) => {
  if (!attendance) return null;
  const startRecord = attendance.start_record || attendance.punch_in || attendance.break_start;
  const endRecord = attendance.end_record || attendance.punch_out || attendance.break_end;
  const attendanceTypeMeta = getAttendanceTypeConfig(attendance.type);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
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
        className="relative w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200 flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 bg-white p-5 sm:px-6 sm:py-5 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-100">
                <FaInfoCircle className="text-white h-6 w-6" />
              </div>
              Attendance Details
            </h2>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 transition-all shadow-sm hover:shadow-md bg-white/50">
              <FaTimesCircle size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FaUser className="text-purple-500" /> Employee Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Name</label>
                <p className="font-medium text-gray-800 text-sm truncate">{attendance.employee?.name}</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Code</label>
                <p className="font-medium text-gray-800 text-sm truncate">{attendance.employee?.code}</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Designation</label>
                <p className="font-medium text-gray-800 text-sm truncate">{attendance.employee?.designation}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FaClock className="text-purple-500" /> Attendance Log
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Type</label>
                <div className="mt-0.5">
                  <PunchTypeBadge type={attendance.type} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date</label>
                <p className="font-medium text-gray-800 text-sm">
                  {formatDateLabel(attendance.attendance_date || attendance.punch_date)}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Status</label>
                <div className="mt-0.5">
                  <StatusBadge status={attendance.status} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{attendanceTypeMeta.startLabel}</label>
                <p className="font-medium text-gray-800 text-sm">
                  {renderRecordLabel(startRecord)}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{attendanceTypeMeta.endLabel}</label>
                <p className="font-medium text-gray-800 text-sm">
                  {renderRecordLabel(endRecord)}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Method</label>
                <p className="font-medium text-gray-800 text-sm capitalize">
                  {attendance.attendance_method || <Placeholder />}
                </p>
              </div>
              {attendance.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <FaComment className="text-purple-500" /> Notes
                  </label>
                  <p className="font-medium text-gray-700 text-xs mt-1 p-2 bg-gray-50 rounded-lg border border-gray-100">
                    {attendance.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {attendance.reviewed_at && (
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" /> Review Info
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">By</label>
                  <p className="font-medium text-gray-800 text-sm">
                    {attendance.reviewed_by || 'System'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">At</label>
                  <p className="font-medium text-gray-800 text-sm">
                    {attendance.reviewed_at}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(attendance.punch_in?.punch_in_latitude || attendance.punch_out?.punch_out_latitude || attendance.punch_in?.ip || attendance.punch_out?.ip || attendance.location?.latitude) && (
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaMapMarkerAlt className="text-purple-500" /> Location & Device
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(attendance.punch_in?.punch_in_latitude || attendance.location?.latitude) && (
                  <>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">In Lat</label>
                      <p className="font-medium text-gray-800 text-[11px] truncate">
                        {attendance.punch_in?.punch_in_latitude || attendance.location?.latitude}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">In Long</label>
                      <p className="font-medium text-gray-800 text-[11px] truncate">
                        {attendance.punch_in?.punch_in_longitude || attendance.location?.longitude}
                      </p>
                    </div>
                  </>
                )}
                {attendance.punch_out?.punch_out_latitude && (
                  <>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Out Lat</label>
                      <p className="font-medium text-gray-800 text-[11px] truncate">
                        {attendance.punch_out.punch_out_latitude}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Out Long</label>
                      <p className="font-medium text-gray-800 text-[11px] truncate">
                        {attendance.punch_out.punch_out_longitude}
                      </p>
                    </div>
                  </>
                )}
                {(attendance.punch_in?.ip || attendance.punch_out?.ip || attendance.location?.ip_address) && (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">IP Address</label>
                    <p className="font-medium text-gray-800 text-[11px] truncate">
                      {[attendance.punch_in?.ip, attendance.punch_out?.ip, attendance.location?.ip_address].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaBuilding className="text-purple-500" /> Company Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Company Name</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.company?.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Location</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">
                  {attendance.company?.city}, {attendance.company?.state}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Card View Component for Mobile
const AttendanceCard = ({ attendance, onViewDetails, onApprove, onEdit, onLogs, processingId, onToggleMenu, activeMenuId, approveDisabled, reviewMessage }) => {
  const typeMeta = getAttendanceTypeConfig(attendance.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onViewDetails(attendance)}
      className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FaUser className="text-purple-600 text-base sm:text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{attendance.employee?.name}</h3>
            <p className="text-xs text-gray-500 truncate">{attendance.employee?.code}</p>
            <p className="text-xs text-gray-400 truncate">{attendance.employee?.designation}</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            menuId={attendance.id}
            activeId={activeMenuId}
            onToggle={(e, id) => onToggleMenu(id)}
            actions={[
              ...(attendance.status === 'pending' ? [
                {
                  label: 'Verify',
                  icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />,
                  onClick: () => onApprove(attendance.id),
                  disabled: processingId === attendance.id || approveDisabled,
                  title: approveDisabled ? reviewMessage : '',
                  className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                }
              ] : []),
              {
                label: 'Edit',
                icon: <FaEdit size={12} />,
                onClick: () => onEdit(attendance),
                className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
              },
              {
                label: 'View Details',
                icon: <FaEye size={12} />,
                onClick: () => onViewDetails(attendance),
                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              },
              {
                label: 'Logs',
                icon: <FaHistory size={12} />,
                onClick: () => onLogs(attendance),
                className: 'text-slate-600 hover:text-slate-700 hover:bg-slate-50'
              }
            ]}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Date:</span>
          <span className="text-gray-700 text-xs sm:text-sm">{formatDateLabel(attendance.attendance_date || attendance.punch_date)}</span>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">{typeMeta.startLabel}:</span>
          <span className="font-medium text-xs sm:text-sm">{attendance.start_time ? formatTimeLabel(attendance.start_time) : <Placeholder />}</span>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">{typeMeta.endLabel}:</span>
          <span className="font-medium text-xs sm:text-sm">{attendance.end_time ? formatTimeLabel(attendance.end_time) : <Placeholder />}</span>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Status:</span>
          <StatusBadge status={attendance.status} />
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Method:</span>
          <span className="text-gray-700 text-xs sm:text-sm">{attendance.attendance_method || <Placeholder />}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const AttendanceManagement = ({ companyId }) => {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateFilterLabel, setDateFilterLabel] = useState('Filter by date');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [logsModalRecord, setLogsModalRecord] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [attendanceType, setAttendanceType] = useState('work');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const resolvedCompanyId = companyId || JSON.parse(localStorage.getItem('company') || 'null')?.id;
  const previousSearchRef = useRef('');
  const previousTypeRef = useRef('work');
  const lastRequestKeyRef = useRef('');

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const itemsPerPage = pagination.limit;
  const approveAccess = checkActionAccess('attendanceManagement', 'approve');
  const attendanceReviewMessage = getAccessMessage(approveAccess);
  const attendanceDateFilterRef = useRef({});
  const activeAttendanceTypeMeta = getAttendanceTypeConfig(attendanceType);

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const SIDEBAR_OFFSET = windowWidth >= 768 ? 80 : 0;
  const effectiveWidth = windowWidth - SIDEBAR_OFFSET;

  // Refined column visibility based on effective width to prevent overflow
  const showDate = effectiveWidth >= 640;
  const showTimes = effectiveWidth >= 900;
  const showMethod = effectiveWidth >= 1100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAttendances = useCallback(async (force = false, dateParams = attendanceDateFilterRef.current) => {
    if (!resolvedCompanyId) {
      setError('Company ID is required');
      setLoading(false);
      return;
    }
    const requestKey = `${resolvedCompanyId}-${attendanceType}-${pagination.page}-${debouncedSearchTerm}-${pagination.limit}-${JSON.stringify(dateParams || {})}`;
    if (!force && lastRequestKeyRef.current === requestKey) {
      return;
    }

    try {
      lastRequestKeyRef.current = requestKey;
      setLoading(true);
      const response = await attendanceAPI.fetchCompanyAttendances(
        resolvedCompanyId,
        pagination.page,
        itemsPerPage,
        debouncedSearchTerm,
        dateParams,
        attendanceType
      );

      if (response.success) {
        const currentPage = response.current_page || response.page || pagination.page;
        const perPage = response.per_page || response.limit || pagination.limit;
        const total = response.total || 0;
        const totalPages = response.total_pages || response.last_page || Math.ceil(total / perPage) || 1;

        setAttendances(normalizeAttendanceResponse(response));
        updatePagination({
          page: currentPage,
          limit: perPage,
          total,
          total_pages: totalPages,
          is_last_page: currentPage >= totalPages
        });
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to fetch attendances');
      }
    } catch (err) {
      lastRequestKeyRef.current = '';
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [resolvedCompanyId, pagination.page, pagination.limit, debouncedSearchTerm, itemsPerPage, updatePagination, attendanceType]);

  useEffect(() => {
    const typeChanged = previousTypeRef.current !== attendanceType;
    if (typeChanged) {
      previousTypeRef.current = attendanceType;
      lastRequestKeyRef.current = '';
      if (pagination.page !== 1) {
        goToPage(1);
        return;
      }
    }

    if (previousSearchRef.current !== debouncedSearchTerm && pagination.page !== 1) {
      previousSearchRef.current = debouncedSearchTerm;
      goToPage(1);
      return;
    }

    previousSearchRef.current = debouncedSearchTerm;
    fetchAttendances();
  }, [pagination.page, debouncedSearchTerm, attendanceType, fetchAttendances, goToPage]);

  const handleStatusUpdate = async (punchIds, action) => {
    await processStatusUpdate(punchIds, action, '');
  };

  const processStatusUpdate = async (punchIds, action, notesText) => {
    try {
      const idsArray = Array.isArray(punchIds) ? punchIds : [punchIds];
      setProcessingId(idsArray.length === 1 ? idsArray[0] : 'bulk');
      const response = await attendanceAPI.updateAttendanceStatus(resolvedCompanyId, idsArray, action, notesText);

      if (response.success) {
        toast.success(idsArray.length > 1 ? 'Records verified successfully' : 'Attendance verified successfully');
        fetchAttendances(true);
        setSelectedAction(null);
        setActiveActionMenu(null);
      } else {
        throw new Error(response.message || 'Failed to verify');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (attendance) => {
    setSelectedAttendance(attendance);
    setShowModal(true);
    setActiveActionMenu(null);
  };

  const handleEditAttendance = (attendance) => {
    setSelectedAttendance(attendance);
    setShowEditModal(true);
    setActiveActionMenu(null);
  };

  const toggleActionMenu = (attendanceId) => {
    setActiveActionMenu((current) => (current === attendanceId ? null : attendanceId));
  };

  const handleDateFilterApply = useCallback((result) => {
    let nextParams = {};
    let nextLabel = 'Filter by date';

    if (typeof result === 'string' && result) {
      nextParams = { date: result };
      nextLabel = formatFilterLabel(result);
    } else if (result?.start && result?.end) {
      nextParams = { from_date: result.start, to_date: result.end };
      nextLabel = result.start === result.end
        ? formatFilterLabel(result.start)
        : `${formatFilterLabel(result.start)} - ${formatFilterLabel(result.end)}`;
    }

    attendanceDateFilterRef.current = nextParams;
    setDateFilterLabel(nextLabel);

    if (pagination.page !== 1) {
      goToPage(1);
    } else {
      fetchAttendances(true, nextParams);
    }
  }, [fetchAttendances, goToPage, pagination.page]);

  const clearDateFilter = useCallback(() => {
    attendanceDateFilterRef.current = {};
    setDateFilterLabel('Filter by date');

    if (pagination.page !== 1) {
      goToPage(1);
    } else {
      fetchAttendances(true, {});
    }
  }, [fetchAttendances, goToPage, pagination.page]);

  const visibleAttendances = useMemo(() => {
    const filter = attendanceDateFilterRef.current;
    const list = Array.isArray(attendances) ? attendances : [];

    if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return list;
    return list.filter((attendance) => attendanceMatchesDateFilter(attendance, filter));
  }, [attendances, dateFilterLabel]);

  if (!resolvedCompanyId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Company ID is required</p>
        </div>
      </div>
    );
  }

  return (
    <ManagementHub
      eyebrow={<><FaClock size={11} /> Management</>}
      title="Attendance Records"
      description="Monitor and manage all employee attendance records and punch logs."
      accent="blue"
      actions={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-300"
          >
            <FaPlus />
            <span>Create</span>
          </button>
        </div>
      }
    >
      <div className="max-w-screen-2xl mx-auto px-2">
        <AttendanceTypeTabs value={attendanceType} onChange={setAttendanceType} />


        {/* Consolidated Filter & View Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-2"
        >
          {/* Left Section: Search */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder={`Search ${activeAttendanceTypeMeta.shortLabel.toLowerCase()} attendance by employee name, code, or email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
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
          </div>

          {/* Right Section: Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DatePickerField
                value=""
                onChange={handleDateFilterApply}
                placeholder={dateFilterLabel}
                buttonClassName="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                wrapperClassName="w-auto"
                popoverClassName="w-[min(92vw,24rem)]"
                initialTab="quick"
                mode="both"
              />
              {dateFilterLabel !== 'Filter by date' && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                  title="Clear date filter"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

            <ManagementViewSwitcher
              viewMode={viewMode}
              onChange={setViewMode}
              accent="blue"
            />
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-blue-500 text-3xl sm:text-4xl" />
          </div>
        ) : visibleAttendances.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 md:p-12 text-center">
            <FaClock className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">No {activeAttendanceTypeMeta.shortLabel.toLowerCase()} attendance records found</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {dateFilterLabel !== 'Filter by date' ? `Try adjusting ${dateFilterLabel.toLowerCase()}` : 'Try adjusting your search'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-xl overflow-visible"
              >
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Employee</th>
                        {showDate && <th className="px-6 py-4 font-bold tracking-wider">Date</th>}
                        {showTimes && <th className="px-6 py-4 font-bold tracking-wider">{activeAttendanceTypeMeta.startLabel}</th>}
                        {showTimes && <th className="px-6 py-4 font-bold tracking-wider">{activeAttendanceTypeMeta.endLabel}</th>}
                        <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                        {showMethod && <th className="px-6 py-4 font-bold tracking-wider">Method</th>}
                        <th className="px-6 py-4 text-center font-bold tracking-wider"><FaCog className="w-4 h-4 mx-auto" /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {visibleAttendances.map((attendance) => (
                        <motion.tr
                          key={attendance.id}
                          onClick={() => handleViewDetails(attendance)}
                          className={`cursor-pointer transition-all duration-300 ${(!attendance.start_time || !attendance.end_time)
                              ? 'bg-gradient-to-r from-red-50/60 via-rose-50/40 to-pink-50/60 backdrop-blur-sm hover:from-red-100/60 hover:via-rose-100/40 hover:to-pink-100/60'
                              : 'hover:bg-gray-50'
                            }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attendanceType === 'break' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                                <FaUser className={`${attendanceType === 'break' ? 'text-indigo-600' : 'text-blue-600'}`} />
                              </div>
                              <div className="truncate max-w-[200px]">
                                <p className="font-medium text-gray-900">{attendance.employee?.name}</p>
                                <p className="text-xs text-gray-500">{attendance.employee?.code}</p>
                              </div>
                            </div>
                          </td>
                          {showDate && <td className="px-6 py-4 whitespace-nowrap">{formatDateLabel(attendance.attendance_date || attendance.punch_date)}</td>}
                          {showTimes && <td className="px-6 py-4 whitespace-nowrap">{attendance.start_time ? formatTimeLabel(attendance.start_time) : <Placeholder />}</td>}
                          {showTimes && <td className="px-6 py-4 whitespace-nowrap">{attendance.end_time ? formatTimeLabel(attendance.end_time) : <Placeholder />}</td>}
                          <td className="px-6 py-4"><StatusBadge status={attendance.status} /></td>
                          {showMethod && <td className="px-6 py-4">{attendance.attendance_method || <Placeholder />}</td>}
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                              menuId={attendance.id}
                              activeId={activeActionMenu}
                              onToggle={(e, id) => toggleActionMenu(id)}
                              actions={[
                                ...(attendance.status === 'pending' ? [
                                  {
                                    label: 'Verify',
                                    icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />,
                                    onClick: () => handleStatusUpdate(attendance.id, 'verify'),
                                    disabled: processingId === attendance.id || approveAccess.disabled,
                                    title: approveAccess.disabled ? attendanceReviewMessage : '',
                                    className: 'text-green-600 hover:bg-green-50'
                                  },
                                ] : []),
                                {
                                  label: 'Edit',
                                  icon: <FaEdit size={12} />,
                                  onClick: () => handleEditAttendance(attendance),
                                  className: 'text-indigo-600 hover:bg-indigo-50'
                                },
                                {
                                  label: 'View Details',
                                  icon: <FaEye size={12} />,
                                  onClick: () => handleViewDetails(attendance),
                                  className: 'text-blue-600 hover:bg-blue-50'
                                },
                                {
                                  label: 'Logs',
                                  icon: <FaHistory size={12} />,
                                  onClick: () => setLogsModalRecord(attendance),
                                  className: 'text-slate-600 hover:bg-slate-50'
                                }
                              ]}
                            />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {viewMode === 'card' && (
              <ManagementGrid viewMode={viewMode}>
                {visibleAttendances.map((attendance) => (
                  <AttendanceCard
                    key={attendance.id}
                    attendance={attendance}
                    onViewDetails={handleViewDetails}
                    onApprove={(id) => handleStatusUpdate(id, 'verify')}
                    onEdit={handleEditAttendance}
                    onLogs={(attendance) => setLogsModalRecord(attendance)}
                    processingId={processingId}
                    onToggleMenu={(e, id) => toggleActionMenu(id)}
                    activeMenuId={activeActionMenu}
                    approveDisabled={approveAccess.disabled}
                    reviewMessage={attendanceReviewMessage}
                  />
                ))}
              </ManagementGrid>
            )}

            {pagination.total > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={goToPage}
                  onLimitChange={changeLimit}
                />
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && selectedAttendance && (
          <AttendanceDetailsModal
            attendance={selectedAttendance}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateAttendanceModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            companyId={resolvedCompanyId}
            onSuccess={() => fetchAttendances(true)}
            forcedType={attendanceType}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedAttendance && (
          <EditAttendanceModal
            isOpen={showEditModal}
            onClose={() => { setShowEditModal(false); setSelectedAttendance(null); }}
            companyId={resolvedCompanyId}
            onSuccess={() => fetchAttendances(true)}
            attendance={selectedAttendance}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logsModalRecord && (
          <AttendanceLogsModal
            id={logsModalRecord.id}
            type={logsModalRecord.type || attendanceType}
            onClose={() => setLogsModalRecord(null)}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
};

export default AttendanceManagement;
