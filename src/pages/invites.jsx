import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock, FaExclamationCircle, FaSpinner, FaEllipsisV, FaEye,
  FaCheckCircle, FaTimesCircle, FaEnvelope, FaPhone, FaCalendarAlt,
  FaSearch, FaBuilding, FaCheck, FaBan, FaUser, FaMapMarkerAlt,
  FaTimes, FaBriefcase, FaDollarSign, FaUserTag, FaInfoCircle
} from "react-icons/fa";
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Skeleton from "../components/SkeletonComponent";
import Pagination, { usePagination } from "../components/PaginationComponent";
import { useAuth } from "../context/AuthContext";
import ModalScrollLock from "../components/ModalScrollLock";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

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

const CONFIRM_MODAL_CLASS = 'bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col';

const isExpired = (date) => new Date(date) < new Date();

const getStatusBadge = (status, expiresAt) => {
  if (isExpired(expiresAt)) {
    return {
      icon: FaTimesCircle,
      text: 'Expired',
      className: 'bg-red-100 text-red-800 border border-red-200'
    };
  }

  switch (status?.toLowerCase()) {
    case 'accepted':
      return {
        icon: FaCheckCircle,
        text: 'Accepted',
        className: 'bg-green-100 text-green-800 border border-green-200'
      };
    case 'pending':
      return {
        icon: FaClock,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      };
    case 'rejected':
    case 'cancelled':
      return {
        icon: FaBan,
        text: formatDisplay(status),
        className: 'bg-gray-100 text-gray-800 border border-gray-200'
      };
    default:
      return {
        icon: FaExclamationCircle,
        text: status || 'Unknown',
        className: 'bg-gray-100 text-gray-800 border border-gray-200'
      };
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatDateSimple = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatDisplay = (str) => {
  if (!str) return 'N/A';
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// ─── Local Components ────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
      {icon}{label}
    </label>
    <div className="text-gray-800 font-medium">{value}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  const { pagination, updatePagination, goToPage } = usePagination(1, 10);
  const { refreshUser } = useAuth();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchInvites = useCallback(async (page = pagination.page, resetLoading = true) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const response = await apiCall(`/company/invites/my?${params.toString()}`, 'GET');
      if (!response.ok) throw new Error('Failed to fetch invites');

      const result = await response.json();
      if (result.success) {
        setInvites(result.data || []);
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
      toast.error(err.message || "Failed to load invitations.");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      fetchInProgress.current = false;
    }
  }, [pagination.limit, statusFilter, debouncedSearchTerm, updatePagination]);

  // Initial load
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchInvites(1, true);
      initialFetchDone.current = true;
    }
  }, [fetchInvites]);

  // Page change trigger
  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current && initialFetchDone.current) {
      fetchInvites(pagination.page, true);
    }
  }, [pagination.page]); // eslint-disable-line

  // Reset on filters
  useEffect(() => {
    if (!isInitialLoad) {
      if (pagination.page !== 1) goToPage(1);
      else fetchInvites(1, true);
    }
  }, [debouncedSearchTerm, statusFilter]); // eslint-disable-line

  const handleAcceptInvite = async (inviteToken) => {
    try {
      setProcessingId(inviteToken);
      const response = await apiCall('/company/invites/accept', 'POST', { token: inviteToken });
      if (!response.ok) throw new Error('Failed to accept invite');

      const result = await response.json();
      if (result.success) {
        toast.success("Invitation accepted successfully!");
        setInvites(prev => prev.map(invite =>
          invite.invite_token === inviteToken ? { ...invite, status: 'accepted' } : invite
        ));
        await refreshUser();
        closeModal();
        await fetchInvites(pagination.page, false);
      } else {
        throw new Error(result.message || 'Failed to accept invite');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvite = async (inviteToken) => {
    try {
      setProcessingId(inviteToken);
      const response = await apiCall('/company/invites/reject', 'PUT', { token: inviteToken });
      if (!response.ok) throw new Error('Failed to reject invite');

      const result = await response.json();
      if (result.success) {
        toast.success("Invitation rejected.");
        closeModal();
        await fetchInvites(pagination.page, false);
      } else {
        throw new Error(result.message || 'Failed to reject invite');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (invite, type) => { setSelectedInvite(invite); setModalType(type); setActiveActionMenu(null); };
  const closeModal = () => { setSelectedInvite(null); setModalType(null); };
  const toggleActionMenu = (e, id) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === id ? null : id); };

  const handlePageChange = useCallback((newPage) => { if (newPage !== pagination.page) goToPage(newPage); }, [pagination.page, goToPage]);

  // Responsive columns
  const [visibleColumns, setVisibleColumns] = useState(() => ({
    showCompany: true,
    showInvitedBy: window.innerWidth >= 768,
    showDesignation: window.innerWidth >= 1024,
    showEmployment: window.innerWidth >= 1280,
    showStatus: window.innerWidth >= 768,
    showExpires: window.innerWidth >= 1024,
  }));

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setVisibleColumns({
        showCompany: true,
        showInvitedBy: window.innerWidth >= 768,
        showDesignation: window.innerWidth >= 1024,
        showEmployment: window.innerWidth >= 1280,
        showStatus: window.innerWidth >= 768,
        showExpires: window.innerWidth >= 1024,
      }), 150);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, []);

  // ── Modals ───────────────────────────────────────────────────────────

  const ViewModal = ({ invite, onClose }) => (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2"><FaEye /> Invitation Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6 pb-6 border-b">
            {invite.company?.logo_url ? (
               <img src={invite.company.logo_url.startsWith('http') ? invite.company.logo_url : `https://api-attendance.onesaas.in${invite.company.logo_url}`} alt="Company Logo" className="w-16 h-16 rounded-2xl object-cover border border-purple-200 shadow-md bg-white shrink-0" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div className={`bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shrink-0 ${invite.company?.logo_url ? 'hidden' : 'flex'} items-center justify-center w-16 h-16`}>
              <FaBuilding className="text-white text-4xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{invite.company?.name || 'Company Name'}</h3>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <FaMapMarkerAlt className="text-purple-500" size={14} />
                {[invite.company?.city, invite.company?.state, invite.company?.country].filter(Boolean).join(', ') || 'Location not provided'}
              </p>
            </div>
          </div>
          {invite.invited_by && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <FaUser className="text-purple-500" /> Invited By
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {invite.invited_by.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{invite.invited_by.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1"><FaEnvelope size={12} /> {invite.invited_by.email}</p>
                  {invite.invited_by.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><FaPhone size={12} /> {invite.invited_by.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <InfoItem icon={<FaBriefcase className="text-blue-500" />} label="Designation" value={formatDisplay(invite.designation)} />
            <InfoItem icon={<FaUserTag className="text-purple-500" />} label="Employment Type" value={formatDisplay(invite.employment_type)} />
            <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type" value={formatDisplay(invite.salary_type)} />
            <InfoItem icon={<FaClock className="text-orange-500" />} label="Status"
              value={
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invite.status, invite.expires_at).className}`}>
                  {getStatusBadge(invite.status, invite.expires_at).text}
                </span>
              } />
            <InfoItem icon={<FaCalendarAlt className="text-rose-500" />} label="Sent Date" value={formatDate(invite.created_at)} />
            <InfoItem icon={<FaClock className="text-yellow-500" />} label="Expires At" value={formatDate(invite.expires_at)} />
          </div>
          {invite.permissions?.length > 0 && (
            <div className="mt-6">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <FaInfoCircle className="text-purple-500" /> Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invite.permissions.map((perm, idx) => (
                  <motion.div key={`perm-${perm.id}-${invite.invite_id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <span className="font-medium text-gray-700">{perm.name}</span>
                    {perm.is_allowed === 1 || perm.is_allowed === true
                      ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><FaCheck size={10} /> Allowed</span>
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

  const AcceptModal = ({ invite, onClose, onConfirm }) => (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className={CONFIRM_MODAL_CLASS}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2"><FaCheckCircle /> Accept Invitation</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
        </div>
        <div className="flex flex-1 flex-col justify-center p-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-4xl text-green-600" />
          </motion.div>
          <p className="text-xl text-gray-700 mb-2 font-semibold">Accept Invitation?</p>
          <p className="text-gray-500 mb-6">
            You are about to accept the invitation from <span className="font-semibold text-green-600">{invite.company?.name}</span>.
            This will add you to their organization.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <button onClick={onClose} className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">Cancel</button>
            <button onClick={() => onConfirm(invite.invite_token)} disabled={processingId === invite.invite_token}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
              {processingId === invite.invite_token && <FaSpinner className="animate-spin" />} Accept
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const RejectModal = ({ invite, onClose, onConfirm }) => (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className={CONFIRM_MODAL_CLASS}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
          <h2 className="text-xl font-semibold flex items-center gap-2"><FaBan /> Reject Invitation</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={20} /></button>
        </div>
        <div className="flex flex-1 flex-col justify-center p-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBan className="text-4xl text-red-600" />
          </motion.div>
          <p className="text-xl text-gray-700 mb-2 font-semibold">Reject Invitation?</p>
          <p className="text-gray-500 mb-6">Are you sure you want to reject the invitation from <span className="font-semibold text-red-600">{invite.company?.name}</span>? This action cannot be undone.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <button onClick={onClose} className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">Cancel</button>
            <button onClick={() => onConfirm(invite.invite_token)} disabled={processingId === invite.invite_token}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
              {processingId === invite.invite_token && <FaSpinner className="animate-spin" />} Reject
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (isInitialLoad && loading) return <Skeleton />;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Incoming Invitations</h1>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">Total: {pagination.total} invitations</div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input type="text" placeholder="Search by company name, designation, or inviter..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none shadow-lg transition-all" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FaTimes /></button>}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && !invites.length && <Skeleton />}

        {/* Empty State */}
        {!loading && !error && invites.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white rounded-2xl shadow-xl">
            <FaEnvelope className="text-8xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No invitations found</p>
            <p className="text-gray-400 mt-2">{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'You haven\'t received any invitations yet'}</p>
          </motion.div>
        )}

        {/* Table View (Desktop) */}
        {!loading && !error && invites.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                    <tr>
                      {visibleColumns.showCompany && <th className="px-6 py-4">Company</th>}
                      {visibleColumns.showInvitedBy && <th className="px-6 py-4">Invited By</th>}
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
                        <motion.tr key={`invite-${invite.invite_id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300">
                          {visibleColumns.showCompany && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {invite.company?.logo_url ? (
                                  <img src={invite.company.logo_url.startsWith('http') ? invite.company.logo_url : `https://api-attendance.onesaas.in${invite.company.logo_url}`} alt="logo" className="w-10 h-10 rounded-full object-cover border border-purple-200 bg-white min-w-10 min-h-10 shrink-0" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-white shrink-0 ${invite.company?.logo_url ? 'hidden' : 'flex'}`}><FaBuilding size={16} /></div>
                                <div>
                                  <p className="font-semibold text-gray-800">{invite.company?.name || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{[invite.company?.city, invite.company?.state].filter(Boolean).join(', ')}</p>
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showInvitedBy && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center"><FaUser className="text-purple-600" size={12} /></div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{invite.invited_by?.name}</p>
                                  <p className="text-xs text-gray-500">{invite.invited_by?.email}</p>
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showDesignation && (
                            <td className="px-6 py-4"><span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">{formatDisplay(invite.designation)}</span></td>
                          )}
                          {visibleColumns.showEmployment && (
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{formatDisplay(invite.employment_type)}</span>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">{formatDisplay(invite.salary_type)}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showStatus && (
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}><StatusIcon size={12} /> {status.text}</span>
                            </td>
                          )}
                          {visibleColumns.showExpires && (
                            <td className="px-6 py-4"><div className="flex items-center gap-2"><FaClock className="text-gray-400 text-xs" /><span className="text-sm">{formatDateSimple(invite.expires_at)}</span></div></td>
                          )}
                          <td className="px-6 py-4 text-right relative">
                            <button onClick={(e) => toggleActionMenu(e, invite.invite_id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md"><FaEllipsisV className="text-gray-600" /></button>
                            <AnimatePresence>
                              {activeActionMenu === invite.invite_id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => openModal(invite, 'view')} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 text-purple-600 flex items-center gap-3 transition-all duration-300"><FaEye size={14} /> View Details</button>
                                  {invite.status?.toLowerCase() === 'pending' && !isExpired(invite.expires_at) && (
                                    <>
                                      <button onClick={() => openModal(invite, 'accept')} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all duration-300"><FaCheck size={14} /> Accept Invite</button>
                                      <button onClick={() => openModal(invite, 'reject')} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300"><FaBan size={14} /> Reject Invite</button>
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
                  <motion.div key={`card-${invite.invite_id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      {invite.company?.logo_url ? (
                        <img src={invite.company.logo_url.startsWith('http') ? invite.company.logo_url : `https://api-attendance.onesaas.in${invite.company.logo_url}`} alt="logo" className="w-12 h-12 rounded-2xl object-cover border border-purple-200 bg-white shrink-0" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div className={`bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl w-12 h-12 items-center justify-center shrink-0 ${invite.company?.logo_url ? 'hidden' : 'flex'}`}><FaBuilding className="text-white text-2xl" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800 truncate">{invite.company?.name || 'N/A'}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}><StatusIcon size={10} /> {status.text}</span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FaMapMarkerAlt className="text-gray-400" size={10} /> {[invite.company?.city, invite.company?.state].filter(Boolean).join(', ') || 'Location not provided'}</p>
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2"><FaUser className="text-purple-500" /> Invited by: {invite.invited_by?.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-2"><FaBriefcase className="text-blue-500" /> {formatDisplay(invite.designation)}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{formatDisplay(invite.employment_type)}</span>
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{formatDisplay(invite.salary_type)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100"><span className="text-xs text-gray-500 flex items-center gap-1"><FaClock className="text-yellow-500" /> Expires: {formatDateSimple(invite.expires_at)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => openModal(invite, 'view')} className="p-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all duration-300 hover:scale-110"><FaEye size={16} /></button>
                      {invite.status?.toLowerCase() === 'pending' && !isExpired(invite.expires_at) && (
                        <>
                          <button onClick={() => openModal(invite, 'accept')} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110"><FaCheck size={16} /></button>
                          <button onClick={() => openModal(invite, 'reject')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-110"><FaBan size={16} /></button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

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
          {modalType === 'view' && selectedInvite && <ViewModal invite={selectedInvite} onClose={closeModal} />}
          {modalType === 'accept' && selectedInvite && <AcceptModal invite={selectedInvite} onClose={closeModal} onConfirm={handleAcceptInvite} />}
          {modalType === 'reject' && selectedInvite && <RejectModal invite={selectedInvite} onClose={closeModal} onConfirm={handleRejectInvite} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
