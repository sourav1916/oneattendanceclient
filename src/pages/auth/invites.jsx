import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUserTie,
    FaClock,
    FaExclamationCircle,
    FaSpinner,
    FaEllipsisV,
    FaEye,
    FaCheckCircle,
    FaTimesCircle,
    FaEnvelope,
    FaPhone,
    FaCalendarAlt,
    FaBriefcase,
    FaDollarSign,
    FaTag,
    FaSearch,
    FaBuilding,
    FaCheck,
    FaBan
} from "react-icons/fa";
import { MdWork } from "react-icons/md";

export default function MyInvites() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [actionMenuId, setActionMenuId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const API_BASE = "https://api-attendance.onesaas.in";

    const fetchInvites = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/company/invites/user/list`, {
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
                setInvites(result.data);
                setError(null);
            } else {
                throw new Error(result.message || 'Failed to fetch invites');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching invites:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleAcceptInvite = async (token) => {
        try {
            setProcessingId(token);
            const authToken = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/user/invites/${token}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to accept invite');
            }

            const result = await response.json();

            if (result.success) {
                // Update local state
                setInvites(prev => prev.map(invite =>
                    invite.token === token ? { ...invite, status: 'accepted' } : invite
                ));
                closeModal();
            } else {
                throw new Error(result.message || 'Failed to accept invite');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectInvite = async (token) => {
        try {
            setProcessingId(token);
            const authToken = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/user/invites/${token}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject invite');
            }

            const result = await response.json();

            if (result.success) {
                // Update local state
                setInvites(prev => prev.map(invite =>
                    invite.token === token ? { ...invite, status: 'rejected' } : invite
                ));
                closeModal();
            } else {
                throw new Error(result.message || 'Failed to reject invite');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const isExpired = (date) => new Date(date) < new Date();

    const getStatusBadge = (status, expiresAt) => {
        if (isExpired(expiresAt)) {
            return {
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: FaTimesCircle,
                text: 'Expired'
            };
        }

        switch (status) {
            case 'accepted':
                return {
                    color: 'bg-green-100 text-green-700 border-green-200',
                    icon: FaCheckCircle,
                    text: 'Accepted'
                };
            case 'pending':
                return {
                    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    icon: FaClock,
                    text: 'Pending'
                };
            case 'rejected':
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: FaBan,
                    text: 'Rejected'
                };
            case 'cancelled':
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: FaBan,
                    text: 'Cancelled'
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                    icon: FaExclamationCircle,
                    text: status
                };
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredInvites = invites.filter(invite => {
        const matchesSearch =
            invite.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invite.designation?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || invite.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const openModal = (invite, type) => {
        setSelectedInvite(invite);
        setModalType(type);
        setActionMenuId(null);
    };

    const closeModal = () => {
        setSelectedInvite(null);
        setModalType(null);
    };

    // Modal Components
    const ViewModal = ({ invite, onClose }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Invitation Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FaTimesCircle className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Company Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
                            <FaBuilding size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{invite.company?.name || 'Company Name'}</h3>
                            <p className="text-gray-500 flex items-center gap-2 mt-1">
                                <FaEnvelope className="text-gray-400" size={14} />
                                {invite.company?.email || 'No email provided'}
                            </p>
                            {invite.company?.phone && (
                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                    <FaPhone className="text-gray-400" size={14} />
                                    {invite.company.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Designation</p>
                            <p className="font-medium text-gray-800">{invite.designation?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Employment Type</p>
                            <p className="font-medium text-gray-800">{invite.employment_type?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Salary Type</p>
                            <p className="font-medium text-gray-800">{invite.salary_type}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(invite.status, invite.expires_at).color
                                }`}>
                                {getStatusBadge(invite.status, invite.expires_at).text}
                            </span>
                        </div>
                    </div>

                    {/* Permissions */}
                    {invite.permissions?.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                            <div className="flex flex-wrap gap-2">
                                {invite.permissions.map(perm => (
                                    <span
                                        key={perm.id}
                                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-100"
                                    >
                                        {perm.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaCalendarAlt size={14} />
                            <span>Sent: {formatDate(invite.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaClock size={14} />
                            <span>Expires: {formatDate(invite.expires_at)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    const AcceptModal = ({ invite, onClose, onConfirm }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <FaCheckCircle className="text-green-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                        Accept Invitation
                    </h3>
                    <p className="text-gray-500 text-center mb-6">
                        Are you sure you want to accept the invitation from <span className="font-medium text-gray-700">{invite.company?.name}</span>? This will add you to their organization.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(invite.token)}
                            disabled={processingId === invite.token}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center justify-center gap-2"
                        >
                            {processingId === invite.token && <FaSpinner className="animate-spin" />}
                            Accept
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    const RejectModal = ({ invite, onClose, onConfirm }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <FaBan className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                        Reject Invitation
                    </h3>
                    <p className="text-gray-500 text-center mb-6">
                        Are you sure you want to reject the invitation from <span className="font-medium text-gray-700">{invite.company?.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(invite.token)}
                            disabled={processingId === invite.token}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center justify-center gap-2"
                        >
                            {processingId === invite.token && <FaSpinner className="animate-spin" />}
                            Reject
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
                        Incoming Invitations
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base">
                        Manage invitations from companies
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by company name or designation..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <FaSpinner className="animate-spin text-purple-500 text-4xl mx-auto mb-4" />
                        <p className="text-gray-500">Loading invitations...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Invites</h3>
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                        <button
                            onClick={fetchInvites}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/25"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Table View (Desktop) */}
                {!loading && !error && filteredInvites.length > 0 && (
                    <>
                        <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredInvites.map((invite) => {
                                            const status = getStatusBadge(invite.status, invite.expires_at);
                                            const StatusIcon = status.icon;

                                            return (
                                                <tr key={invite.token} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                                                <FaBuilding size={12} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">{invite.company?.name}</p>
                                                                <p className="text-xs text-gray-500">{invite.company?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {invite.designation?.replace(/_/g, ' ')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                            {invite.employment_type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                            {invite.salary_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                            <StatusIcon size={12} />
                                                            {status.text}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <FaClock size={12} className="text-gray-400" />
                                                            {formatDate(invite.expires_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                            {invite.permissions?.slice(0, 2).map(perm => (
                                                                <span key={perm.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                    {perm.name.substring(0, 15)}...
                                                                </span>
                                                            ))}
                                                            {invite.permissions?.length > 2 && (
                                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                    +{invite.permissions.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 relative">
                                                        <button
                                                            onClick={() => setActionMenuId(actionMenuId === invite.token ? null : invite.token)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <FaEllipsisV className="text-gray-500" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {actionMenuId === invite.token && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10"
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => openModal(invite, 'view')}
                                                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                        >
                                                                            <FaEye size={14} className="text-gray-400" />
                                                                            View Details
                                                                        </button>
                                                                        {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => openModal(invite, 'accept')}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                                                >
                                                                                    <FaCheck size={14} />
                                                                                    Accept Invite
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => openModal(invite, 'reject')}
                                                                                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                                >
                                                                                    <FaBan size={14} />
                                                                                    Reject Invite
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Card View (Mobile/Tablet) */}
                        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredInvites.map((invite) => {
                                const status = getStatusBadge(invite.status, invite.expires_at);
                                const StatusIcon = status.icon;

                                return (
                                    <motion.div
                                        key={invite.token}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    <FaBuilding size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{invite.company?.name}</p>
                                                    <p className="text-sm text-gray-500">{invite.company?.email}</p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActionMenuId(actionMenuId === invite.token ? null : invite.token)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <FaEllipsisV className="text-gray-500" />
                                                </button>

                                                <AnimatePresence>
                                                    {actionMenuId === invite.token && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10"
                                                        >
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => openModal(invite, 'view')}
                                                                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <FaEye size={14} className="text-gray-400" />
                                                                    View Details
                                                                </button>
                                                                {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openModal(invite, 'accept')}
                                                                            className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                                        >
                                                                            <FaCheck size={14} />
                                                                            Accept Invite
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openModal(invite, 'reject')}
                                                                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                                        >
                                                                            <FaBan size={14} />
                                                                            Reject Invite
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Designation</span>
                                                <span className="font-medium text-gray-800">{invite.designation?.replace(/_/g, ' ')}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Employment</span>
                                                <div className="flex gap-1">
                                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                        {invite.employment_type?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                        {invite.salary_type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Status</span>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">Expires</span>
                                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                                    <FaClock size={12} className="text-gray-400" />
                                                    {formatDate(invite.expires_at)}
                                                </span>
                                            </div>

                                            {invite.permissions?.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-2">Permissions</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {invite.permissions.slice(0, 3).map(perm => (
                                                            <span key={perm.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                {perm.name}
                                                            </span>
                                                        ))}
                                                        {invite.permissions.length > 3 && (
                                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                                +{invite.permissions.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Action Buttons for Pending Invites */}
                                        {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => openModal(invite, 'accept')}
                                                    disabled={processingId === invite.token}
                                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center justify-center gap-1"
                                                >
                                                    {processingId === invite.token ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => openModal(invite, 'reject')}
                                                    disabled={processingId === invite.token}
                                                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center justify-center gap-1"
                                                >
                                                    {processingId === invite.token ? <FaSpinner className="animate-spin" size={12} /> : <FaBan size={12} />}
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Empty State */}
                {!loading && !error && filteredInvites.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <FaEnvelope className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No invitations found</h3>
                        <p className="text-gray-500">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'You haven\'t received any invitations yet'}
                        </p>
                    </div>
                )}

                {/* Modals */}
                <AnimatePresence>
                    {modalType === 'view' && selectedInvite && (
                        <ViewModal invite={selectedInvite} onClose={closeModal} />
                    )}

                    {modalType === 'accept' && selectedInvite && (
                        <AcceptModal
                            invite={selectedInvite}
                            onClose={closeModal}
                            onConfirm={handleAcceptInvite}
                        />
                    )}

                    {modalType === 'reject' && selectedInvite && (
                        <RejectModal
                            invite={selectedInvite}
                            onClose={closeModal}
                            onConfirm={handleRejectInvite}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}