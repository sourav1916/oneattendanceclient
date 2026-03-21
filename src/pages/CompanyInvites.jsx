import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserTie,
  FaClock,
  FaExclamationCircle,
  FaSpinner,
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBriefcase,
  FaDollarSign,
  FaTag,
  FaSearch,
  FaTimes,
  FaInfoCircle,
  FaUserCircle
} from "react-icons/fa";
import EditStaffModal from "../components/StaffModals/EditStaffModal";
import Skeleton from "../components/SkeletonComponent";
import Pagination, { usePagination } from "../components/PaginationComponent";

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

export default function CompanyInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Use ref to track if fetch is in progress
  const fetchInProgress = useRef(false);

  // Use reusable pagination hook
  const {
    pagination,
    updatePagination,
    goToPage,
  } = usePagination(1, 10);

  const API_BASE = "https://api-attendance.onesaas.in";
  const company_id = JSON.parse(localStorage.getItem('company'))?.id;

  // Debounce search - removed goToPage from dependency to prevent infinite loop
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchInvites = useCallback(async (page = pagination.page, search = debouncedSearchTerm, resetLoading = true) => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);
    
    try {
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE}/company/invites/${company_id}/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invites');
      }

      const result = await response.json();

      if (result.success) {
        setInvites(result.data || []);
        // Update pagination with response data
        updatePagination({
          page: result.current_page || page,
          limit: result.per_page || pagination.limit,
          total: result.total || 0,
          total_pages: result.last_page || Math.ceil((result.total || 0) / pagination.limit),
          is_last_page: result.current_page === result.last_page
        });
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch invites');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      fetchInProgress.current = false;
    }
  }, [company_id, pagination.limit, updatePagination]);

  // Handle page changes - separate effect to avoid loops
  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page) {
      goToPage(newPage);
    }
  }, [pagination.page, goToPage]);

  // Fetch when page changes
  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current) {
      fetchInvites(pagination.page, debouncedSearchTerm, true);
    }
  }, [pagination.page]); // Only depend on pagination.page

  // Handle search changes - reset to page 1
  useEffect(() => {
    if (!isInitialLoad) {
      // Reset to page 1 when search changes
      if (pagination.page !== 1) {
        goToPage(1);
      } else {
        fetchInvites(1, debouncedSearchTerm, true);
      }
    }
  }, [debouncedSearchTerm]); // Only depend on debouncedSearchTerm

  // Initial load
  useEffect(() => {
    if (company_id && isInitialLoad) {
      fetchInvites(1, '', true);
    } else if (!company_id) {
      setError('Company ID not found');
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [company_id]); // Only run when company_id changes

  const handleCancelInvite = async (token) => {
    try {
      setProcessingId(token);
      const authToken = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/company/invites/cancel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invite');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh current page after cancel
        await fetchInvites(pagination.page, debouncedSearchTerm, false);
        closeModal();
      } else {
        throw new Error(result.message || 'Failed to cancel invite');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditClick = (invite) => {
    setEditingInvite(invite);
    setIsEditModalOpen(true);
    setActiveActionMenu(null);
  };

  const handleEditSuccess = () => {
    fetchInvites(pagination.page, debouncedSearchTerm, false);
    setIsEditModalOpen(false);
    setEditingInvite(null);
  };

  const isExpired = (date) => new Date(date) < new Date();

  const getStatusBadge = (status, expiresAt) => {
    if (isExpired(expiresAt)) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: FaTimesCircle,
        text: 'Expired',
        className: 'bg-red-100 text-red-800 border border-red-200'
      };
    }

    switch (status) {
      case 'accepted':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: FaCheckCircle,
          text: 'Accepted',
          className: 'bg-green-100 text-green-800 border border-green-200'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: FaClock,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FaBan,
          text: 'Cancelled',
          className: 'bg-gray-100 text-gray-800 border border-gray-200'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FaExclamationCircle,
          text: status,
          className: 'bg-gray-100 text-gray-800 border border-gray-200'
        };
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateSimple = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openModal = (invite, type) => {
    setSelectedInvite(invite);
    setModalType(type);
    setActiveActionMenu(null);
  };

  const closeModal = () => {
    setSelectedInvite(null);
    setModalType(null);
  };

  const toggleActionMenu = (e, id) => {
    e.stopPropagation();
    setActiveActionMenu(activeActionMenu === id ? null : id);
  };

  // Format display text
  const formatDisplay = (str) => {
    if (!str) return 'N/A';
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Responsive columns
  const [visibleColumns, setVisibleColumns] = useState(() => ({
    showUser: true,
    showDesignation: window.innerWidth >= 768,
    showEmployment: window.innerWidth >= 1024,
    showStatus: window.innerWidth >= 768,
    showExpires: window.innerWidth >= 1280,
  }));

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setVisibleColumns({
        showUser: true,
        showDesignation: window.innerWidth >= 768,
        showEmployment: window.innerWidth >= 1024,
        showStatus: window.innerWidth >= 768,
        showExpires: window.innerWidth >= 1280,
      }), 150);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, []);

  // View Modal Component
  const ViewModal = ({ invite, onClose }) => (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaEye /> Invitation Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-6 pb-6 border-b">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
              <FaUserCircle className="text-white text-5xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{invite.user?.name || 'No name'}</h3>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <FaEnvelope className="text-blue-500" size={14} />
                {invite.user?.email}
              </p>
              {invite.user?.phone && (
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <FaPhone className="text-green-500" size={14} />
                  {invite.user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <InfoItem icon={<FaBriefcase className="text-blue-500" />} label="Designation" value={formatDisplay(invite.designation)} />
            <InfoItem icon={<FaUserTie className="text-purple-500" />} label="Employment Type" value={formatDisplay(invite.employment_type)} />
            <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" value={formatDisplay(invite.salary_type)} />
            <InfoItem 
              icon={<FaTag className="text-orange-500" />} 
              label="Status" 
              value={
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invite.status, invite.expires_at).className}`}>
                  {getStatusBadge(invite.status, invite.expires_at).text}
                </span>
              } 
            />
            <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Sent Date" value={formatDate(invite.created_at)} />
            <InfoItem icon={<FaClock className="text-yellow-500" />} label="Expires At" value={formatDate(invite.expires_at)} />
          </div>

          {/* Permissions */}
          {invite.permissions?.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <FaInfoCircle className="text-blue-500" /> Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invite.permissions.map((perm, idx) => (
                  <motion.div
                    key={perm.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                  >
                    <span className="font-medium text-gray-700">{perm.name}</span>
                    {perm.is_allowed === 1 || perm.is_allowed === true
                      ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><FaCheckCircle size={10} /> Allowed</span>
                      : <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><FaBan size={10} /> Denied</span>
                    }
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  // Cancel Modal Component
  const CancelModal = ({ invite, onClose, onConfirm }) => (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaBan /> Cancel Invitation
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FaBan className="text-4xl text-red-600" />
          </motion.div>
          <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
          <p className="text-gray-500 mb-6">
            You are about to cancel the invitation for{' '}
            <span className="font-semibold text-red-600">{invite.user?.email}</span>.
            This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium"
            >
              Keep
            </button>
            <button
              onClick={() => onConfirm(invite.token)}
              disabled={processingId === invite.token}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {processingId === invite.token && <FaSpinner className="animate-spin" />}
              Cancel Invite
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (isInitialLoad && loading) {
    return <Skeleton />;
  }

  if (!company_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <FaExclamationCircle className="mx-auto text-red-500 text-5xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Company ID not found</h3>
            <p className="text-gray-500">Please ensure you're logged in as a company</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
        >
          <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Company Invitations
          </h1>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
            Total: {pagination.total} invitations
          </div>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by name, email or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <FaExclamationCircle className="text-red-600" />
                <span>Error: {error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && !invites.length && <Skeleton />}

        {/* Empty State */}
        {!loading && !error && invites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl shadow-xl"
          >
            <FaEnvelope className="text-8xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No invitations found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Your company hasn\'t sent any invitations yet'}
            </p>
          </motion.div>
        )}

        {/* Table View (Desktop) */}
        {!loading && !error && invites.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                    <tr>
                      {visibleColumns.showUser && <th className="px-6 py-4">User</th>}
                      {visibleColumns.showDesignation && <th className="px-6 py-4">Designation</th>}
                      {visibleColumns.showEmployment && <th className="px-6 py-4">Employment</th>}
                      {visibleColumns.showStatus && <th className="px-6 py-4">Status</th>}
                      {visibleColumns.showExpires && <th className="px-6 py-4">Expires</th>}
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invites.map((invite, index) => {
                      const status = getStatusBadge(invite.status, invite.expires_at);
                      const StatusIcon = status.icon;

                      return (
                        <motion.tr
                          key={invite.token}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                        >
                          {visibleColumns.showUser && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {invite.user?.name?.charAt(0)?.toUpperCase() || invite.user?.email?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{invite.user?.name || 'No name'}</p>
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <FaEnvelope className="text-gray-400" size={10} />
                                    {invite.user?.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showDesignation && (
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {formatDisplay(invite.designation)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.showEmployment && (
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                  {formatDisplay(invite.employment_type)}
                                </span>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                                  {formatDisplay(invite.salary_type)}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showStatus && (
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                                <StatusIcon size={12} />
                                {status.text}
                              </span>
                            </td>
                          )}
                          {visibleColumns.showExpires && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FaClock className="text-gray-400 text-xs" />
                                <span className="text-sm">{formatDateSimple(invite.expires_at)}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 text-right relative">
                            <button
                              onClick={(e) => toggleActionMenu(e, invite.token)}
                              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md"
                            >
                              <FaEllipsisV className="text-gray-600" />
                            </button>
                            <AnimatePresence>
                              {activeActionMenu === invite.token && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => openModal(invite, 'view')}
                                    className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all duration-300"
                                  >
                                    <FaEye size={14} /> View Details
                                  </button>
                                  {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                                    <>
                                      <button
                                        onClick={() => handleEditClick(invite)}
                                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all duration-300"
                                      >
                                        <FaEdit size={14} /> Edit Invite
                                      </button>
                                      <button
                                        onClick={() => openModal(invite, 'cancel')}
                                        className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300"
                                      >
                                        <FaBan size={14} /> Cancel Invite
                                      </button>
                                    </>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Card View (Mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {invites.map((invite, index) => {
                const status = getStatusBadge(invite.status, invite.expires_at);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={invite.token}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
                        <FaUserCircle className="text-white text-3xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800 truncate">{invite.user?.name || 'No name'}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                            <StatusIcon size={10} />
                            {status.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaEnvelope className="text-gray-400" size={10} />
                          {invite.user?.email}
                        </p>
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <FaBriefcase className="text-blue-500" />
                            {formatDisplay(invite.designation)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                              {formatDisplay(invite.employment_type)}
                            </span>
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                              {formatDisplay(invite.salary_type)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FaClock className="text-yellow-500" />
                              Expires: {formatDateSimple(invite.expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openModal(invite, 'view')}
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-110"
                      >
                        <FaEye size={16} />
                      </button>
                      {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                        <>
                          <button
                            onClick={() => handleEditClick(invite)}
                            className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => openModal(invite, 'cancel')}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-110"
                          >
                            <FaBan size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Use reusable Pagination component */}
            <Pagination
              currentPage={pagination.page}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              variant="default"
              showInfo={true}
            />
          </>
        )}

        {/* Modals */}
        <AnimatePresence>
          {modalType === 'view' && selectedInvite && (
            <ViewModal invite={selectedInvite} onClose={closeModal} />
          )}

          {modalType === 'cancel' && selectedInvite && (
            <CancelModal
              invite={selectedInvite}
              onClose={closeModal}
              onConfirm={handleCancelInvite}
            />
          )}
        </AnimatePresence>

        {/* Edit Staff Modal */}
        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingInvite(null);
          }}
          onSuccess={handleEditSuccess}
          staffData={editingInvite}
        />
      </div>
    </div>
  );
}

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
      {icon}{label}
    </label>
    <div className="text-gray-800 font-medium">{value}</div>
  </div>
);