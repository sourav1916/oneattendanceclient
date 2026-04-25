import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaCheckCircle, FaTimesCircle, FaClock,
  FaUser, FaBuilding, FaMapMarkerAlt,
  FaInfoCircle, FaEye, FaSpinner, FaHourglassStart, FaHourglassEnd, FaCheck,
  FaBan, FaComment, FaHistory, FaUserCheck, FaCog,
  FaEllipsisV,FaTimes
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

const NOTES_MODAL_CLASS = "bg-white rounded-[10px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col";

const attendanceAPI = {
  fetchCompanyAttendances: async (companyId, page = 1, limit = 10, search = '', dateParams = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    Object.entries(dateParams || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await apiCall(`/attendance/all-employees?${queryParams.toString()}`, 'GET', null, companyId);

    if (!response.ok) {
      throw new Error('Failed to fetch attendance data');
    }

    return response.json();
  },

  updateAttendanceStatus: async (companyId, punchId, action, notes = '') => {
    let endpoint = '';

    if (action === 'approve') {
      endpoint = '/attendance/approve';
    } else if (action === 'reject') {
      endpoint = '/attendance/reject';
    } else {
      throw new Error('Invalid action type');
    }

    const response = await apiCall(endpoint, 'PUT', {
      punch_id: punchId,
      notes
    }, companyId);

    if (!response.ok) {
      throw new Error(`Failed to ${action} attendance`);
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

const attendanceMatchesDateFilter = (attendance, filter) => {
  if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return true;

  const punchDate = attendance?.punch_time ? new Date(attendance.punch_time) : null;
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-[10px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 sm:p-6 rounded-t-[10px] z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <FaInfoCircle /> Attendance Details
            </h2>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-[10px] transition">
              <FaTimesCircle size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaUser className="text-purple-500" /> Employee Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Name</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee?.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Email</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-all">{attendance.employee?.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Employee Code</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee?.code}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Designation</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.employee?.designation}</p>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaClock className="text-purple-500" /> Attendance Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Punch Type</label>
                <div className="mt-1">
                  <PunchTypeBadge type={attendance.punch_type} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Punch Time</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">
                  {new Date(attendance.punch_time).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <div className="mt-1">
                  <StatusBadge status={attendance.status} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Method</label>
                <p className="font-medium text-gray-800 text-sm sm:text-base">
                  {attendance.attendance?.method || 'N/A'}
                  {attendance.attendance?.mode && ` (${attendance.attendance.mode})`}
                </p>
              </div>
            </div>
          </div>

          {(attendance.location?.latitude || attendance.location?.ip_address) && (
            <div className="border-b pb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaMapMarkerAlt className="text-purple-500" /> Location & Device
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {attendance.location?.latitude && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Latitude</label>
                      <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.location.latitude}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Longitude</label>
                      <p className="font-medium text-gray-800 text-sm sm:text-base break-words">{attendance.location.longitude}</p>
                    </div>
                  </>
                )}
                {attendance.location?.ip_address && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 uppercase">IP Address</label>
                    <p className="font-medium text-gray-800 text-sm sm:text-base break-all">{attendance.location.ip_address}</p>
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
const AttendanceCard = ({ attendance, onViewDetails, onApprove, onReject, processingId, onToggleMenu, activeMenuId, approveDisabled, rejectDisabled, reviewMessage }) => {
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onViewDetails(attendance)}
        className="bg-white rounded-[10px] shadow-lg p-4 border border-gray-100 h-full flex flex-col"
      >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-[10px] flex items-center justify-center flex-shrink-0">
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
                  label: 'Approve',
                  icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />,
                  onClick: () => onApprove(attendance.id),
                  disabled: processingId === attendance.id || approveDisabled,
                  title: approveDisabled ? reviewMessage : '',
                  className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                },
                {
                  label: 'Reject',
                  icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaBan size={12} />,
                  onClick: () => onReject(attendance.id),
                  disabled: processingId === attendance.id || rejectDisabled,
                  title: rejectDisabled ? reviewMessage : '',
                  className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }
              ] : []),
              {
                label: 'View Details',
                icon: <FaEye size={12} />,
                onClick: () => onViewDetails(attendance),
                className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              }
            ]}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Punch Type:</span>
          <PunchTypeBadge type={attendance.punch_type} />
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Time:</span>
          <span className="font-medium text-xs sm:text-sm">{formatTime(attendance.punch_time)}</span>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Date:</span>
          <span className="text-gray-700 text-xs sm:text-sm">{formatDate(attendance.punch_time)}</span>
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Status:</span>
          <StatusBadge status={attendance.status} />
        </div>
        <div className="flex justify-between items-center flex-wrap gap-1">
          <span className="text-gray-500 text-xs sm:text-sm">Method:</span>
          <span className="text-gray-700 text-xs sm:text-sm">{attendance.attendance?.method || 'N/A'}</span>
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
  const [viewMode, setViewMode] = useState('table');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const navigate = useNavigate();

  const resolvedCompanyId = companyId || JSON.parse(localStorage.getItem('company') || 'null')?.id;
  const previousSearchRef = useRef('');
  const lastRequestKeyRef = useRef('');

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const itemsPerPage = pagination.limit;
  const approveAccess = checkActionAccess('attendanceManagement', 'approve');
  const rejectAccess = checkActionAccess('attendanceManagement', 'reject');
  const attendanceReviewMessage = getAccessMessage(approveAccess.disabled ? approveAccess : rejectAccess);
  const attendanceDateFilterRef = useRef({});

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

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Refined column visibility based on effective width to prevent overflow
  const showPunchType = effectiveWidth >= 640;
  const showDateTime = effectiveWidth >= 900;
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
    const requestKey = `${resolvedCompanyId}-${pagination.page}-${debouncedSearchTerm}-${pagination.limit}-${JSON.stringify(dateParams || {})}`;
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
        dateParams
      );

      if (response.success) {
        const currentPage = response.current_page || response.page || pagination.page;
        const perPage = response.per_page || response.limit || pagination.limit;
        const total = response.total || 0;
        const totalPages = response.total_pages || response.last_page || Math.ceil(total / perPage) || 1;

        setAttendances(response.data);
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
  }, [resolvedCompanyId, pagination.page, pagination.limit, debouncedSearchTerm, itemsPerPage, updatePagination]);

  useEffect(() => {
    if (previousSearchRef.current !== debouncedSearchTerm && pagination.page !== 1) {
      previousSearchRef.current = debouncedSearchTerm;
      goToPage(1);
      return;
    }

    previousSearchRef.current = debouncedSearchTerm;
    fetchAttendances();
  }, [pagination.page, debouncedSearchTerm, fetchAttendances, goToPage]);

  const handleStatusUpdate = async (punchId, action) => {
    if (action === 'reject' && !notes.trim()) {
      setSelectedAction({ punchId, action });
      setShowNotesModal(true);
      setActiveActionMenu(null);
      return;
    }

    await processStatusUpdate(punchId, action, notes);
  };

  const processStatusUpdate = async (punchId, action, notesText) => {
    try {
      setProcessingId(punchId);
      const response = await attendanceAPI.updateAttendanceStatus(resolvedCompanyId, punchId, action, notesText);

      if (response.success) {
        toast.success(`Attendance ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        fetchAttendances(true);
        setNotes('');
        setShowNotesModal(false);
        setSelectedAction(null);
        setActiveActionMenu(null);
      } else {
        throw new Error(response.message || 'Failed to update status');
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (!filter || (!filter.date && !filter.from_date && !filter.to_date)) return attendances;
    return attendances.filter((attendance) => attendanceMatchesDateFilter(attendance, filter));
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[10px] border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-700">
                <FaClock size={11} />
                Attendance management
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Attendance Management
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Monitor and approve employee attendance records and punch logs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <button
                type="button"
                onClick={() => navigate('/pending-attendance')}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 shadow-sm active:scale-95 whitespace-nowrap"
              >
                <FaClock />
                Pending Attendance
              </button>
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
                <FaCheckCircle className="text-purple-600" />
                <span className="font-medium text-gray-700">{pagination.total}</span>
                <span className="text-gray-500">records</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Consolidated Filter & View Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-gray-100 shadow-sm mb-6"
        >
          {/* Left Section: Search & Result Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search by employee name, email, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm"
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
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <DatePickerField
                value=""
                onChange={handleDateFilterApply}
                placeholder={dateFilterLabel}
                buttonClassName="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                wrapperClassName="w-auto"
                popoverClassName="w-[min(92vw,24rem)]"
                initialTab="quick"
                mode="both"
              />
              {dateFilterLabel !== 'Filter by date' && (
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="p-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                  title="Clear date filter"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

            {/* View Switcher */}
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
            <FaSpinner className="animate-spin text-purple-500 text-3xl sm:text-4xl" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-3 sm:p-4 text-red-700 text-center text-sm sm:text-base">
            {error}
          </div>
        ) : visibleAttendances.length === 0 ? (
          <div className="bg-white rounded-[10px] shadow-lg p-8 sm:p-10 md:p-12 text-center">
            <FaClock className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-base md:text-lg">No attendance records found</p>
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
                className="bg-white rounded-[10px] shadow-xl overflow-visible"
              >
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                      <tr>
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                        {showPunchType && <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>}
                        {showDateTime && <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>}
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        {showMethod && <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>}
                        <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"><FaCog className="w-4 h-4 mx-auto" /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {visibleAttendances.map((attendance) => (
                      <motion.tr
                        key={attendance.id}
                        onClick={() => handleViewDetails(attendance)}
                        className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                      >
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                                <FaUser className="text-purple-600" />
                              </div>
                              <div className="truncate max-w-[200px]">
                                <p className="font-medium text-gray-900 text-sm">{attendance.employee?.name}</p>
                                <p className="text-xs text-gray-500">{attendance.employee?.code}</p>
                              </div>
                            </div>
                          </td>
                          {showPunchType && <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4"><PunchTypeBadge type={attendance.punch_type} /></td>}
                          {showDateTime && <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">{formatDateTime(attendance.punch_time)}</td>}
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4"><StatusBadge status={attendance.status} /></td>
                          {showMethod && <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-sm">{attendance.attendance?.method || 'N/A'}</td>}
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                              menuId={attendance.id}
                              activeId={activeActionMenu}
                              onToggle={(e, id) => toggleActionMenu(id)}
                              actions={[
                                ...(attendance.status === 'pending' ? [
                                  {
                                    label: 'Approve',
                                    icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />,
                                    onClick: () => handleStatusUpdate(attendance.id, 'approve'),
                                    disabled: processingId === attendance.id || approveAccess.disabled,
                                    title: approveAccess.disabled ? getAccessMessage(approveAccess) : '',
                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  },
                                  {
                                    label: 'Reject',
                                    icon: processingId === attendance.id ? <FaSpinner className="animate-spin" size={12} /> : <FaBan size={12} />,
                                    onClick: () => handleStatusUpdate(attendance.id, 'reject'),
                                    disabled: processingId === attendance.id || rejectAccess.disabled,
                                    title: rejectAccess.disabled ? getAccessMessage(rejectAccess) : '',
                                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                  }
                                ] : []),
                                {
                                  label: 'View Details',
                                  icon: <FaEye size={12} />,
                                  onClick: () => handleViewDetails(attendance),
                                  className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
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
                    onApprove={(id) => handleStatusUpdate(id, 'approve')}
                    onReject={(id) => handleStatusUpdate(id, 'reject')}
                    processingId={processingId}
                    onToggleMenu={(e, id) => toggleActionMenu(id)}
                    activeMenuId={activeActionMenu}
                    approveDisabled={approveAccess.disabled}
                    rejectDisabled={rejectAccess.disabled}
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
        {showNotesModal && selectedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowNotesModal(false); setSelectedAction(null); setNotes(''); }}
          >
            <ModalScrollLock />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={NOTES_MODAL_CLASS}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FaComment /> Rejection Notes
                </h2>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Please provide a reason for rejection</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-[10px] focus:ring-2 focus:ring-purple-500 outline-none transition"
                  placeholder="Enter rejection reason..."
                  autoFocus
                />
                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => { setShowNotesModal(false); setSelectedAction(null); setNotes(''); }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-[10px] hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (notes.trim()) {
                        processStatusUpdate(selectedAction.punchId, selectedAction.action, notes);
                      } else {
                        toast.warning('Please provide a reason for rejection');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-[10px] hover:bg-red-700 transition font-medium shadow-lg"
                  >
                    Submit Rejection
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

export default AttendanceManagement;
