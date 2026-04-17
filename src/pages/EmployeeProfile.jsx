import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";

const TABS = [
  { key: "permissions", label: "Permissions" },
  { key: "attendance",  label: "Attendance"  },
  { key: "salary",      label: "Salary"      },
  { key: "payroll",     label: "Payroll"      },
  { key: "leave",       label: "Leave"        },
  { key: "shift",       label: "Shift"        },
];

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

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (str) =>
  str ? str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getInitials = (name) =>
  name?.trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("") || "?";

// ─── pill maps ────────────────────────────────────────────────────────────────

const STATUS_PILL = {
  active:    "bg-green-100 text-green-800",
  inactive:  "bg-red-100 text-red-800",
  suspended: "bg-amber-100 text-amber-800",
  Present:   "bg-green-100 text-green-800",
  Leave:     "bg-amber-100 text-amber-800",
  Holiday:   "bg-blue-100 text-blue-800",
  Paid:      "bg-green-100 text-green-800",
  Pending:   "bg-amber-100 text-amber-800",
  Failed:    "bg-red-100 text-red-800",
  Approved:  "bg-green-100 text-green-800",
  Rejected:  "bg-red-100 text-red-800",
  Earning:   "bg-blue-100 text-blue-800",
  Deduction: "bg-red-100 text-red-800",
};

const TYPE_PILL = {
  monthly:    "bg-blue-100 text-blue-800",
  daily:      "bg-teal-100 text-teal-800",
  hourly:     "bg-amber-100 text-amber-800",
  full_time:  "bg-green-100 text-green-800",
  part_time:  "bg-amber-100 text-amber-800",
  contract:   "bg-blue-100 text-blue-800",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function Pill({ label, colorClass }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function StatusPill({ value }) {
  const cls = STATUS_PILL[value] || "bg-gray-100 text-gray-600";
  return <Pill label={fmt(value)} colorClass={cls} />;
}

function TypePill({ value }) {
  const cls = TYPE_PILL[value] || "bg-gray-100 text-gray-600";
  return <Pill label={fmt(value)} colorClass={cls} />;
}

function MetaItem({ label, children }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">{label}</span>
      <span className="text-[13px] font-medium text-gray-800">{children}</span>
    </div>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({ data, onAction }) {
  const { employee: e, user: u, company: c } = data;
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-gray-200 rounded-2xl p-5"
    >
      {/* Top row */}
      <div className="flex items-start gap-4 flex-wrap">
        {/* Avatar */}
        <div className="w-[68px] h-[68px] rounded-full bg-blue-100 flex items-center justify-center text-[22px] font-medium text-blue-800 shrink-0 select-none">
          {getInitials(u.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-[160px]">
          <h2 className="text-[18px] font-medium text-gray-900 leading-tight">{u.name}</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">{fmt(e.designation)}</p>

          <div className="flex gap-1.5 flex-wrap mt-2">
            <StatusPill value={e.status} />
            <TypePill value={e.employment_type} />
            <TypePill value={e.salary_type} />
          </div>

          {/* Company row */}
          <div className="flex items-center gap-2 mt-2">
            {c.logo_url && !imgErr && (
              <img
                src={c.logo_url}
                alt={c.name}
                onError={() => setImgErr(true)}
                className="w-[22px] h-[22px] rounded object-contain border border-gray-200 bg-gray-50"
              />
            )}
            <span className="text-[12px] text-gray-500">
              {c.name} &nbsp;·&nbsp; {c.city}, {c.state}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap ml-auto items-start">
          <button
            onClick={() => onAction?.(`Edit profile for ${u.name}`)}
            className="text-[12px] px-3.5 py-1.5 rounded-md border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
          >
            Edit ↗
          </button>
          <button
            onClick={() => onAction?.(`Generate payslip for ${u.name}`)}
            className="text-[12px] px-3.5 py-1.5 rounded-md border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all"
          >
            Payslip ↗
          </button>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5 mt-4 pt-4 border-t border-gray-100">
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
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────

function DataTable({ tabData }) {
  const { cols, rows, note, statusCol } = tabData;
  const isPermMatrix = cols[0] === "Module";

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
                className="hover:bg-gray-50 transition-colors"
              >
                {row.map((cell, ci) => {
                  // Status pill column
                  if (statusCol === ci) {
                    const cls = STATUS_PILL[cell] || "bg-gray-100 text-gray-600";
                    return (
                      <td key={ci} className="px-3 py-2.5 border-b border-gray-100 align-middle">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{cell}</span>
                      </td>
                    );
                  }
                  // Permission matrix ticks
                  if (isPermMatrix && ci > 0) {
                    const clr = cell === "✓" ? "text-green-700" : "text-gray-300";
                    return (
                      <td key={ci} className={`px-3 py-2.5 border-b border-gray-100 text-center ${clr}`}>{cell}</td>
                    );
                  }
                  return (
                    <td key={ci} className="px-3 py-2.5 border-b border-gray-100 text-gray-800 align-middle last:border-b-0">
                      {cell}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tabs Panel ───────────────────────────────────────────────────────────────

function TabsPanel({ employeeId }) {
  const [activeTab, setActiveTab] = useState("permissions");
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn]       = useState(false);
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);

  const fetchTab = useCallback(
    async (tab, page = pagination.page, limit = pagination.limit) => {
      setLoading(true);
      setWarn(false);
      setTabData(null);
      try {
        const res  = await apiCall(
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              goToPage(1);
            }}
            className={`shrink-0 px-4 py-2.5 text-[13px] border-b-2 whitespace-nowrap transition-colors
              ${activeTab === t.key
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="p-4 overflow-hidden min-h-[120px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-2 text-[14px] text-gray-400"
            >
              <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
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
              <DataTable tabData={tabData} />
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

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
    <div className="max-w-[960px] mx-auto px-4 py-4 flex flex-col gap-3.5 font-sans">

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10 gap-2 text-[14px] text-gray-400"
          >
            <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            Fetching employee data…
          </motion.div>
        )}
      </AnimatePresence>


      {/* Profile + tabs */}
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
            <TabsPanel
              employeeId={profile.employee.id}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
