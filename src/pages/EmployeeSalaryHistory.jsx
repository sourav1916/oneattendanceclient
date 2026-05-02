import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FaHistory, FaArrowLeft, FaEye, FaCalendarAlt, 
    FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaClock,
    FaFileInvoiceDollar, FaLayerGroup, FaSearch, FaSpinner
} from "react-icons/fa";
import apiCall from "../utils/api";
import { toast } from "react-toastify";
import ManagementGrid from "../components/ManagementGrid";
import ManagementViewSwitcher from "../components/ManagementViewSwitcher";
import { ManagementCard, ManagementTable, ManagementHub, ManagementButton } from "../components/common";
import Pagination, { usePagination } from "../components/PaginationComponent";

// ─── Formatting Helpers ───────────────────────────────────────────────────────

const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'current':
            return { text: 'Current', className: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: FaCheckCircle };
        case 'future':
            return { text: 'Upcoming', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: FaClock };
        case 'past':
            return { text: 'Past', className: 'bg-gray-50 text-gray-700 border-gray-100', icon: FaHistory };
        default:
            return { text: status || 'Unknown', className: 'bg-slate-50 text-slate-700 border-slate-100', icon: FaHistory };
    }
};

// ─── Salary Details Modal ─────────────────────────────────────────────────────

const SalaryDetailsModal = ({ isOpen, onClose, salary }) => {
    if (!isOpen || !salary) return null;

    const status = getStatusBadge(salary.status);
    const StatusIcon = status.icon;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between text-white">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-emerald-400" />
                                Salary Details
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Comprehensive view of salary components</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <FaTimesCircle size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Amount</p>
                                <p className="text-xl font-black text-slate-800">{formatCurrency(salary.base_amount, salary.currency)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.className}`}>
                                    <StatusIcon size={10} /> {status.text}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Effective From</p>
                                <p className="text-sm font-bold text-slate-700">{formatDate(salary.effective_from)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Effective To</p>
                                <p className="text-sm font-bold text-slate-700">{formatDate(salary.effective_to)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Salary Components</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {salary.components?.map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{comp.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{comp.code}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${comp.type === 'earning' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {comp.calc_type === 'percentage' ? `${parseFloat(comp.calc_value).toFixed(2)}%` : formatCurrency(comp.calc_value, salary.currency)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{comp.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
                        <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Salary History Page ──────────────────────────────────────────────────────

const EmployeeSalaryHistory = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table');
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const companyStr = localStorage.getItem('company');
            const companyId = companyStr ? JSON.parse(companyStr)?.id : null;
            const response = await apiCall(`/salary/employee-salary-history?employee_id=${employeeId}`, 'GET', null, companyId);
            const result = await response.json();
            if (result.success) {
                setHistory(result.data || []);
            } else {
                toast.error(result.message || "Failed to fetch salary history");
            }
        } catch (error) {
            console.error("Error fetching salary history:", error);
            toast.error("Failed to load salary history records.");
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredHistory = history.filter(s => 
        s.base_amount.toString().includes(searchTerm) || 
        s.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.effective_from.includes(searchTerm) ||
        s.effective_to?.includes(searchTerm)
    );

    const columns = [
        {
            key: 'status',
            label: 'Status',
            render: (s) => {
                const status = getStatusBadge(s.status);
                const Icon = status.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                        <Icon size={10} /> {status.text}
                    </span>
                );
            }
        },
        {
            key: 'base_amount',
            label: 'Base Amount',
            render: (s) => <span className="font-bold text-slate-700">{formatCurrency(s.base_amount, s.currency)}</span>
        },
        {
            key: 'effective_from',
            label: 'Effective From',
            render: (s) => <span className="text-sm text-slate-600">{formatDate(s.effective_from)}</span>
        },
        {
            key: 'effective_to',
            label: 'Effective To',
            render: (s) => <span className="text-sm text-slate-600">{formatDate(s.effective_to)}</span>
        },
        {
            key: 'components',
            label: 'Components',
            render: (s) => <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.components?.length || 0} items</span>
        }
    ];

    const cardRenderer = (s, idx, activeId, onToggle) => {
        const status = getStatusBadge(s.status);
        const StatusIcon = status.icon;
        
        return (
            <ManagementCard
                key={s.salary_id}
                accent="green"
                delay={idx * 0.05}
                onClick={() => setSelectedSalary(s)}
                activeId={activeId}
                onToggle={onToggle}
                menuId={`history-${s.salary_id}`}
                actions={[{ label: 'View Details', icon: <FaEye size={13} />, onClick: () => setSelectedSalary(s), className: 'text-blue-600 hover:bg-blue-50' }]}
                hoverable
                title={formatCurrency(s.base_amount, s.currency)}
                subtitle={`${formatDate(s.effective_from)} - ${formatDate(s.effective_to)}`}
                eyebrow="Salary Record"
                badge={
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                        <StatusIcon size={10} /> {status.text}
                    </span>
                }
                footer={
                    <div className="flex w-full items-center justify-between text-xs text-gray-400">
                        <span>{s.components?.length || 0} components</span>
                        <span className="font-bold">{s.currency}</span>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <span>Component</span>
                            <span>Value</span>
                        </div>
                        <div className="space-y-1.5">
                            {s.components?.slice(0, 3).map((c, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-slate-600">{c.name}</span>
                                    <span className="font-bold text-slate-800">
                                        {c.calc_type === 'percentage' ? `${parseFloat(c.calc_value).toFixed(2)}%` : formatCurrency(c.calc_value, s.currency)}
                                    </span>
                                </div>
                            ))}
                            {(s.components?.length || 0) > 3 && (
                                <p className="text-[10px] text-center text-slate-400 pt-1 font-bold italic">+{s.components.length - 3} more components</p>
                            )}
                        </div>
                    </div>
                </div>
            </ManagementCard>
        );
    };

    return (
        <ManagementHub
            eyebrow={<><FaHistory size={11} /> Salary History</>}
            title="Salary History"
            description="Track salary changes and historical compensation records for this employee."
            accent="green"
            actions={
                <ManagementButton
                    tone="slate"
                    variant="outline"
                    leftIcon={<FaArrowLeft />}
                    onClick={() => navigate(-1)}
                >
                    Back to Profile
                </ManagementButton>
            }
        >
            <div className="space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm"
                        />
                    </div>
                    <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent="green" />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-3 text-slate-400">
                        <FaSpinner className="animate-spin text-3xl text-emerald-500" />
                        <span className="text-sm font-medium tracking-wide">Fetching salary history...</span>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaHistory className="text-3xl text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No History Found</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                            {searchTerm ? "No records match your current search criteria." : "There are no historical salary records available for this employee."}
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <ManagementTable
                                rows={filteredHistory}
                                columns={columns}
                                rowKey="salary_id"
                                onRowClick={setSelectedSalary}
                                getActions={(s) => [
                                    { label: 'View Details', icon: <FaEye size={13} />, onClick: () => setSelectedSalary(s), className: 'text-blue-600 hover:bg-blue-50' }
                                ]}
                                accent="green"
                            />
                        ) : (
                            <ManagementGrid viewMode={viewMode}>
                                {filteredHistory.map((s, idx) => cardRenderer(s, idx, null, null))}
                            </ManagementGrid>
                        )}
                    </>
                )}
            </div>

            <SalaryDetailsModal 
                isOpen={!!selectedSalary} 
                onClose={() => setSelectedSalary(null)} 
                salary={selectedSalary} 
            />
        </ManagementHub>
    );
};

export default EmployeeSalaryHistory;
