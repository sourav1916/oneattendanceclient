import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown, FaChevronUp, FaEye, FaShieldAlt,
  FaClock, FaMoneyBillWave, FaCalendarAlt, FaExchangeAlt,
  FaEnvelope, FaIdCard, FaCheckCircle, FaTimesCircle,
  FaUserCircle, FaTimes, FaDollarSign, FaCalculator,
  FaChartBar, FaHandPaper, FaCalendarPlus, FaCalendarCheck,
  FaTag, FaBriefcase, FaMapMarkerAlt, FaNetworkWired,
  FaArrowDown, FaArrowUp, FaUmbrellaBeach,
} from "react-icons/fa";
import apiCall from "../utils/api";
import Pagination, { usePagination } from "../components/PaginationComponent";
import ManagementGrid from "../components/ManagementGrid";
import ManagementViewSwitcher from "../components/ManagementViewSwitcher";
import { ManagementCard, ManagementTable } from "../components/common";

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "permissions", label: "Permissions", icon: <FaShieldAlt size={12} /> },
  { key: "attendance", label: "Attendance", icon: <FaClock size={12} /> },
  { key: "salary", label: "Salary", icon: <FaMoneyBillWave size={12} /> },
  { key: "payroll", label: "Payroll", icon: <FaCalendarAlt size={12} /> },
  { key: "leave", label: "Leave", icon: <FaUmbrellaBeach size={12} /> },
  { key: "shifts", label: "Shift", icon: <FaExchangeAlt size={12} /> },
];

// ─── DEMO / FALLBACK DATA ─────────────────────────────────────────────────────
const DEMO_PROFILE = {
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

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatDays = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

const getInitials = (name) =>
  name?.trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("") || "?";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600", "from-purple-500 to-pink-600",
  "from-green-500 to-teal-600", "from-orange-500 to-amber-500",
  "from-rose-500 to-red-600", "from-cyan-500 to-blue-500",
];
const avatarGradient = (id) => AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length];

// ─── PILL STYLES ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-rose-100 text-rose-800",
  suspended: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  paid: "bg-emerald-100 text-emerald-800",
  present: "bg-emerald-100 text-emerald-800",
  leave: "bg-amber-100 text-amber-800",
  holiday: "bg-indigo-100 text-indigo-800",
  manual: "bg-slate-100 text-slate-700",
  biometric: "bg-blue-100 text-blue-700",
  in: "bg-emerald-100 text-emerald-800",
  out: "bg-rose-100 text-rose-800",
  break_start: "bg-amber-100 text-amber-800",
  break_end: "bg-teal-100 text-teal-800",
};

function Pill({ value, className = "" }) {
  const cls = STATUS_COLORS[value?.toLowerCase?.()] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {fmt(value)}
    </span>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ isOpen, onClose, item, tabKey, tabLabel }) {
  if (!isOpen || !item) return null;

  const renderFields = () => {
    if (tabKey === "permissions") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Permission Name" value={item.name} highlight />
          <Field label="Code" mono value={item.code} />
        </>
      );
    }
    if (tabKey === "attendance") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Punch Type" value={<Pill value={item.punch_type} />} />
          <Field label="Punch Time" value={fmtDateTime(item.punch_time)} />
          <Field label="Status" value={<Pill value={item.status} />} />
          <Field label="Method" value={<Pill value={item.attendance_method} />} />
          <Field label="IP Address" mono value={item.ip_address} />
        </>
      );
    }
    if (tabKey === "salary") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Package" value={item.package_name} highlight />
          <Field label="Base Amount" value={`${item.currency?.toUpperCase()} ${Number(item.base_amount).toLocaleString()}`} />
          <Field label="Currency" value={item.currency?.toUpperCase()} />
          <Field label="Effective From" value={fmtDateTime(item.effective_from)} />
          <Field label="Effective To" value={fmtDate(item.effective_to)} />
        </>
      );
    }
    if (tabKey === "payroll") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Period" value={item.period || item.month} highlight />
          <Field label="Gross" value={item.gross_amount || item.gross} />
          <Field label="Deductions" value={item.deductions} />
          <Field label="Net Pay" value={item.net_pay || item.net} />
          <Field label="Status" value={<Pill value={item.status} />} />
          <Field label="Paid On" value={fmtDate(item.paid_on || item.paid_date)} />
        </>
      );
    }
    if (tabKey === "leave") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Leave Type" value={item.leave_type || item.type} highlight />
          <Field label="From" value={fmtDate(item.from_date || item.from)} />
          <Field label="To" value={fmtDate(item.to_date || item.to)} />
          <Field label="Days" value={formatDays(item.days)} />
          <Field label="Status" value={<Pill value={item.status} />} />
          <Field label="Reason" value={item.reason} />
        </>
      );
    }
    if (tabKey === "shift") {
      return (
        <>
          <Field label="ID" value={item.id} />
          <Field label="Shift Name" value={item.name || item.shift_name} highlight />
          <Field label="Start Time" value={item.start_time} />
          <Field label="End Time" value={item.end_time} />
          <Field label="Location" value={item.location} />
          <Field label="Status" value={<Pill value={item.status} />} />
        </>
      );
    }
    // Generic fallback
    return Object.entries(item).map(([k, v]) => (
      <Field key={k} label={fmt(k)} value={typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")} />
    ));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[10px] shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div>
            <h3 className="text-base font-bold">{tabLabel} Details</h3>
            <p className="text-xs text-white/70 mt-0.5">Record information</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <FaTimes size={13} />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[65vh] overflow-y-auto">
          {renderFields()}
        </div>
        <div className="px-5 py-3 bg-gray-50 flex justify-end border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-[10px] hover:bg-gray-100 transition">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, mono, highlight }) {
  return (
    <div className="flex justify-between items-start gap-3 border-b border-gray-50 pb-2">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-right break-all ${mono ? "font-mono text-gray-600" : ""} ${highlight ? "font-semibold text-gray-800" : "text-gray-700"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── PROFILE CARD ─────────────────────────────────────────────────────────────
function ProfileCard({ data }) {
  const { employee: e, user: u, company: c } = data;
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-[10px] border border-gray-100 shadow-sm p-5"
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div className={`w-[64px] h-[64px] rounded-[10px] bg-gradient-to-br ${avatarGradient(u.id)} flex items-center justify-center text-2xl font-bold text-white shadow-md shrink-0 select-none`}>
          {getInitials(u.name)}
        </div>

        <div className="flex-1 min-w-[160px]">
          <h2 className="text-xl font-bold text-slate-800 leading-tight">{u.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{fmt(e.designation)}</p>
          <div className="flex gap-1.5 flex-wrap mt-2">
            <Pill value={e.status} />
            <Pill value={e.employment_type} />
            <Pill value={e.salary_type} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            {c.logo_url && !imgErr && (
              <img src={c.logo_url} alt={c.name} onError={() => setImgErr(true)}
                className="w-5 h-5 rounded object-contain border border-slate-200 bg-slate-50" />
            )}
            <span className="text-sm text-slate-500">{c.name} · {c.city}, {c.state}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 mt-4 pt-4 border-t border-slate-100">
        {[
          ["Employee Code", e.code],
          ["Email", u.email],
          ["Phone", u.phone || "—"],
          ["Joining Date", fmtDate(e.joining_date)],
          ["Created At", fmtDateTime(e.created_at)],
          ["Company", c.legal_name],
          ["Work Schedule", `${e.expected_work_minutes || 0} mins/day`],
          ["Weekends", Array.isArray(e.weekends) 
            ? e.weekends.map(w => `${fmt(w.day)} (${fmt(w.type)})`).join(", ") 
            : "None"],
        ].map(([label, val]) => (
          <div key={label}>
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-0.5">{label}</span>
            <span className="text-sm font-medium text-slate-800 break-all">{val}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── TAB RENDERERS ────────────────────────────────────────────────────────────
// Each returns { columns, cardRenderer, rowKey }

function usePermissionsConfig(onView, width) {
  const columns = [
    {
      key: "name", label: "Permission",
      render: (p) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <FaShieldAlt size={11} className="text-indigo-500" />
          </div>
          <span className="font-medium text-gray-800 text-sm truncate min-w-0">
            {p.name}
          </span>
        </div>
      ),
    },
    width > 600 && {
      key: "code", label: "Code",
      render: (p) => (
        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{p.code}</span>
      ),
    },
    width > 800 && {
      key: "category", label: "Category",
      render: (p) => {
        const cat = p.code.split("_")[0];
        return <Pill value={cat} />;
      },
    },
  ].filter(Boolean);

  const cardRenderer = (p, index, activeId, onToggle) => {
    const cat = p.code.split("_")[0];
    return (
      <ManagementCard
        key={p.id}
        accent="indigo"
        delay={index * 0.04}
        onClick={() => onView(p)}
        activeId={activeId}
        onToggle={onToggle}
        menuId={`perm-${p.id}`}
        actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(p), className: "text-blue-600 hover:bg-blue-50" }]}
        hoverable
        title={p.name}
        subtitle={p.code}
        eyebrow={fmt(cat)}
        badge={<Pill value={cat} />}
      >
        <div className="flex items-center gap-2 mt-1">
          <FaShieldAlt size={11} className="text-indigo-400" />
          <span className="text-xs text-gray-500 font-mono">{p.code}</span>
        </div>
      </ManagementCard>
    );
  };

  return { columns, cardRenderer, rowKey: "id" };
}

function useAttendanceConfig(onView, width) {
  const columns = [
    {
      key: "punch_type", label: "Type",
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.punch_type === "in" ? <FaArrowDown size={11} className="text-emerald-500" /> : <FaArrowUp size={11} className="text-rose-500" />}
          <Pill value={a.punch_type} />
        </div>
      ),
    },
    {
      key: "punch_time", label: "Time",
      render: (a) => <span className="text-sm text-gray-700">{fmtDateTime(a.punch_time)}</span>,
    },
    width > 600 && {
      key: "status", label: "Status",
      render: (a) => <Pill value={a.status} />,
    },
    width > 800 && {
      key: "attendance_method", label: "Method",
      render: (a) => <Pill value={a.attendance_method} />,
    },
    width > 1000 && {
      key: "ip_address", label: "IP",
      render: (a) => <span className="font-mono text-xs text-gray-400">{a.ip_address || "—"}</span>,
    },
  ].filter(Boolean);

  const cardRenderer = (a, index, activeId, onToggle) => (
    <ManagementCard
      key={a.id}
      accent="blue"
      delay={index * 0.04}
      onClick={() => onView(a)}
      activeId={activeId}
      onToggle={onToggle}
      menuId={`att-${a.id}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(a), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable
      title={fmtDateTime(a.punch_time)}
      subtitle={`IP: ${a.ip_address || "—"}`}
      eyebrow="Attendance Record"
      badge={<Pill value={a.punch_type} />}
    >
      <div className="flex gap-2 flex-wrap mt-1">
        <Pill value={a.status} />
        <Pill value={a.attendance_method} />
      </div>
    </ManagementCard>
  );

  return { columns, cardRenderer, rowKey: "id" };
}

function useSalaryConfig(onView, width) {
  const columns = [
    {
      key: "package_name", label: "Package",
      render: (s) => (
        <span className="inline-flex whitespace-nowrap rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          {s.package_name || "—"}
        </span>
      ),
    },
    {
      key: "base_amount", label: "Base Amount",
      render: (s) => (
        <span className="font-semibold text-gray-800 text-sm">
          {s.currency?.toUpperCase()} {Number(s.base_amount).toLocaleString()}
        </span>
      ),
    },
    width > 600 && {
      key: "effective_from", label: "Effective From",
      render: (s) => <span className="text-sm text-gray-600">{fmtDate(s.effective_from)}</span>,
    },
    width > 1000 && {
      key: "effective_to", label: "Effective To",
      render: (s) => <span className="text-sm text-gray-600">{fmtDate(s.effective_to)}</span>,
    },
    width > 800 && {
      key: "status", label: "Status",
      render: (s) => {
        const active = !s.effective_to || new Date(s.effective_to) > new Date();
        return active
          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FaCheckCircle size={10} />Active</span>
          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><FaTimesCircle size={10} />Expired</span>;
      },
    },
  ].filter(Boolean);

  const cardRenderer = (s, index, activeId, onToggle) => {
    const active = !s.effective_to || new Date(s.effective_to) > new Date();
    return (
      <ManagementCard
        key={s.id}
        accent="green"
        delay={index * 0.04}
        onClick={() => onView(s)}
        activeId={activeId}
        onToggle={onToggle}
        menuId={`sal-${s.id}`}
        actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(s), className: "text-blue-600 hover:bg-blue-50" }]}
        hoverable
        title={s.package_name || "Salary Package"}
        subtitle={`Effective: ${fmtDate(s.effective_from)} → ${fmtDate(s.effective_to)}`}
        eyebrow="Salary Record"
        badge={
          active
            ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FaCheckCircle size={10} />Active</span>
            : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><FaTimesCircle size={10} />Expired</span>
        }
        footer={
          <div className="flex w-full items-center justify-between text-xs text-gray-400">
            <span>{s.currency?.toUpperCase()}</span>
            <span>{fmtDate(s.effective_from)}</span>
          </div>
        }
      >
        <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-sm font-bold text-blue-700">{s.currency?.toUpperCase()} {Number(s.base_amount).toLocaleString()}</p>
          <p className="text-xs text-blue-500 mt-0.5">Base Amount</p>
        </div>
      </ManagementCard>
    );
  };

  return { columns, cardRenderer, rowKey: "id" };
}

function usePayrollConfig(onView, width) {
  const columns = [
    {
      key: "period", label: "Period",
      render: (p) => <span className="font-medium text-gray-800 text-sm">{p.period || p.month || "—"}</span>,
    },
    width > 480 && {
      key: "gross_amount", label: "Gross",
      render: (p) => <span className="text-sm text-gray-700">{p.gross_amount || p.gross || "—"}</span>,
    },
    width > 800 && {
      key: "deductions", label: "Deductions",
      render: (p) => <span className="text-sm text-rose-600">{p.deductions || "—"}</span>,
    },
    {
      key: "net_pay", label: "Net Pay",
      render: (p) => (
        <span className="inline-flex whitespace-nowrap rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
          {p.net_pay || p.net || "—"}
        </span>
      ),
    },
    width > 1000 && {
      key: "status", label: "Status",
      render: (p) => <Pill value={p.status} />,
    },
  ].filter(Boolean);

  const cardRenderer = (p, index, activeId, onToggle) => (
    <ManagementCard
      key={p.id || index}
      accent="emerald"
      delay={index * 0.04}
      onClick={() => onView(p)}
      activeId={activeId}
      onToggle={onToggle}
      menuId={`pay-${p.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(p), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable
      title={p.period || p.month || "Payroll"}
      subtitle={`Paid: ${fmtDate(p.paid_on || p.paid_date)}`}
      eyebrow="Payroll Record"
      badge={<Pill value={p.status} />}
    >
      <div className="grid grid-cols-3 gap-2 text-center mt-1">
        {[["Gross", p.gross_amount || p.gross, "blue"], ["Deductions", p.deductions, "red"], ["Net Pay", p.net_pay || p.net, "green"]].map(([lbl, val, clr]) => (
          <div key={lbl} className={`rounded-[10px] border border-${clr}-100 bg-${clr}-50 p-2`}>
            <p className={`text-xs font-bold text-${clr}-700`}>{val || "—"}</p>
            <p className={`text-[11px] text-${clr}-500`}>{lbl}</p>
          </div>
        ))}
      </div>
    </ManagementCard>
  );

  return { columns, cardRenderer, rowKey: "id" };
}

function useLeaveConfig(onView, width) {
  const columns = [
    {
      key: "leave_type", label: "Type",
      render: (l) => (
        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          {l.leave_type || l.type || "—"}
        </span>
      ),
    },
    width > 600 && {
      key: "from_date", label: "From",
      render: (l) => <span className="text-sm text-gray-600">{fmtDate(l.from_date || l.from)}</span>,
    },
    width > 600 && {
      key: "to_date", label: "To",
      render: (l) => <span className="text-sm text-gray-600">{fmtDate(l.to_date || l.to)}</span>,
    },
    {
      key: "days", label: "Days",
      render: (l) => <span className="font-semibold text-gray-700 text-sm">{l.days || "—"}</span>,
    },
    width > 800 && {
      key: "status", label: "Status",
      render: (l) => <Pill value={l.status} />,
    },
  ].filter(Boolean);

  const cardRenderer = (l, index, activeId, onToggle) => (
    <ManagementCard
      key={l.id || index}
      accent="amber"
      delay={index * 0.04}
      onClick={() => onView(l)}
      activeId={activeId}
      onToggle={onToggle}
      menuId={`lv-${l.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(l), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable
      title={l.leave_type || l.type || "Leave"}
      subtitle={`${fmtDate(l.from_date || l.from)} → ${fmtDate(l.to_date || l.to)}`}
      eyebrow="Leave Record"
      badge={<Pill value={l.status} />}
      footer={
        <div className="flex w-full items-center justify-between text-xs text-gray-400">
          <span>{l.days || "—"} day(s)</span>
          <span>{fmtDate(l.applied_on || l.applied)}</span>
        </div>
      }
    >
      {l.reason && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{l.reason}</p>}
    </ManagementCard>
  );

  return { columns, cardRenderer, rowKey: "id" };
}

function useShiftConfig(onView, width) {
  const columns = [
    {
      key: "name", label: "Shift",
      render: (s) => <span className="font-medium text-gray-800 text-sm">{s.name || s.shift_name || "—"}</span>,
    },
    {
      key: "start_time", label: "Start",
      render: (s) => <span className="text-sm text-gray-600">{s.start_time || "—"}</span>,
    },
    {
      key: "end_time", label: "End",
      render: (s) => <span className="text-sm text-gray-600">{s.end_time || "—"}</span>,
    },
    {
      key: "location", label: "Location",
      render: (s) => s.location
        ? <span className="inline-flex items-center gap-1 text-xs text-gray-500"><FaMapMarkerAlt size={10} />{s.location}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: "status", label: "Status",
      render: (s) => <Pill value={s.status} />,
    },
  ];

  const cardRenderer = (s, index, activeId, onToggle) => (
    <ManagementCard
      key={s.id || index}
      accent="violet"
      delay={index * 0.04}
      onClick={() => onView(s)}
      activeId={activeId}
      onToggle={onToggle}
      menuId={`sh-${s.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(s), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable
      title={s.name || s.shift_name || "Shift"}
      subtitle={`${s.start_time || "—"} → ${s.end_time || "—"}`}
      eyebrow="Shift Record"
      badge={<Pill value={s.status} />}
    >
      {s.location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
          <FaMapMarkerAlt size={10} className="text-violet-400" />
          {s.location}
        </div>
      )}
    </ManagementCard>
  );

  return { columns, cardRenderer, rowKey: "id" };
}

// ─── GENERIC TAB CONTENT ──────────────────────────────────────────────────────
function TabContent({ tabKey, tabLabel, employeeId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const fetchRef = useRef(false);

  const ACCENT_MAP = {
    permissions: "indigo", attendance: "blue", salary: "green",
    payroll: "emerald", leave: "amber", shift: "violet",
  };
  const accent = ACCENT_MAP[tabKey] || "indigo";

  // ── data fetch ──
  const fetchData = useCallback(async (page, limit) => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    setLoading(true);
    setWarn(false);
    try {
      const companyStr = localStorage.getItem('company');
      const companyId = companyStr ? JSON.parse(companyStr)?.id : null;

      const res = await apiCall(
        `/employees/${employeeId}?include=${tabKey}&page=${page}&limit=${limit}`,
        'GET',
        null,
        companyId
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "API error");

      const dataArr = json.data?.[tabKey] ?? json.data ?? [];
      const meta = json.meta?.[tabKey] ?? json.meta ?? {};

      setRows(Array.isArray(dataArr) ? dataArr : []);
      updatePagination({
        page: Number(meta.page ?? page),
        limit: Number(meta.limit ?? limit),
        total: Number(meta.total ?? dataArr.length),
        total_pages: Number(meta.total_pages ?? 1),
        is_last_page: meta.is_last_page ?? true,
      });
    } catch {
      setRows([]);
      setWarn(true);
      updatePagination({ page, limit, total: 0, total_pages: 1, is_last_page: true });
    } finally {
      setLoading(false);
      fetchRef.current = false;
    }
  }, [employeeId, tabKey, updatePagination]);

  useEffect(() => {
    fetchData(pagination.page, pagination.limit);
  }, [tabKey, pagination.page, pagination.limit]);

  // ── responsive width tracking ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setWindowWidth(window.innerWidth), 150);
    };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);
  const sidebarOffset = windowWidth >= 1024 ? 280 : (windowWidth >= 768 ? 80 : 0);
  const effectiveWidth = windowWidth - sidebarOffset;

  // ── config per tab ──
  const onView = (item) => setSelectedItem(item);
  const permConfig = usePermissionsConfig(onView, effectiveWidth);
  const attConfig = useAttendanceConfig(onView, effectiveWidth);
  const salConfig = useSalaryConfig(onView, effectiveWidth);
  const payConfig = usePayrollConfig(onView, effectiveWidth);
  const leaveConfig = useLeaveConfig(onView, effectiveWidth);
  const shiftConfig = useShiftConfig(onView, effectiveWidth);

  const CONFIG_MAP = {
    permissions: permConfig,
    attendance: attConfig,
    salary: salConfig,
    payroll: payConfig,
    leave: leaveConfig,
    shifts: shiftConfig,
  };
  const { columns, cardRenderer, rowKey } = CONFIG_MAP[tabKey] || permConfig;

  const getActions = (row) => [
    { label: "View Details", icon: <FaEye size={13} />, onClick: () => setSelectedItem(row), className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50" },
  ];

  return (
    <div className="space-y-4">
      {warn && (
        <p className="text-xs text-amber-500">⚠ Could not load data from API — list may be empty.</p>
      )}

      {/* View switcher + count */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{rows.length}</span>
            {pagination.total > rows.length && <> of <span className="font-semibold text-gray-800">{pagination.total}</span></>}
            {" "}{tabLabel.toLowerCase()} records
          </p>
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent={accent} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading {tabLabel.toLowerCase()}…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <FaEye size={20} className="text-gray-200" />
          </div>
          <p className="text-sm font-medium">No {tabLabel.toLowerCase()} records found</p>
        </div>
      )}

      {/* Table view */}
      {!loading && rows.length > 0 && viewMode === "table" && (
        <ManagementTable
          rows={rows}
          columns={columns}
          rowKey={rowKey}
          onRowClick={onView}
          activeId={activeMenu}
          onToggleAction={(e, id) => setActiveMenu((c) => (c === id ? null : id))}
          getActions={getActions}
          accent={accent}
          headerClassName="xsm:hidden"
        />
      )}

      {/* Card view */}
      {!loading && rows.length > 0 && viewMode === "card" && (
        <ManagementGrid viewMode={viewMode}>
          {rows.map((row, idx) =>
            cardRenderer(
              row, idx, activeMenu,
              (e, id) => setActiveMenu((c) => (c === id ? null : id))
            )
          )}
        </ManagementGrid>
      )}

      {/* Pagination */}
      {!loading && rows.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onLimitChange={changeLimit}
          className="mt-2"
        />
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            item={selectedItem}
            tabKey={tabKey}
            tabLabel={tabLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TABS PANEL ───────────────────────────────────────────────────────────────
function TabsPanel({ employeeId }) {
  const [activeTab, setActiveTab] = useState("permissions");

  const activeConf = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div className="bg-white rounded-[10px] border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div
        className="flex overflow-x-auto border-b border-slate-100"
        style={{ scrollbarWidth: "none" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 whitespace-nowrap transition-colors
              ${activeTab === t.key
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <TabContent
              tabKey={activeTab}
              tabLabel={activeConf.label}
              employeeId={employeeId}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployeeProfilePage() {
  const { employeeId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (id) => {
    if (!id) { setProfile(DEMO_PROFILE); return; }
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const companyStr = localStorage.getItem('company');
      const companyId = companyStr ? JSON.parse(companyStr)?.id : null;

      const res = await apiCall(`/employees/${id}?include=basic`, 'GET', null, companyId);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch profile details");
      // Normalise to { employee, user, company } shape
      const raw = json.data?.basic ?? json.data?.[0] ?? json.data ?? {};
      setProfile({
        employee: {
          ...raw,
          code: raw.employee_code || raw.code,
        },
        user: {
          ...raw,
          name: raw.user_name || raw.name,
        },
        company: {
          ...raw,
          name: raw.company_name || (raw.company?.name ?? '—'),
          legal_name: raw.legal_name || (raw.company?.legal_name ?? '—'),
          logo_url: raw.logo_url || raw.company?.logo_url,
          city: raw.city || raw.company?.city,
          state: raw.state || raw.company?.state,
          country: raw.country || raw.company?.country,
        },
      });
    } catch (err) {
      setError(err.message || "Failed to load profile");
      setProfile(DEMO_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(employeeId); }, [employeeId, fetchProfile]);

  return (
    <div className="min-h-screen p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-0 gap-4"
        >
          <div>
            <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Employee Profile
            </h1>
            <p className="text-xs text-gray-500 mt-1">Detailed overview of employee performance, attendance, and employment records.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <FaUserCircle className="text-indigo-500" />
              <span className="font-medium text-gray-700">Staff Member</span>
            </div>
          </div>
        </motion.div>

        {loading && (
          <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm">Fetching employee data…</span>
          </div>
        )}

        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            ⚠ {error} — showing demo data
          </div>
        )}

        <AnimatePresence>
          {profile && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3.5"
            >
              <ProfileCard data={profile} />
              <TabsPanel employeeId={profile.employee?.id ?? employeeId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
