import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";

// ─── TABS CONFIGURATION ───────────────────────────────────────────────────────
const TABS = [
  { key: "permissions", label: "Permissions" },
  { key: "attendance",  label: "Attendance"  },
  { key: "salary",      label: "Salary"      },
  { key: "payroll",     label: "Payroll"     },
  { key: "leave",       label: "Leave"       },
  { key: "shift",       label: "Shift"       },
];

// ─── MOCK DATA (FALLBACK) ────────────────────────────────────────────────────
const MOCK_TAB_DATA = {
  permissions: {
    cols: ["Module", "View", "Create", "Edit", "Delete", "Admin"],
    rows: [
      ["Dashboard",  "✓", "—", "—", "—", "—"],
      ["Employees",  "✓", "✓", "✓", "—", "—"],
      ["Payroll",    "✓", "—", "—", "—", "—"],
      ["Attendance", "✓", "✓", "✓", "—", "—"],
      ["Reports",    "✓", "—", "—", "—", "—"],
      ["Settings",   "—", "—", "—", "—", "—"],
    ],
    note: "Role: HR Manager",
  },
  attendance: {
    cols: ["Date", "Day", "Check-in", "Check-out", "Hours", "Status"],
    rows: [
      ["17 Apr 2026", "Thu", "09:02", "18:15", "9h 13m", "Present"],
      ["16 Apr 2026", "Wed", "09:10", "18:00", "8h 50m", "Present"],
      ["15 Apr 2026", "Tue", "—",     "—",     "—",      "Leave"  ],
      ["14 Apr 2026", "Mon", "08:55", "18:30", "9h 35m", "Present"],
      ["13 Apr 2026", "Sun", "—",     "—",     "—",      "Holiday"],
    ],
    statusCol: 5,
  },
  salary: {
    cols: ["Component", "Type", "Amount (₹)", "Frequency", "Taxable"],
    rows: [
      ["Basic Salary",    "Earning",   "22,000", "Monthly", "Yes"    ],
      ["HRA",             "Earning",   "8,800",  "Monthly", "Partial"],
      ["Transport",       "Earning",   "1,600",  "Monthly", "No"     ],
      ["Provident Fund",  "Deduction", "2,640",  "Monthly", "—"      ],
      ["Professional Tax","Deduction", "200",    "Monthly", "—"      ],
    ],
    note: "Employment: Part-time · Salary type: Monthly",
    statusCol: 1,
  },
  payroll: {
    cols: ["Month", "Gross (₹)", "Deductions (₹)", "Net Pay (₹)", "Status", "Paid On"],
    rows: [
      ["Mar 2026", "32,400", "2,840", "29,560", "Paid",    "01 Apr 2026"],
      ["Feb 2026", "32,400", "2,840", "29,560", "Paid",    "01 Mar 2026"],
      ["Jan 2026", "32,400", "2,840", "29,560", "Pending", "—"          ],
    ],
    statusCol: 4,
  },
  leave: {
    cols: ["Type", "Applied", "From", "To", "Days", "Status"],
    rows: [
      ["Sick",   "10 Apr", "11 Apr", "12 Apr", "2", "Approved"],
      ["Casual", "15 Mar", "21 Mar", "21 Mar", "1", "Approved"],
      ["Annual", "02 Feb", "10 Feb", "14 Feb", "3", "Approved"],
    ],
    statusCol: 5,
    note: "Balance — Annual: 10d · Casual: 5d · Sick: 7d",
  },
  shift: {
    cols: ["Week", "Shift", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Location"],
    rows: [
      ["14–18 Apr", "Day", "09:00–15:00", "09:00–15:00", "Leave",      "09:00–15:00", "09:00–15:00", "09:00–13:00", "Office"],
      ["07–11 Apr", "Day", "09:00–15:00", "09:00–15:00", "09:00–15:00","09:00–15:00", "09:00–15:00", "09:00–13:00", "Office"],
    ],
    note: "Saturday: Half day · Sunday: Off",
  },
};

const DEMO_DATA = {
  employee: {
    id: 5, code: "EMP-4-41-8CC7", designation: "hr_manager",
    salary_type: "monthly", employment_type: "part_time", status: "active",
    joining_date: "2026-04-16", weekends: { saturday: "half", sunday: "full" },
    created_at: "2026-04-16 11:56:30",
  },
  user: {
    id: 41, name: "XYZ Das", email: "xyz@gmail.com", phone: "6567777687",
    is_active: true, last_login: "2026-04-17 11:59:48",
  },
  company: {
    id: 4, name: "Hello World", legal_name: "Hello World Private Limited",
    logo_url: "https://api-attendance.onesaas.in/uploads/images/2026/image-2026-4f9eed3a13ac9aae.jpg",
    city: "Tufanganj - I", state: "West Bengal", country: "India",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (str) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getInitials = (name) =>
  name?.trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("") || "?";

// ─── PILL STYLES ──────────────────────────────────────────────────────────────
const STATUS_PILL = {
  active:    "bg-emerald-100 text-emerald-800",
  inactive:  "bg-rose-100 text-rose-800",
  suspended: "bg-amber-100 text-amber-800",
  Present:   "bg-emerald-100 text-emerald-800",
  Leave:     "bg-amber-100 text-amber-800",
  Holiday:   "bg-indigo-100 text-indigo-800",
  Paid:      "bg-emerald-100 text-emerald-800",
  Pending:   "bg-amber-100 text-amber-800",
  Failed:    "bg-rose-100 text-rose-800",
  Approved:  "bg-emerald-100 text-emerald-800",
  Rejected:  "bg-rose-100 text-rose-800",
  Earning:   "bg-indigo-100 text-indigo-800",
  Deduction: "bg-rose-100 text-rose-800",
};

const TYPE_PILL = {
  monthly:    "bg-indigo-100 text-indigo-800",
  daily:      "bg-teal-100 text-teal-800",
  hourly:     "bg-amber-100 text-amber-800",
  full_time:  "bg-emerald-100 text-emerald-800",
  part_time:  "bg-amber-100 text-amber-800",
  contract:   "bg-indigo-100 text-indigo-800",
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
function Pill({ label, colorClass }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function StatusPill({ value }) {
  const cls = STATUS_PILL[value] || "bg-slate-100 text-slate-600";
  return <Pill label={fmt(value)} colorClass={cls} />;
}

function TypePill({ value }) {
  const cls = TYPE_PILL[value] || "bg-slate-100 text-slate-600";
  return <Pill label={fmt(value)} colorClass={cls} />;
}

function MetaItem({ label, children }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  );
}

// ─── DETAILS MODAL (shows full row info) ──────────────────────────────────────
function DetailsModal({ isOpen, onClose, rowData, columns, tabLabel }) {
  if (!isOpen || !rowData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{tabLabel} Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Record information</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"
          >
            <i className="fas fa-times text-slate-400"></i>
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {columns.map((col, idx) => {
            let value = rowData[idx];
            // Special rendering for status-like columns to show pill
            const isStatusCol = ["Status", "Type"].includes(col) && STATUS_PILL[value];
            return (
              <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2">
                <span className="text-sm font-medium text-gray-500">{col}</span>
                <div className="text-right">
                  {isStatusCol ? (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_PILL[value] || "bg-gray-100 text-gray-600"}`}>
                      {value}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-800 font-mono break-all">{value || "—"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── DATA TABLE (click on row → opens modal) ──────────────────────────────────
function DataTable({ tabData, tabLabel }) {
  const { cols, rows, note, statusCol } = tabData;
  const isPermMatrix = cols[0] === "Module";
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  return (
    <div>
      {note && (
        <p className="text-[12px] text-gray-400 pb-2 px-0.5">{note}</p>
      )}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-[13px] min-w-[380px]">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th
                  key={i}
                  className={`bg-gray-50 font-medium text-[12px] text-gray-500 text-left px-3 py-2.5 border-b border-gray-100 whitespace-nowrap ${isPermMatrix && i > 0 ? "text-center" : ""}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <motion.tr
                key={ri}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: ri * 0.04 }}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(row)}
              >
                {row.map((cell, ci) => {
                  if (statusCol === ci) {
                    const cls = STATUS_PILL[cell] || "bg-gray-100 text-gray-600";
                    return (
                      <td key={ci} className="px-3 py-2.5 border-b border-gray-100 align-middle">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{cell}</span>
                      </td>
                    );
                  }
                  if (isPermMatrix && ci > 0) {
                    const clr = cell === "✓" ? "text-green-700" : "text-gray-300";
                    return (
                      <td key={ci} className={`px-3 py-2.5 border-b border-gray-100 text-center ${clr}`}>{cell}</td>
                    );
                  }
                  return (
                    <td key={ci} className="px-3 py-2.5 border-b border-gray-100 text-gray-800 align-middle">
                      {cell}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for row details */}
      <DetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        rowData={selectedRow}
        columns={cols}
        tabLabel={tabLabel}
      />
    </div>
  );
}

// ─── PROFILE CARD (no action column removed already) ──────────────────────────
function ProfileCard({ data }) {
  const { employee: e, user: u, company: c } = data;
  const [imgErr, setImgErr] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5"
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[22px] font-bold text-white shadow-lg shadow-indigo-200 shrink-0 select-none">
          {getInitials(u.name)}
        </div>

        <div className="flex-1 min-w-[160px]">
          <h2 className="text-[18px] font-bold text-slate-800 leading-tight">{u.name}</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">{fmt(e.designation)}</p>

          <div className="flex gap-1.5 flex-wrap mt-2">
            <StatusPill value={e.status} />
            <TypePill value={e.employment_type} />
            <TypePill value={e.salary_type} />
          </div>

          <div className="flex items-center gap-2 mt-2">
            {c.logo_url && !imgErr && (
              <img
                src={c.logo_url}
                alt={c.name}
                onError={() => setImgErr(true)}
                className="w-[22px] h-[22px] rounded object-contain border border-slate-200 bg-slate-50"
              />
            )}
            <span className="text-[12px] text-slate-500">
              {c.name} &nbsp;·&nbsp; {c.city}, {c.state}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS REMOVED AS PER "no need actions remove this column" — only profile info */}
      </div>

      <div className="flex pb-2 mt-4 border-b border-transparent">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        >
          {showDetails ? "Hide Employee Details" : "View Employee Details"}
          {showDetails ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5 mt-2 pt-4 border-t border-slate-100">
              <MetaItem label="Employee ID">{e.code}</MetaItem>
              <MetaItem label="Email">
                <span className="text-[12px] break-all">{u.email}</span>
              </MetaItem>
              <MetaItem label="Phone">{u.phone || "—"}</MetaItem>
              <MetaItem label="Joining Date">{fmtDate(e.joining_date)}</MetaItem>
              <MetaItem label="Last Login">{fmtDate(u.last_login)}</MetaItem>
              <MetaItem label="Saturday">{fmt(e.weekends?.saturday || "—")}</MetaItem>
              <MetaItem label="Sunday">{fmt(e.weekends?.sunday || "—")}</MetaItem>
              <MetaItem label="Company">
                <span className="text-[12px]">{c.legal_name}</span>
              </MetaItem>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── TABS PANEL ────────────────────────────────────────────────────────────────
function TabsPanel({ employeeId }) {
  const [activeTab, setActiveTab] = useState("permissions");
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState(false);
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);

  const fetchTab = useCallback(
    async (tab, page = pagination.page, limit = pagination.limit) => {
      setLoading(true);
      setWarn(false);
      setTabData(null);
      try {
        const res = await apiCall(
          `/employees/tab-data?tab=${tab}&employee_id=${encodeURIComponent(employeeId)}&page=${page}&limit=${limit}`
        );
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "API error");

        const payload = json.data ?? json.result ?? json;
        const nextTabData = payload.tabData ?? payload.data ?? payload;
        const nextPagination = payload.pagination ?? json.pagination ?? json.meta ?? {};
        const totalItems = Number(nextPagination.total ?? payload.total ?? nextTabData.rows?.length ?? 0);
        const currentPage = Number(nextPagination.page ?? payload.page ?? page);
        const itemsPerPage = Number(nextPagination.limit ?? payload.limit ?? limit);
        const totalPages = Number(
          nextPagination.total_pages ??
          payload.total_pages ??
          Math.max(1, Math.ceil(totalItems / itemsPerPage))
        );

        setTabData(nextTabData);
        updatePagination({
          page: currentPage,
          limit: itemsPerPage,
          total: totalItems,
          total_pages: totalPages,
          is_last_page: nextPagination.is_last_page ?? (currentPage >= totalPages),
        });
      } catch {
        const fallback = MOCK_TAB_DATA[tab];
        setTabData(fallback);
        setWarn(true);
        updatePagination({
          page,
          limit,
          total: fallback.rows?.length || 0,
          total_pages: 1,
          is_last_page: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [employeeId, pagination.page, pagination.limit, updatePagination]
  );

  useEffect(() => {
    fetchTab(activeTab, pagination.page, pagination.limit);
  }, [activeTab, fetchTab, pagination.page, pagination.limit]);

  const activeTabLabel = TABS.find(t => t.key === activeTab)?.label || activeTab;

  return (
    <div className="overflow-hidden">
      <div className="flex overflow-x-auto border-b border-slate-100 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              goToPage(1);
            }}
            className={`shrink-0 px-4 py-2.5 text-[13px] border-b-2 whitespace-nowrap transition-colors
              ${activeTab === t.key
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 overflow-hidden min-h-[120px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-2 text-[14px] text-slate-400"
            >
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              Loading…
            </motion.div>
          ) : tabData ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {warn && (
                <p className="text-[11px] text-gray-400 pb-1">⚠ API unavailable — showing sample data</p>
              )}
              <DataTable tabData={tabData} tabLabel={activeTabLabel} />
              <Pagination
                currentPage={pagination.page}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={goToPage}
                onLimitChange={changeLimit}
                className="mt-4"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (id) => {
    if (!id) {
      setProfile(DEMO_DATA);
      return;
    }

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const res = await apiCall(`/employees/full-data?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.[0]) {
        throw new Error(json.message || "No data returned");
      }
      setProfile(json.data[0]);
    } catch (err) {
      setError(err.message || "Failed to load employee profile");
      setProfile(DEMO_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile(employeeId);
  }, [employeeId, fetchProfile]);

  function loadDemo() {
    setError(null);
    setProfile(DEMO_DATA);
  }

  return (
    <div className="min-h-screen p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-3.5">
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10 gap-2 text-[14px] text-slate-400"
            >
              <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              Fetching employee data…
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {profile && !loading && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3.5"
            >
              <ProfileCard data={profile} />
              <TabsPanel employeeId={profile.employee.id} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional error / demo reset */}
        {error && !profile && !loading && (
          <div className="text-center py-8 bg-rose-50 rounded-2xl border border-rose-200">
            <p className="text-rose-600 text-sm">{error}</p>
            <button onClick={loadDemo} className="mt-3 text-sm text-indigo-600 underline">Load demo data</button>
          </div>
        )}
      </div>
    </div>
  );
}