import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserTie, FaClock, FaExclamationCircle, FaSpinner,
  FaEye, FaEdit, FaBan, FaCheckCircle, FaTimesCircle, FaEnvelope,
  FaPhone, FaCalendarAlt, FaBriefcase, FaDollarSign, FaTag,
  FaSearch, FaTimes, FaShieldAlt, FaUserCircle, FaTh, FaListUl,FaChevronDown,FaUserCheck, FaCog
} from "react-icons/fa";
import { toast } from 'react-toastify';
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";
import EditStaffModal from "../components/StaffModals/EditStaffModal";
import CreateInviteModal from "../components/StaffModals/AddStaffModal";
import Skeleton from "../components/SkeletonComponent";
import ModalScrollLock from "../components/ModalScrollLock";
import ActionMenu from "../components/ActionMenu";
import ManagementGrid from '../components/ManagementGrid';
import ManagementViewSwitcher from '../components/ManagementViewSwitcher';
import usePermissionAccess from "../hooks/usePermissionAccess";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.9,  y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: "spring", duration: 0.5 } },
  exit:    { opacity: 0, scale: 0.9,  y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 }
};

const CONFIRM_MODAL_CLASS = "bg-white rounded-[10px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col";

const isExpired = (date) => new Date(date) < new Date();

const getStatusBadge = (status, expiresAt) => {
  if (isExpired(expiresAt))
    return { icon: FaTimesCircle, text: "Expired", className: "bg-red-100 text-red-800 border border-red-200" };
  switch (status) {
    case "accepted":
      return { icon: FaCheckCircle, text: "Accepted", className: "bg-green-100 text-green-800 border border-green-200" };
    case "pending":
      return { icon: FaClock, text: "Pending", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" };
    case "cancelled":
      return { icon: FaBan, text: "Cancelled", className: "bg-gray-100 text-gray-800 border border-gray-200" };
    default:
      return { icon: FaExclamationCircle, text: status, className: "bg-gray-100 text-gray-800 border border-gray-200" };
  }
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const formatDateSimple = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
};

const formatDisplay = (str) => str ? str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "N/A";

// ─── Local Components ────────────────────────────────────────────────────────

const InfoItem = ({ icon, label, value }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-[10px] border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
      {icon}{label}
    </label>
    <div className="text-gray-800 font-medium">{value}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyInvites() {
  const { checkActionAccess, getAccessMessage } = usePermissionAccess();
  const [invites, setInvites]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [processingId, setProcessingId]     = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [modalType, setModalType]           = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm]         = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewMode, setViewMode]             = useState("table");
  const [isEditModalOpen, setIsEditModalOpen]   = useState(false);
  const [editingInvite, setEditingInvite]       = useState(null);
  const [isInitialLoad, setIsInitialLoad]       = useState(true);
  const [openCreateInviteModal, setOpenCreateInviteModal] = useState(false);
  const fetchInProgress = useRef(false);

  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const createInviteAccess = checkActionAccess("companyInvites", "create");
  const updateInviteAccess = checkActionAccess("companyInvites", "update");
  const cancelInviteAccess = checkActionAccess("companyInvites", "cancel");

  const company_id = JSON.parse(localStorage.getItem("company"))?.id;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInvites = useCallback(
    async (page = pagination.page, search = debouncedSearchTerm, resetLoading = true) => {
      if (fetchInProgress.current) return;
      fetchInProgress.current = true;
      if (resetLoading) setLoading(true);

      try {
        const company = JSON.parse(localStorage.getItem("company"));
        const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
        if (search) params.append("search", search);
        const response = await apiCall(`/company/invites/list?${params.toString()}`, 'GET', null, company?.id);
        if (!response.ok) throw new Error("Failed to fetch invites");

        const result = await response.json();
        if (result.success) {
          setInvites(result.data || []);
          const currentPage = Number(result.current_page ?? result.page ?? result.meta?.page ?? page);
          const perPage = Number(result.per_page ?? result.limit ?? result.meta?.limit ?? pagination.limit);
          const total = Number(result.total ?? result.meta?.total ?? result.data?.length ?? 0);
          const totalPages = Number(
            result.last_page ??
            result.total_pages ??
            result.meta?.total_pages ??
            Math.max(1, Math.ceil(total / perPage))
          );
          updatePagination({
            page: currentPage,
            limit: perPage,
            total,
            total_pages: totalPages,
            is_last_page: result.is_last_page ?? result.meta?.is_last_page ?? (currentPage >= totalPages)
          });
        } else {
          throw new Error(result.message || "Failed to fetch invites");
        }
      } catch (err) {
        toast.error(err.message || "Failed to load invitations.");
        console.error("Error fetching invites:", err);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
        fetchInProgress.current = false;
      }
    },
    [company_id, pagination.limit, updatePagination, debouncedSearchTerm]
  );

  // Page change trigger
  const handlePageChange = useCallback(
    (newPage) => { if (newPage !== pagination.page) goToPage(newPage); },
    [pagination.page, goToPage]
  );

  useEffect(() => {
    if (!isInitialLoad && !fetchInProgress.current) {
      fetchInvites(pagination.page, debouncedSearchTerm, true);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm]); // eslint-disable-line

  useEffect(() => {
    if (!isInitialLoad) {
      if (pagination.page !== 1) goToPage(1);
      else fetchInvites(1, debouncedSearchTerm, true);
    }
  }, [debouncedSearchTerm]); // eslint-disable-line

  useEffect(() => {
    if (company_id && isInitialLoad) {
      fetchInvites(1, "", true);
    } else if (!company_id) {
      toast.error("Company ID not found. Please ensure you're logged in as a company.");
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [company_id]); // eslint-disable-line

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancelInvite = async (inviteId) => {
    try {
      setProcessingId(inviteId);
      const company   = JSON.parse(localStorage.getItem("company"));
      const response = await apiCall('/company/invites/cancel', 'DELETE', { token: inviteId }, company?.id);
      if (!response.ok) throw new Error("Failed to cancel invite");

      const result = await response.json();
      if (result.success) {
        toast.success("Invitation cancelled successfully.");
        await fetchInvites(pagination.page, debouncedSearchTerm, false);
        closeModal();
      } else {
        throw new Error(result.message || "Failed to cancel invite");
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong while cancelling.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEditClick = (invite) => {
    if (updateInviteAccess.disabled) return;
    setEditingInvite(invite);
    setIsEditModalOpen(true);
    setActiveActionMenu(null);
  };

  const handleEditSuccess = () => {
    toast.success("Invitation updated successfully.");
    fetchInvites(pagination.page, debouncedSearchTerm, false);
    setIsEditModalOpen(false);
    setEditingInvite(null);
  };

  const openModal       = (invite, type) => { setSelectedInvite(invite); setModalType(type); setActiveActionMenu(null); };
  const closeModal      = ()              => { setSelectedInvite(null);   setModalType(null); };

  // ─── Responsive Columns ──────────────────────────────────────────────────
  const getEffectiveWidth = () => {
    const width = window.innerWidth;
    const offset = width >= 1024 ? 280 : (width >= 768 ? 80 : 0);
    return width - offset;
  };

  const getVisibleColumns = useCallback((width) => ({
    showUser:        true,
    showEmailInside: width >= 800,
    showDesignation: width >= 600,
    showEmployment:  width >= 1000,
    showStatus:      width >= 500,
    showExpires:     width >= 1200
  }), []);

  const [visibleColumns, setVisibleColumns] = useState(() => getVisibleColumns(getEffectiveWidth()));

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        setVisibleColumns(getVisibleColumns(getEffectiveWidth()));
      }, 150);
    };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, [getVisibleColumns]);

  // ── View Modal ─────────────────────────────────────────────────────────────
  const ViewModal = ({ invite, onClose }) => {
    const [showPermissions, setShowPermissions] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);
    
    return (
      <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <ModalScrollLock />
        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          className="bg-white rounded-[10px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-[10px]">
            <h2 className="text-xl font-semibold flex items-center gap-2"><FaEye /> Invitation Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-[10px] transition-all duration-300"><FaTimes size={20} /></button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-6 pb-6 border-b">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-[10px]">
                <FaUserCircle className="text-white text-5xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{invite.user?.name || "No name"}</h3>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <FaEnvelope className="text-blue-500" size={14} />{invite.user?.email}
                </p>
                {invite.user?.phone && (
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <FaPhone className="text-green-500" size={14} />{invite.user.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <InfoItem icon={<FaBriefcase className="text-blue-500" />}   label="Designation"      value={formatDisplay(invite.designation)} />
              <InfoItem icon={<FaUserTie   className="text-purple-500" />} label="Employment Type"  value={formatDisplay(invite.employment_type)} />
              <InfoItem icon={<FaDollarSign className="text-emerald-500" />} label="Salary Type"    value={formatDisplay(invite.salary_type)} />
              <InfoItem icon={<FaTag       className="text-orange-500" />} label="Status"
                value={
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invite.status, invite.expires_at).className}`}>
                    {getStatusBadge(invite.status, invite.expires_at).text}
                  </span>
                } />
              <InfoItem icon={<FaCalendarAlt className="text-rose-500" />}  label="Sent Date"  value={formatDate(invite.created_at)} />
              <InfoItem icon={<FaClock      className="text-yellow-500" />} label="Expires At" value={formatDate(invite.expires_at)} />
            </div>

            {invite.permissions?.length > 0 && (
              <div className="mt-6 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-blue-500" /> 
                    <span className="text-sm font-semibold text-gray-700">Permissions</span>
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      {invite.permissions.length}
                    </span>
                  </div>
                  <motion.div animate={{ rotate: showPermissions ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FaChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {showPermissions && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                        {invite.permissions.map((perm, idx) => (
                          <motion.div key={perm.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[10px] border border-blue-100">
                            <span className="font-medium text-gray-700">{perm.name}</span>
                            
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {invite.attendance_methods?.length > 0 && (
              <div className="mt-4 border border-gray-200 rounded-[10px] overflow-hidden shadow-sm">
                <button 
                  onClick={() => setShowAttendance(!showAttendance)}
                  className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <FaUserCheck className="text-purple-500" /> 
                    <span className="text-sm font-semibold text-gray-700">Attendance Methods</span>
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">
                      {invite.attendance_methods.length}
                    </span>
                  </div>
                  <motion.div animate={{ rotate: showAttendance ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FaChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {showAttendance && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-3">
                        {invite.attendance_methods.map((method, idx) => (
                          <motion.div key={`method-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-[10px] border border-purple-100">
                            <span className="font-medium text-gray-700 capitalize">{method.method}</span>
                            {method.is_auto && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Auto</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // ── Cancel Modal ───────────────────────────────────────────────────────────
  const CancelModal = ({ invite, onClose, onConfirm }) => (
    <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <ModalScrollLock />
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className={CONFIRM_MODAL_CLASS}
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-[10px]">
          <h2 className="text-xl font-semibold flex items-center gap-2"><FaBan /> Cancel Invitation</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-[10px] transition-all duration-300"><FaTimes size={20} /></button>
        </div>
        <div className="flex flex-1 flex-col justify-center p-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBan className="text-4xl text-red-600" />
          </motion.div>
          <p className="text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
          <p className="text-gray-500 mb-6">
            You are about to cancel the invitation for{" "}
            <span className="font-semibold text-red-600">{invite.user?.email}</span>.
            This action cannot be undone.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
            <button onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-[10px] text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium">
              Keep
            </button>
            <button onClick={() => onConfirm(invite.token)} disabled={processingId === invite.token || cancelInviteAccess.disabled} title={cancelInviteAccess.disabled ? getAccessMessage(cancelInviteAccess) : ""}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-[10px] hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
              {processingId === invite.token && <FaSpinner className="animate-spin" />}
              Cancel Invite
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ── Early returns ──────────────────────────────────────────────────────────
  if (isInitialLoad && loading) return <Skeleton />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[10px] border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                <FaEnvelope size={11} />
                Invite management
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Company Invitations
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Manage and track invitations sent to prospective employees and staff members.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-end">
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
                <FaUserCheck className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-700">{invites.length}</span>
                <span className="text-gray-500">invites</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !createInviteAccess.disabled && setOpenCreateInviteModal(true)}
                disabled={createInviteAccess.disabled}
                title={createInviteAccess.disabled ? getAccessMessage(createInviteAccess) : ""}
                className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaEnvelope size={14} />
                <span className="text-sm">Create Invite</span>
              </motion.button>
            </div>
          </div>

          <CreateInviteModal
            isOpen={openCreateInviteModal}
            onClose={() => setOpenCreateInviteModal(false)}
            onSuccess={() => {
              setOpenCreateInviteModal(false);
              fetchInvites(pagination.page, debouncedSearchTerm, false);
            }}
            submitDisabled={createInviteAccess.disabled}
            submitTitle={createInviteAccess.disabled ? getAccessMessage(createInviteAccess) : ""}
          />
        </motion.div>

        {/* ─── Consolidated Filter & View Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-gray-100 shadow-sm mb-6"
        >
          {/* Left Section: Search, Result Info & View Mode */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search by name, email or designation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
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

            {!loading && invites.length > 0 && (
              <p className="text-sm text-gray-500 hidden xl:block border-l pl-4 border-gray-200">
                <span className="font-semibold text-gray-800">{invites.length}</span> of <span className="font-semibold text-gray-800">{pagination.total}</span> invitations
              </p>
            )}
            

            <div className="hidden lg:block h-8 w-px bg-gray-200 mx-1"></div>

            <ManagementViewSwitcher
              viewMode={viewMode}
              onChange={setViewMode}
              accent="blue"
            />
          </div>
        </motion.div>

        {/* Loading skeleton */}
        {loading && !invites.length && <Skeleton />}

        {/* Empty State */}
        {!loading && invites.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-[10px] shadow-xl">
            <FaEnvelope className="text-8xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No invitations found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm ? "Try adjusting your search" : "Your company hasn't sent any invitations yet"}
            </p>
          </motion.div>
        )}

        {!loading && invites.length > 0 && (
          <>
            {viewMode === "table" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-[10px] shadow-xl overflow-hidden">
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="w-full text-sm text-left text-gray-700">
                  <thead className="xsm:hidden bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                    <tr>
                      {visibleColumns.showUser        && <th className="px-6 py-4">User</th>}
                      {visibleColumns.showDesignation && <th className="px-6 py-4">Designation</th>}
                      {visibleColumns.showEmployment  && <th className="px-6 py-4">Employment</th>}
                      {visibleColumns.showStatus      && <th className="px-6 py-4">Status</th>}
                      {visibleColumns.showExpires     && <th className="px-6 py-4">Expires</th>}
                      <th className="px-6 py-4 text-right"><FaCog className="w-4 h-4 ml-auto" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invites.map((invite, index) => {
                      const status     = getStatusBadge(invite.status, invite.expires_at);
                      const StatusIcon = status.icon;
                      return (
                      <motion.tr key={invite.token} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => openModal(invite, "view")}
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                          {visibleColumns.showUser && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {invite.user?.name?.charAt(0)?.toUpperCase() || invite.user?.email?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[180px]">{invite.user?.name || "No name"}</p>
                                  {visibleColumns.showEmailInside && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaEnvelope className="text-gray-400" size={10} />
                                      <span className="truncate max-w-[150px]">{invite.user?.email}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showDesignation && (
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium truncate max-w-[120px] inline-block">
                                {formatDisplay(invite.designation)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.showEmployment && (
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">{formatDisplay(invite.employment_type)}</span>
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">{formatDisplay(invite.salary_type)}</span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.showStatus && (
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                                <StatusIcon size={12} />{status.text}
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
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                              menuId={invite.token}
                              activeId={activeActionMenu}
                              onToggle={(e, id) => {
                                setActiveActionMenu((current) => (current === id ? null : id));
                              }}
                              actions={[
                                {
                                  label: 'View Details',
                                  icon: <FaEye size={14} />,
                                  onClick: () => openModal(invite, "view"),
                                  className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                },
                                ...(invite.status === "pending" && !isExpired(invite.expires_at) ? [
                                  {
                                    label: 'Edit Invite',
                                    icon: <FaEdit size={14} />,
                                    onClick: () => handleEditClick(invite),
                                    disabled: updateInviteAccess.disabled,
                                    title: updateInviteAccess.disabled ? getAccessMessage(updateInviteAccess) : "",
                                    className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  },
                                  {
                                    label: 'Cancel Invite',
                                    icon: <FaBan size={14} />,
                                    onClick: () => !cancelInviteAccess.disabled && openModal(invite, "cancel"),
                                    disabled: cancelInviteAccess.disabled,
                                    title: cancelInviteAccess.disabled ? getAccessMessage(cancelInviteAccess) : "",
                                    className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                  }
                                ] : [])
                              ]}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </motion.div>
            )}

            {viewMode === "card" && (
              <ManagementGrid viewMode={viewMode}>
              {invites.map((invite, index) => {
                const status     = getStatusBadge(invite.status, invite.expires_at);
                const StatusIcon = status.icon;
                return (
                  <motion.div key={invite.token} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openModal(invite, "view")}
                    className="bg-white rounded-[10px] shadow-md border border-gray-100 p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-[10px]">
                        <FaUserCircle className="text-white text-3xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-gray-800 truncate">{invite.user?.name || "No name"}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                            <StatusIcon size={10} />{status.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaEnvelope className="text-gray-400" size={10} />{invite.user?.email}
                        </p>
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <FaBriefcase className="text-blue-500" />{formatDisplay(invite.designation)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">{formatDisplay(invite.employment_type)}</span>
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{formatDisplay(invite.salary_type)}</span>
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
                    <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openModal(invite, "view")}
                        className="p-3 bg-blue-50 text-blue-600 rounded-[10px] hover:bg-blue-100 transition-all duration-300 hover:scale-110">
                        <FaEye size={16} />
                      </button>
                      {invite.status === "pending" && !isExpired(invite.expires_at) && (
                        <>
                          <button type="button" onClick={() => handleEditClick(invite)} disabled={updateInviteAccess.disabled} title={updateInviteAccess.disabled ? getAccessMessage(updateInviteAccess) : ""}
                            className="p-3 bg-green-50 text-green-600 rounded-[10px] hover:bg-green-100 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                            <FaEdit size={16} />
                          </button>
                          <button type="button" onClick={() => !cancelInviteAccess.disabled && openModal(invite, "cancel")} disabled={cancelInviteAccess.disabled} title={cancelInviteAccess.disabled ? getAccessMessage(cancelInviteAccess) : ""}
                            className="p-3 bg-red-50 text-red-600 rounded-[10px] hover:bg-red-100 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
                            <FaBan size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </ManagementGrid>
            )}

            {!loading && (invites.length > 0 || pagination.total > 0) && (
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total || invites.length}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
                showInfo={true}
                onLimitChange={changeLimit}
              />
            )}
          </>
        )}

        {/* Modals */}
        <AnimatePresence>
          {modalType === "view" && selectedInvite && <ViewModal invite={selectedInvite} onClose={closeModal} />}
          {modalType === "cancel" && selectedInvite && <CancelModal invite={selectedInvite} onClose={closeModal} onConfirm={handleCancelInvite} />}
        </AnimatePresence>

        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingInvite(null); }}
          onSuccess={handleEditSuccess}
          staffData={editingInvite}
          submitDisabled={updateInviteAccess.disabled}
          submitTitle={updateInviteAccess.disabled ? getAccessMessage(updateInviteAccess) : ""}
        />
      </div>
    </div>
  );
}
