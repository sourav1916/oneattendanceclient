import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown, FaHistory, FaEye, FaShieldAlt,
  FaClock, FaMoneyBillWave, FaCalendarAlt, FaExchangeAlt,
  FaEnvelope, FaIdCard, FaCheckCircle, FaTimesCircle,
  FaTimes, FaDollarSign, FaCalculator, FaPhone,
  FaChartBar, FaHandPaper, FaCalendarPlus, FaCalendarCheck,
  FaTag, FaBriefcase, FaMapMarkerAlt, FaNetworkWired,
  FaArrowDown, FaArrowUp, FaUmbrellaBeach, FaChevronRight,
  FaUser, FaUserCheck, FaHourglassEnd, FaExclamationCircle,
  FaComment, FaCog, FaMapPin, FaServer, FaInfoCircle,
  FaSpinner, FaSignInAlt, FaSignOutAlt, FaHourglassHalf,
  FaChevronLeft,
} from "react-icons/fa";
import apiCall from "../utils/api";
import { toast } from "react-toastify";
import Pagination, { usePagination } from "../components/PaginationComponent";
import ManagementGrid from "../components/ManagementGrid";
import ManagementViewSwitcher from "../components/ManagementViewSwitcher";
import { ManagementCard, ManagementTable, RefreshButton } from "../components/common";
import Modal from "../components/Modal";
import ModalScrollLock from "../components/ModalScrollLock";
import AttendanceLogsModal from "../components/AttendanceLogsModal";
import AttendanceTypeTabs, { getAttendanceTypeConfig } from "../components/AttendanceTypeTabs";
import ProfileAvatar from "../components/common/ProfileAvatar";
import AdvancedDateFilter from "../components/AdvancedDateFilter";
import CategoryPermissionSelector from "../components/common/CategoryPermissionSelector";
import CompanyLedger from "./CompanyLedger";

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "attendance", label: "Attendance", icon: <FaClock size={12} /> },
  { key: "permissions", label: "Permissions", icon: <FaShieldAlt size={12} /> },
  { key: "salary", label: "Salary", icon: <FaMoneyBillWave size={12} /> },
  { key: "payroll", label: "Payroll", icon: <FaCalendarAlt size={12} /> },
  { key: "shifts", label: "Shifts", icon: <FaExchangeAlt size={12} /> },
  { key: "leaves", label: "Leaves", icon: <FaUmbrellaBeach size={12} /> },
  { key: "ledger", label: "Ledger", icon: <FaChartBar size={12} /> },
];
const PROFILE_TAB_IDS = new Set(TABS.map((tab) => tab.key));
const DEFAULT_PROFILE_TAB = "attendance";

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
const PAGE_ACCENT = "from-green-600 to-emerald-600";
const inFlightRequests = new Map();

async function runDedupedRequest(key, requestFn) {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = Promise.resolve()
    .then(requestFn)
    .finally(() => { inFlightRequests.delete(key); });
  inFlightRequests.set(key, promise);
  return promise;
}

// ─── CALENDAR HELPERS (new API structure) ─────────────────────────────────────

/** Parse "HH:MM AM/PM" → total minutes since midnight */
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let [, h, m, period] = match;
  h = parseInt(h, 10);
  m = parseInt(m, 10);
  if (period.toUpperCase() === "PM" && h !== 12) h += 12;
  if (period.toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

/** Format total minutes → "Xh Ym" */
function formatMinutes(mins) {
  if (mins == null || mins < 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

/**
 * Compute worked/break time from new API structure.
 * activities: [[punch_in_obj, punch_out_obj], ...]
 * breaks:     [[break_start_obj, break_end_obj], ...]
 */
function computeWorkStats(dayData) {
  if (!dayData) return null;
  const activities = dayData.activities || [];
  const breaks = dayData.breaks || [];

  let totalWork = 0;
  let firstIn = null;
  let lastOut = null;

  activities.forEach((pair) => {
    const inTime = pair[0]?.time ? parseTime(pair[0].time) : null;
    const outTime = pair[1]?.time ? parseTime(pair[1].time) : null;
    if (inTime != null) {
      if (firstIn == null || inTime < firstIn) firstIn = inTime;
    }
    if (inTime != null && outTime != null) {
      let diff = outTime - inTime;
      if (diff < 0) diff += 24 * 60;
      totalWork += diff;
      if (lastOut == null || outTime > lastOut) lastOut = outTime;
    }
  });

  let totalBreak = 0;
  breaks.forEach((pair) => {
    const s = pair[0]?.time ? parseTime(pair[0].time) : null;
    const e = pair[1]?.time ? parseTime(pair[1].time) : null;
    if (s != null && e != null) {
      let diff = e - s;
      if (diff < 0) diff += 24 * 60;
      totalBreak += diff;
    }
  });

  const netWork = Math.max(0, totalWork - totalBreak);
  return {
    workedMinutes: netWork,
    breakMinutes: totalBreak,
    grossMinutes: totalWork,
    firstIn: firstIn != null ? minutesToTimeStr(firstIn) : null,
    lastOut: lastOut != null ? minutesToTimeStr(lastOut) : null,
    hasOpenSession: activities.some((pair) => pair[0]?.time && !pair[1]?.time),
  };
}

/** Determine display status, handling holiday/leave overlays and empty string */
function getDayStatus(dayData) {
  if (!dayData) return null;
  const s = dayData.day_status;
  if (dayData.is_holiday && (!s || s === "upcoming" || s === "")) return "holiday";
  if (dayData.is_leave) return "leave";
  if (s === "") return "present";
  return s || null;
}

// ─── CALENDAR CONSTANTS ───────────────────────────────────────────────────────

const CALENDAR_STATUS_STYLES = {
  present: {
    cell: "bg-emerald-50/60 border-emerald-100",
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
    label: "Present", dot: "bg-emerald-500", color: "text-emerald-600",
  },
  absent: {
    cell: "bg-rose-50/60 border-rose-100",
    pill: "bg-rose-100 text-rose-700 border-rose-200",
    label: "Absent", dot: "bg-rose-500", color: "text-rose-600",
  },
  holiday: {
    cell: "bg-amber-50/60 border-amber-100",
    pill: "bg-amber-100 text-amber-700 border-amber-200",
    label: "Holiday", dot: "bg-amber-500", color: "text-amber-600",
  },
  weekend: {
    cell: "bg-slate-50/60 border-slate-100",
    pill: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Weekend", dot: "bg-slate-400", color: "text-slate-500",
  },
  leave: {
    cell: "bg-violet-50/60 border-violet-100",
    pill: "bg-violet-100 text-violet-700 border-violet-200",
    label: "Leave", dot: "bg-violet-500", color: "text-violet-600",
  },
  upcoming: {
    cell: "bg-white border-gray-100",
    pill: "bg-gray-100 text-gray-500 border-gray-200",
    label: "Upcoming", dot: "bg-gray-300", color: "text-gray-400",
  },
  half_day: {
    cell: "bg-orange-50/60 border-orange-100",
    pill: "bg-orange-100 text-orange-700 border-orange-200",
    label: "Half Day", dot: "bg-orange-500", color: "text-orange-600",
  },
  not_joined: {
    cell: "bg-slate-50/30 border-slate-100 opacity-50",
    pill: "bg-slate-100 text-slate-500 border-slate-200",
    label: "Not Joined", dot: "bg-slate-300", color: "text-slate-400",
  },
};

// ─── CALENDAR CELL ────────────────────────────────────────────────────────────

const CalendarCell = ({ cell, onClick }) => {
  const { dayNumber, isCurrentMonth, data, isToday } = cell;

  if (!isCurrentMonth) {
    return (
      <div className="min-h-[100px] bg-gray-50/20 p-2 border-r border-b border-gray-100/70">
        <span className="text-xs text-gray-200 font-medium">{dayNumber}</span>
      </div>
    );
  }

  const status = getDayStatus(data);
  const styles = CALENDAR_STATUS_STYLES[status] || CALENDAR_STATUS_STYLES.upcoming;
  const workStats = (data?.activities?.length > 0) ? computeWorkStats(data) : null;

  return (
    <motion.div
      whileHover={{ scale: 1.015, zIndex: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => data?.day_status !== "not_joined" && onClick(cell)}
      className={`
        min-h-[100px] p-2.5 transition-all border-r border-b cursor-pointer
        ${styles.cell}
        ${isToday ? "ring-2 ring-indigo-400 ring-inset z-10" : ""}
      `}
    >
      {/* Day number */}
      <div className="flex items-start justify-between mb-1.5">
        <span className={`
          flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold
          ${isToday ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700"}
        `}>
          {dayNumber}
        </span>
        {data?.is_holiday && (
          <span title={data.is_holiday.name} className="text-amber-400">
            <FaUmbrellaBeach size={10} />
          </span>
        )}
      </div>

      {/* Status pill */}
      {status && (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${styles.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          {styles.label}
        </span>
      )}

      {/* Worked time */}
      {workStats && workStats.workedMinutes > 0 && (
        <div className="mt-1.5">
          <p className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
            <FaClock size={7} className="text-gray-400" />
            {formatMinutes(workStats.workedMinutes)}
          </p>
          {workStats.hasOpenSession && (
            <p className="text-[9px] text-indigo-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
              Live
            </p>
          )}
        </div>
      )}

      {/* Leave label */}
      {data?.is_leave && (
        <p className="mt-1 text-[9px] font-bold text-violet-700 truncate">
          {data.is_leave.code} • {data.is_leave.type?.replace("_", " ")}
        </p>
      )}

      {/* Holiday name */}
      {data?.is_holiday && status === "holiday" && (
        <p className="mt-1 text-[9px] text-amber-700 font-medium line-clamp-2">
          {data.is_holiday.name}
        </p>
      )}

      {/* Pending badge */}
      {data?.is_approved === false && status === "present" && (
        <p className="mt-1 text-[8px] font-bold text-orange-500 uppercase tracking-wider">Pending</p>
      )}
    </motion.div>
  );
};

// ─── CALENDAR SUMMARY CARD ────────────────────────────────────────────────────

const CalendarSummaryCard = ({ label, value, icon: Icon, type }) => {
  const styles = CALENDAR_STATUS_STYLES[type] || CALENDAR_STATUS_STYLES.upcoming;
  return (
    <div className="p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.pill}`}>
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-lg font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// ─── CALENDAR EMPLOYEE BANNER ─────────────────────────────────────────────────

const CalendarEmployeeInfo = ({ employee, shift, statistics }) => {
  if (!employee) return null;

  const pct = statistics?.expected_work_minutes > 0
    ? Math.min(100, Math.round((statistics.worked_minutes / statistics.expected_work_minutes) * 100))
    : 0;

  const workedH = statistics ? Math.floor(statistics.worked_minutes / 60) : 0;
  const workedM = statistics ? Math.round(statistics.worked_minutes % 60) : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200/60 mb-5 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <ProfileAvatar
            record={employee}
            name={employee.employee_name || employee.name}
            className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-black border border-white/30 overflow-hidden"
          >
            {(employee.employee_name || employee.name)?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || <FaUser size={20} />}
          </ProfileAvatar>
          <div>
            <h2 className="text-xl font-black tracking-tight">{employee.employee_name || employee.name || "Attendance Calendar"}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 opacity-90">
              {(employee.employee_code || employee.code) && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-lg">
                  <FaIdCard size={10} /> {employee.employee_code || employee.code}
                </span>
              )}
              {employee.designation && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-lg">
                  <FaBriefcase size={10} /> {employee.designation.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shift & stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1 mb-0.5">
              <FaSignInAlt size={9} /> Shift In
            </p>
            <p className="text-base font-black">{shift?.start_time || "--:--"}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1 mb-0.5">
              <FaSignOutAlt size={9} /> Shift Out
            </p>
            <p className="text-base font-black">{shift?.end_time || "--:--"}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1 mb-0.5">
              <FaClock size={9} /> Target
            </p>
            <p className="text-base font-black">
              {shift ? `${Math.floor(shift.expected_work_minutes / 60)}h ${shift.expected_work_minutes % 60}m` : "--"}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1 mb-0.5">
              <FaCheckCircle size={9} /> Worked
            </p>
            <p className="text-base font-black">{`${workedH}h ${workedM}m`}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {statistics && (
        <div className="relative z-10 mt-4">
          <div className="flex justify-between text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">
            <span>Monthly Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── CALENDAR DAY DETAILS MODAL ───────────────────────────────────────────────

const CalendarDayDetailsModal = ({ cell, onClose, shift }) => {
  if (!cell) return null;
  const { date, data } = cell;
  const status = getDayStatus(data);
  const workStats = data ? computeWorkStats(data) : null;

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const InfoRow = ({ label, value, icon: Icon, colorClass }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorClass}`}>
          <Icon size={12} />
        </div>
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-800">{value || "—"}</span>
    </div>
  );

  const breaks = data?.breaks || [];
  const activities = data?.activities || [];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalScrollLock />
      <motion.div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{formattedDate}</p>
            {status && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${CALENDAR_STATUS_STYLES[status]?.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${CALENDAR_STATUS_STYLES[status]?.dot}`} />
                {CALENDAR_STATUS_STYLES[status]?.label}
              </span>
            )}
            {data?.is_holiday && (
              <p className="text-xs font-bold text-amber-600 mt-1">
                {data.is_holiday.name} {data.is_holiday.is_optional ? "(Optional)" : "(Public Holiday)"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-all"
          >
            <FaTimesCircle size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Work summary */}
          {workStats && workStats.grossMinutes > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Work Summary</p>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow label="Total Work" value={formatMinutes(workStats.workedMinutes)} icon={FaClock} colorClass="bg-emerald-100 text-emerald-600" />
                <InfoRow label="Break" value={formatMinutes(workStats.breakMinutes)} icon={FaHourglassHalf} colorClass="bg-amber-100 text-amber-600" />
                <InfoRow label="First In" value={workStats.firstIn || "—"} icon={FaSignInAlt} colorClass="bg-indigo-100 text-indigo-600" />
                <InfoRow
                  label="Last Out"
                  value={workStats.lastOut || (workStats.hasOpenSession ? "Active" : "—")}
                  icon={FaSignOutAlt}
                  colorClass="bg-slate-100 text-slate-600"
                />
              </div>
              {shift && (
                <InfoRow
                  label="Expected"
                  value={formatMinutes(shift.expected_work_minutes - (shift.break_minutes || 0))}
                  icon={FaClock}
                  colorClass="bg-gray-100 text-gray-500"
                />
              )}
              {data?.is_approved === false && (
                <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-xl">
                  <FaInfoCircle size={12} className="text-orange-500" />
                  <span className="text-[11px] font-bold text-orange-600">Attendance pending approval</span>
                </div>
              )}
              {data?.is_approved === true && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <FaCheckCircle size={12} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600">Attendance approved</span>
                </div>
              )}
            </div>
          )}

          {/* Activity sessions */}
          {activities.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sessions</p>
              <div className="space-y-1.5">
                {activities.map((pair, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <FaSignInAlt size={11} />
                      <span className="font-bold">{pair[0]?.time || "—"}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <span className="font-bold">
                        {pair[1]?.time
                          ? pair[1].time
                          : <span className="text-indigo-400 animate-pulse">Active</span>
                        }
                      </span>
                      <FaSignOutAlt size={11} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Break sessions */}
          {breaks.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Breaks ({breaks.length})
              </p>
              <div className="space-y-1.5">
                {breaks.map((pair, i) => {
                  const s = pair[0]?.time ? parseTime(pair[0].time) : null;
                  const e = pair[1]?.time ? parseTime(pair[1].time) : null;
                  let dur = null;
                  if (s != null && e != null) { dur = e - s; if (dur < 0) dur += 24 * 60; }
                  return (
                    <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100 text-[11px]">
                      <span className="font-bold text-amber-700">{pair[0]?.time || "—"} → {pair[1]?.time || "—"}</span>
                      {dur != null && dur > 0 && <span className="font-black text-amber-600">{dur}m</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leave info */}
          {data?.is_leave && (
            <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-3">
                <FaInfoCircle size={20} />
              </div>
              <h4 className="text-base font-black text-violet-900">{data.is_leave.name}</h4>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mt-0.5">
                {data.is_leave.code} • {data.is_leave.type?.replace("_", " ")}
              </p>
            </div>
          )}

          {/* Fallback empty state */}
          {!workStats?.grossMinutes && !data?.is_leave && !data?.is_holiday &&
            (status === "absent" || status === "upcoming" || status === "not_joined") && (
              <div className="py-10 flex flex-col items-center text-center text-gray-300">
                <FaCalendarAlt size={40} className="mb-3 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  {status === "not_joined" ? "Not yet joined"
                    : status === "absent" ? "No attendance recorded"
                      : "Upcoming day"}
                </p>
              </div>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── EMPLOYEE ATTENDANCE CALENDAR ─────────────────────────────────────────────

function EmployeeAttendanceCalendar({ employee, fallbackId, refreshKey = 0 }) {
  const employeeId = employee?.id || fallbackId;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const lastFetchedKeyRef = useRef(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const fetchCalendar = useCallback(async (m, y) => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const companyStr = localStorage.getItem("company");
      const companyId = companyStr ? JSON.parse(companyStr)?.id : null;
      const response = await apiCall(
        `/shifts/my-calendar?employee_id=${employeeId}&month=${m}&year=${y}`,
        "GET", null, companyId
      );
      const json = await response.json();
      if (json.success) {
        setData({ ...json.data, meta: json.meta });
      } else {
        setError(json.message || "Failed to fetch calendar");
        toast.error(json.message || "Failed to fetch calendar");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Could not connect to the server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const fetchKey = `${employeeId}-${month}-${year}-${refreshKey}`;
    if (lastFetchedKeyRef.current === fetchKey) return;
    lastFetchedKeyRef.current = fetchKey;
    fetchCalendar(month, year);
  }, [employeeId, fetchCalendar, month, year, refreshKey]);

  const navigateMonth = (dir) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  };

  // Build 42-cell grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const today = new Date();
    const grid = [];

    for (let i = 0; i < 42; i++) {
      let dateObj;
      let isCurrentMonth = true;

      if (i < firstDay) {
        dateObj = new Date(year, month - 2, prevMonthDays - (firstDay - i - 1));
        isCurrentMonth = false;
      } else if (i >= firstDay + daysInMonth) {
        dateObj = new Date(year, month, i - (firstDay + daysInMonth) + 1);
        isCurrentMonth = false;
      } else {
        dateObj = new Date(year, month - 1, i - firstDay + 1);
      }

      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
      grid.push({
        date: dateObj,
        dayNumber: dateObj.getDate(),
        isCurrentMonth,
        data: data?.days?.[dateStr] || null,
        isToday: today.toDateString() === dateObj.toDateString(),
      });
    }
    return grid;
  }, [data, month, year]);

  // Derived from new API structure
  const meta = data?.meta || {};
  const shift = data?.shift || null;
  const statistics = data?.statistics || null;

  return (
    <div className="max-w-screen-2xl mx-auto pb-8">

      {/* Employee banner with shift info from new API */}
      <CalendarEmployeeInfo employee={employee} shift={shift} statistics={statistics} />

      {/* Header row: month nav + legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
          >
            <FaChevronLeft size={11} />
          </button>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight min-w-[180px] text-center">
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
          >
            <FaChevronRight size={11} />
          </button>
          <AdvancedDateFilter
            value={{ month, year }}
            onChange={(filter) => filter.month && filter.year && setCurrentDate(new Date(filter.year, filter.month - 1, 1))}
            tabOptions={["month"]}
            placeholder="Jump to month"
            buttonClassName="bg-white border border-gray-100 px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-bold text-gray-600 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["present", "absent", "holiday", "leave", "half_day"].map((s) => (
            <div key={s} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
              <span className={`w-2 h-2 rounded-full ${CALENDAR_STATUS_STYLES[s].dot}`} />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{CALENDAR_STATUS_STYLES[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row — from data.meta */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-4">
        <CalendarSummaryCard label="Total" value={meta.total_days || 0} icon={FaCalendarAlt} type="upcoming" />
        <CalendarSummaryCard label="Present" value={meta.present || 0} icon={FaCheckCircle} type="present" />
        <CalendarSummaryCard label="Absent" value={meta.absent || 0} icon={FaTimesCircle} type="absent" />
        <CalendarSummaryCard label="Leave" value={meta.leave || 0} icon={FaInfoCircle} type="leave" />
        <CalendarSummaryCard label="Holiday" value={meta.holiday || 0} icon={FaUmbrellaBeach} type="holiday" />
        <CalendarSummaryCard label="Weekend" value={meta.weekend || 0} icon={FaCalendarAlt} type="weekend" />
        <CalendarSummaryCard label="Half Day" value={meta.half_day || 0} icon={FaHourglassHalf} type="half_day" />
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest animate-pulse">Loading…</p>
            </div>
          </div>
        )}

        {/* Days-of-week header */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center">
              <span className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}urday</span>
              <span className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 bg-gray-100/50 gap-px">
          {error ? (
            <div className="col-span-7 py-24 bg-white flex flex-col items-center gap-4 text-rose-400">
              <FaTimesCircle size={40} className="opacity-30" />
              <p className="font-black uppercase tracking-widest text-sm">{error}</p>
              <button
                onClick={() => fetchCalendar(month, year)}
                className="px-5 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            calendarGrid.map((cell, idx) => (
              <CalendarCell key={idx} cell={cell} onClick={setSelectedCell} />
            ))
          )}
        </div>
      </div>

      {/* Day detail modal */}
      <AnimatePresence>
        {selectedCell && (
          <CalendarDayDetailsModal
            cell={selectedCell}
            onClose={() => setSelectedCell(null)}
            shift={shift}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ProfileHub ───────────────────────────────────────────────────────────────

function ProfileHub({
  eyebrow, title, description, accent = "slate",
  summary, actions, tabs = [], activeTab, onTabChange, children,
}) {
  const ACCENT_COLORS = {
    slate: { active: "#444441", border: "#444441" },
    green: { active: "#3B6D11", border: "#3B6D11" },
    blue: { active: "#185FA5", border: "#185FA5" },
    indigo: { active: "#534AB7", border: "#534AB7" },
    amber: { active: "#854F0B", border: "#854F0B" },
  };
  const { active: activeColor } = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
        >
          {/* ── Top row: title + summary ── */}
          <div className="flex flex-col items-start justify-between gap-4 px-5 pt-4 pb-4 border-b border-gray-100">
            {/* Left: avatar + text */}
            <div className="flex items-center gap-3 min-w-0">
              {/* small inline avatar */}
              {summary && (
                <div className="shrink-0 flex-col hidden sm:block">
                  {/* summary contains the big avatar — we show a compact version here */}
                </div>
              )}
              <div className="min-w-0">
                {eyebrow && (
                  <div className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] from-blue-600 to-indigo-600 text-blue-700 border-blue-200">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h1 className="text-base font-bold text-slate-900 truncate leading-snug">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                )}
              </div>
            </div>

            {/* Right: summary (avatar + meta) */}
            {(summary || actions) && (
              <div className="w-full flex items-center justify-between gap-3">
                {summary}
                {actions}
              </div>
            )}
          </div>

          {/* ── Tab bar ── */}
          {tabs?.length > 0 && (
            <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const isDisabled = tab.disabled || false;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => !isDisabled && onTabChange?.(tab.id)}
                    disabled={isDisabled}
                    title={tab.title || tab.label}
                    style={isActive ? { color: activeColor, borderBottomColor: activeColor } : {}}
                    className={[
                      "inline-flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium",
                      "border-b-2 whitespace-nowrap transition-colors duration-150",
                      "-mb-px",   /* sits flush on the border-b of the container */
                      isActive
                        ? "border-current"
                        : isDisabled
                          ? "border-transparent text-slate-300 cursor-not-allowed"
                          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
                    ].join(" ")}
                  >
                    {tab.icon
                      ? (typeof tab.icon === "function" ? <tab.icon size={12} /> : tab.icon)
                      : null}
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="px-1 lg:px-0">{children}</div>
      </div>
    </div>
  );
}

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
  earning: "bg-emerald-100 text-emerald-800",
  deduction: "bg-rose-100 text-rose-800",
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

function DetailModal({ isOpen, onClose, item, tabKey, tabLabel, subType = "attendance" }) {
  const attendanceTypeConfig = getAttendanceTypeConfig(subType);
  if (!isOpen || !item) return null;

  const renderFields = () => {
    if (tabKey === "basic") {
      return (
        <div className="space-y-2">
          <Field label="ID" value={item.id ?? item.employee_id} />
          <Field label="Name" value={item.name || item.user_name || item.employee_name} highlight />
          <Field label="Code" mono value={item.code || item.employee_code} />
          <Field label="Email" value={item.email || item.user_email} />
          <Field label="Phone" value={item.phone || item.mobile || "—"} />
          <Field label="Designation" value={item.designation} />
          <Field label="Employment Type" value={item.employment_type} />
          <Field label="Salary Type" value={item.salary_type} />
          <Field label="Status" value={<Pill value={item.status} />} />
          <Field label="Joining Date" value={fmtDate(item.joining_date)} />
          <Field label="Created At" value={fmtDateTime(item.created_at)} />
        </div>
      );
    }
    if (tabKey === "permissions") {
      return (
        <div className="space-y-2">
          <Field label="ID" value={item.id} />
          <Field label="Permission Name" value={item.name} highlight />
          <Field label="Code" mono value={item.code} />
        </div>
      );
    }
    if (tabKey === "attendance") {
      const shift = item.shift || {};
      const flags = shift.flags || {};
      const isOvertime = flags.overtime?.enabled || item.is_overtime || false;
      const isHalfDay = flags.half_day?.enabled || item.is_half_day || false;
      const isDeductible = flags.deductible?.enabled || item.is_deductible || false;

      const formatMins = (m) => {
        if (m === null || m === undefined) return "0m";
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      };

      return (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FaInfoCircle className="text-blue-500" /> Summary & Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date</label>
                <p className="font-medium text-gray-800 text-sm">{fmtDate(item.attendance_date)}</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Status</label>
                <div className="mt-0.5"><Pill value={item.status || (item.is_verified ? "Verified" : "Pending")} /></div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Verification</label>
                <p className="font-medium text-gray-800 text-sm">{item.is_verified ? "Verified Record" : "Unverified"}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FaClock className="text-indigo-500" /> {attendanceTypeConfig.label} Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{attendanceTypeConfig.startLabel}</label>
                <p className="font-medium text-gray-800 text-sm">{item.start_time || "—"}</p>
                {item.punch_in_method && <p className="text-[9px] font-bold uppercase text-slate-400">{fmt(item.punch_in_method)}</p>}
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{attendanceTypeConfig.endLabel}</label>
                <p className="font-medium text-gray-800 text-sm">{item.end_time || "—"}</p>
                {item.punch_out_method && <p className="text-[9px] font-bold uppercase text-slate-400">{fmt(item.punch_out_method)}</p>}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FaUserCheck className="text-emerald-500" /> Shift & Productivity
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Worked Time</label>
                <p className="mt-0.5 text-sm font-bold text-emerald-600">{formatMins(shift.worked_minutes || item.worked_minutes)}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Break Time</label>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatMins(shift.break_minutes || item.break_minutes)}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shift Start</label>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {shift.shift_start_time ? new Date(shift.shift_start_time.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shift End</label>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {shift.shift_end_time ? new Date(shift.shift_end_time.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FaBriefcase className="text-indigo-500" /> Productivity Flags
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${isOvertime ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOvertime ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                  <FaClock size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Overtime</p>
                  <p className={`text-xs font-bold ${isOvertime ? "text-emerald-700" : "text-slate-500"}`}>
                    {isOvertime ? `${flags.overtime?.minutes || item.overtime_minutes || 0} mins` : "Disabled"}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${isHalfDay ? "border-orange-200 bg-orange-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHalfDay ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                  <FaHourglassEnd size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Half Day</p>
                  <p className={`text-xs font-bold ${isHalfDay ? "text-orange-700" : "text-slate-500"}`}>{isHalfDay ? "Yes" : "No"}</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${isDeductible ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeductible ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                  <FaExclamationCircle size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Deductible</p>
                  <p className={`text-xs font-bold ${isDeductible ? "text-rose-700" : "text-slate-500"}`}>
                    {isDeductible ? `${flags.deductible?.minutes || item.deductible_minutes || 0} mins` : "None"}
                  </p>
                </div>
              </div>
            </div>
            {isDeductible && flags.deductible?.breakdown && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-3">Deductible Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[9px] font-bold uppercase text-slate-400 block">Late</label><p className="text-sm font-bold text-rose-700">{flags.deductible.breakdown.late_minutes}m</p></div>
                  <div><label className="text-[9px] font-bold uppercase text-slate-400 block">Early Leave</label><p className="text-sm font-bold text-rose-700">{flags.deductible.breakdown.early_leave_minutes}m</p></div>
                  <div><label className="text-[9px] font-bold uppercase text-slate-400 block">Extra Break</label><p className="text-sm font-bold text-rose-700">{flags.deductible.breakdown.extra_break_minutes}m</p></div>
                </div>
              </div>
            )}
          </div>

          {item.remark && (
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><FaComment className="text-amber-500" /> Remarks</h3>
              <p className="font-medium text-gray-700 text-xs italic p-3 bg-gray-50 rounded-lg border border-gray-100">"{item.remark}"</p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-4">
            <div className="flex items-start gap-4 border-b border-slate-200 pb-4">
              <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 flex-shrink-0">
                <FaMapMarkerAlt size={14} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Device & Location Punches</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Punch In</p>
                    <p className="text-xs font-semibold text-slate-700">IP: {item.punch_in_ip || "—"}</p>
                    <p className="text-xs font-semibold text-slate-700">GPS: {item.punch_in_latitude && item.punch_in_longitude ? `${item.punch_in_latitude}, ${item.punch_in_longitude}` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Punch Out</p>
                    <p className="text-xs font-semibold text-slate-700">IP: {item.punch_out_ip || "—"}</p>
                    <p className="text-xs font-semibold text-slate-700">GPS: {item.punch_out_latitude && item.punch_out_longitude ? `${item.punch_out_latitude}, ${item.punch_out_longitude}` : "—"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 h-8 w-8 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 flex-shrink-0">
                <FaCog size={14} />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">System Audit</span>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">ID: {item.id || item.punch_id}</span>
                  {item.reviewed_at && <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 border border-slate-200">Reviewed At: {fmtDateTime(item.reviewed_at)}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (tabKey === "salary") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Field label="ID" value={item.id ?? item.salary_id} />
            <Field label="Base Amount" value={`${item.currency?.toUpperCase() || "INR"} ${Number(item.base_amount || 0).toLocaleString()}`} highlight />
            <Field label="Effective From" value={fmtDate(item.effective_from)} />
            <Field label="Effective To" value={fmtDate(item.effective_to)} />
          </div>
          {item.components && item.components.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Components ({item.components.length})</h4>
              <div className="space-y-2">
                {item.components.map((c, idx) => (
                  <div key={c.component_id || idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="font-semibold text-gray-700">{c.name}</span>
                      <Pill value={c.type} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-gray-500 mt-1">
                      <div>Type: <span className="capitalize text-gray-700">{c.calc_type}</span></div>
                      <div>Value: <span className="text-gray-700 font-medium">{Number(c.calc_value).toString()}{c.calc_type === "percentage" ? "%" : ""}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (tabKey === "payroll") {
      return (
        <div className="space-y-2">
          <Field label="ID" value={item.id} />
          <Field label="Payroll Period" value={fmtDate(item.payroll_period || item.period || item.month)} highlight />
          <Field label="Total Earnings" value={item.total_earnings || item.gross_amount || item.gross} />
          <Field label="Total Deductions" value={item.total_deductions || item.deductions} />
          <Field label="Net Salary" value={item.net_salary || item.net_pay || item.net} />
          <Field label="Status" value={<Pill value={item.status} />} />
        </div>
      );
    }
    if (tabKey === "leaves") {
      return (
        <div className="space-y-2">
          <Field label="ID" value={item.id} />
          <Field label="Leave Type" value={item.leave_type || item.type} highlight />
          <Field label="Start Date" value={fmtDate(item.start_date || item.from_date || item.from)} />
          <Field label="End Date" value={fmtDate(item.end_date || item.to_date || item.to)} />
          <Field label="Total Days" value={formatDays(item.total_days || item.days)} />
          <Field label="Status" value={<Pill value={item.status} />} />
          <Field label="Reason" value={item.reason} />
          <Field label="Attachments" value={Array.isArray(item.attachments) ? `${item.attachments.length} file(s)` : "—"} />
        </div>
      );
    }
    if (tabKey === "shifts") {
      const formatMins = (m) => {
        if (m === null || m === undefined) return "0m";
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      };
      return (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><FaExchangeAlt className="text-violet-500" /> Shift Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date</label><p className="font-bold text-gray-800 text-sm">{fmtDate(item.shift_date)}</p></div>
              <div><label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Start Time</label><p className="font-medium text-gray-800 text-sm">{item.start_time ? new Date(item.start_time.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
              <div><label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">End Time</label><p className="font-medium text-gray-800 text-sm">{item.end_time ? new Date(item.end_time.replace(" ", "T")).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</p></div>
            </div>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><FaUserCheck className="text-emerald-500" /> Productivity Breakdown</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Worked Time</label><p className="mt-0.5 text-sm font-bold text-emerald-600">{formatMins(item.worked_minutes)}</p></div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Break Time</label><p className="mt-0.5 text-sm font-semibold text-slate-800">{formatMins(item.break_minutes)}</p></div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Late</label><p className="mt-0.5 text-sm font-semibold text-rose-600">{formatMins(item.late_minutes)}</p></div>
              <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Early Leave</label><p className="mt-0.5 text-sm font-semibold text-amber-600">{formatMins(item.early_leave_minutes)}</p></div>
            </div>
          </div>
          <div className="border-b border-gray-100 pb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><FaBriefcase className="text-indigo-500" /> Productivity Flags</h3>
            <div className="flex flex-wrap gap-3">
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${item.overtime_minutes > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.overtime_minutes > 0 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}><FaClock size={14} /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Overtime</p><p className={`text-xs font-bold ${item.overtime_minutes > 0 ? "text-emerald-700" : "text-slate-500"}`}>{item.overtime_minutes > 0 ? `${item.overtime_minutes} mins` : "None"}</p></div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${item.is_half_day ? "border-orange-200 bg-orange-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.is_half_day ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-400"}`}><FaHourglassEnd size={14} /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Half Day</p><p className={`text-xs font-bold ${item.is_half_day ? "text-orange-700" : "text-slate-500"}`}>{item.is_half_day ? "Yes" : "No"}</p></div>
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-3 ${item.is_deductible ? "border-rose-200 bg-rose-50" : "border-slate-100 bg-slate-50 opacity-60"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.is_deductible ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"}`}><FaExclamationCircle size={14} /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Deductible</p><p className={`text-xs font-bold ${item.is_deductible ? "text-rose-700" : "text-slate-500"}`}>{item.is_deductible ? "Yes" : "No"}</p></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return Object.entries(item).map(([k, v]) => (
      <Field key={k} label={fmt(k)} value={typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")} />
    ));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${tabLabel} Details`}
      subtitle="Record information and detailed logs"
      size={(tabKey === "attendance" || tabKey === "shifts") ? "4xl" : "md"}
      footer={
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Close
        </button>
      }
    >
      {renderFields()}
    </Modal>
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

// ─── PROFILE HEADER SUMMARY ───────────────────────────────────────────────────

function ProfileHeaderSummary({ data }) {
  const { employee: e, user: u } = data;
  return (
    <div className="flex items-center gap-3">

      {/* Avatar */}
      <ProfileAvatar
        record={u}
        name={u.name}
        className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${avatarGradient(u.id)}
          flex items-center justify-center text-base font-bold text-white overflow-hidden select-none`}
      >
        {getInitials(u.name)}
      </ProfileAvatar>

      {/* Meta column */}
      <div className="text-right hidden sm:block">
        {/* Status badges */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <Pill value={e.status} />
          <Pill value={e.employment_type} />
          <Pill value={e.salary_type} />
        </div>
        {/* Code */}
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 mb-1">
          <FaIdCard size={10} className="shrink-0" />
          {e.code || e.employee_code || "—"}
        </p>
        {/* Designation */}
        <p className="flex items-center gap-1.5 text-xs text-slate-600 mb-0.5">
          <FaBriefcase size={10} className="shrink-0 text-emerald-500" />
          {fmt(e.designation)}
        </p>
        {/* Email */}
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <FaEnvelope size={10} className="shrink-0 text-blue-400" />
          <span className="truncate max-w-[180px]">{u.email || "—"}</span>
        </p>
        {/* Phone */}
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <FaPhone size={10} className="shrink-0 text-emerald-400" />
          {u.phone || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── TAB CONTENT CONFIGS ──────────────────────────────────────────────────────

function usePermissionsConfig(onView, width) {
  const columns = [
    {
      key: "name", label: "Permission",
      render: (p) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <FaShieldAlt size={11} className="text-indigo-500" />
          </div>
          <span className="font-medium text-gray-800 text-sm truncate min-w-0">{p.name || "—"}</span>
        </div>
      ),
    },
    width > 600 && {
      key: "code", label: "Code",
      render: (p) => <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{p.code || "—"}</span>,
    },
    width > 800 && {
      key: "category", label: "Category",
      render: (p) => { const cat = p.code?.split("_")?.[0] || "unknown"; return <Pill value={cat} />; },
    },
  ].filter(Boolean);

  const cardRenderer = (p, index, activeId, onToggle) => {
    const cat = p.code?.split("_")?.[0] || "unknown";
    return (
      <ManagementCard key={p.id} accent="indigo" delay={index * 0.04} onClick={() => onView(p)} activeId={activeId} onToggle={onToggle} menuId={`perm-${p.id}`}
        actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(p), className: "text-blue-600 hover:bg-blue-50" }]}
        hoverable title={p.name || "Permission"} subtitle={p.code || "No code"} eyebrow={fmt(cat)} badge={<Pill value={cat} />}
      >
        <div className="flex items-center gap-2 mt-1"><FaShieldAlt size={11} className="text-indigo-400" /><span className="text-xs text-gray-500 font-mono">{p.code || "—"}</span></div>
      </ManagementCard>
    );
  };
  return { columns, cardRenderer, rowKey: "id" };
}

function useAttendanceConfig(onView, onViewLogs, width, subType = "attendance") {
  const typeMeta = getAttendanceTypeConfig(subType);
  const columns = [
    { key: "attendance_date", label: "Date", render: (a) => <span className="text-sm font-medium text-gray-800">{fmtDate(a.attendance_date)}</span> },
    {
      key: "start_time", label: typeMeta.startLabel,
      render: (a) => <div className="flex flex-col"><span className="text-sm text-gray-700 font-medium">{a.start_time || "—"}</span><span className="text-[10px] text-gray-400 uppercase font-bold">{fmt(a.punch_in_method)}</span></div>,
    },
    {
      key: "end_time", label: typeMeta.endLabel,
      render: (a) => <div className="flex flex-col"><span className="text-sm text-gray-700 font-medium">{a.end_time || "—"}</span>{a.punch_out_method && <span className="text-[10px] text-gray-400 uppercase font-bold">{fmt(a.punch_out_method)}</span>}</div>,
    },
    width > 600 && {
      key: "flags", label: "Status",
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {a.is_verified ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><FaCheckCircle size={8} /> Verified</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Pending</span>}
          {a.is_overtime && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">Overtime</span>}
          {a.is_half_day && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">Half Day</span>}
        </div>
      ),
    },
    width > 900 && { key: "breaks", label: "Breaks", render: (a) => <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{a.breaks?.length || 0}</span> },
  ].filter(Boolean);

  const cardRenderer = (a, index, activeId, onToggle) => (
    <ManagementCard key={a.id} accent="blue" delay={index * 0.04} onClick={() => onView(a)} activeId={activeId} onToggle={onToggle} menuId={`att-${a.id}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(a), className: "text-blue-600 hover:bg-blue-50" }, { label: "View History", icon: <FaHistory size={12} />, onClick: () => onViewLogs(a), className: "text-emerald-600 hover:bg-emerald-50" }]}
      hoverable title={fmtDate(a.attendance_date)} subtitle={`${a.start_time || "—"} → ${a.end_time || "—"}`} eyebrow="Attendance Record"
      badge={<div className="flex gap-1">{a.is_verified && <FaCheckCircle className="text-emerald-500" size={12} />}{a.is_overtime && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-full font-bold">OT</span>}{a.is_half_day && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">HD</span>}</div>}
    >
      <div className="flex gap-2 flex-wrap mt-1">
        <Pill value={a.punch_in_method} />
        {a.breaks?.length > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{a.breaks.length} Break(s)</span>}
      </div>
    </ManagementCard>
  );
  return { columns, cardRenderer, rowKey: "id" };
}

function useSalaryConfig(onView, width) {
  const columns = [
    { key: "salary_id", label: "Salary ID", render: (s) => <span className="inline-flex whitespace-nowrap rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 font-mono">#{s.salary_id || s.id || "—"}</span> },
    { key: "base_amount", label: "Base Amount", render: (s) => <span className="font-semibold text-gray-800 text-sm">{s.currency?.toUpperCase() || "INR"} {Number(s.base_amount || 0).toLocaleString()}</span> },
    width > 600 && { key: "effective_from", label: "Effective From", render: (s) => <span className="text-sm text-gray-600">{fmtDate(s.effective_from)}</span> },
    width > 1000 && { key: "effective_to", label: "Effective To", render: (s) => <span className="text-sm text-gray-600">{fmtDate(s.effective_to)}</span> },
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
    const sid = s.salary_id || s.id;
    return (
      <ManagementCard key={sid || index} accent="green" delay={index * 0.04} onClick={() => onView(s)} activeId={activeId} onToggle={onToggle} menuId={`sal-${sid || index}`}
        actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(s), className: "text-blue-600 hover:bg-blue-50" }]}
        hoverable title={`Salary Record #${sid || ""}`} subtitle={`Effective: ${fmtDate(s.effective_from)} → ${fmtDate(s.effective_to)}`} eyebrow="Salary Record"
        badge={active ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FaCheckCircle size={10} />Active</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><FaTimesCircle size={10} />Expired</span>}
        footer={<div className="flex w-full items-center justify-between text-xs text-gray-400"><span>{s.currency?.toUpperCase() || "INR"}</span><span>{fmtDate(s.effective_from)}</span></div>}
      >
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
          <p className="text-sm font-bold text-blue-700">{s.currency?.toUpperCase() || "INR"} {Number(s.base_amount || 0).toLocaleString()}</p>
          <p className="text-xs text-blue-500 mt-0.5">Base Amount</p>
        </div>
      </ManagementCard>
    );
  };
  return { columns, cardRenderer, rowKey: (row, idx) => row.salary_id || row.id || `sal-${idx}` };
}

function usePayrollConfig(onView, width) {
  const columns = [
    { key: "payroll_period", label: "Payroll Period", render: (p) => <span className="font-medium text-gray-800 text-sm">{fmtDate(p.payroll_period || p.period || p.month)}</span> },
    width > 480 && { key: "total_earnings", label: "Total Earnings", render: (p) => <span className="text-sm text-gray-700">{p.total_earnings || p.gross_amount || p.gross || "—"}</span> },
    width > 800 && { key: "total_deductions", label: "Total Deductions", render: (p) => <span className="text-sm text-rose-600">{p.total_deductions || p.deductions || "—"}</span> },
    { key: "net_salary", label: "Net Salary", render: (p) => <span className="inline-flex whitespace-nowrap rounded-lg bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{p.net_salary || p.net_pay || p.net || "—"}</span> },
    width > 1000 && { key: "status", label: "Status", render: (p) => <Pill value={p.status} /> },
  ].filter(Boolean);

  const cardRenderer = (p, index, activeId, onToggle) => (
    <ManagementCard key={p.id || index} accent="emerald" delay={index * 0.04} onClick={() => onView(p)} activeId={activeId} onToggle={onToggle} menuId={`pay-${p.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(p), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable title={fmtDate(p.payroll_period || p.period || p.month) || "Payroll"} subtitle={`Earnings: ${p.total_earnings || p.gross_amount || p.gross || "—"} · Deductions: ${p.total_deductions || p.deductions || "—"}`} eyebrow="Payroll Record" badge={<Pill value={p.status} />}
    >
      <div className="grid grid-cols-3 gap-2 text-center mt-1">
        {[["Earnings", p.total_earnings || p.gross_amount || p.gross, "blue"], ["Deductions", p.total_deductions || p.deductions, "red"], ["Net", p.net_salary || p.net_pay || p.net, "green"]].map(([lbl, val, clr]) => (
          <div key={lbl} className={`rounded-xl border border-${clr}-100 bg-${clr}-50 p-2`}>
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
    { key: "leave_type", label: "Leave Type", render: (l) => <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{l.leave_type || l.type || "—"}</span> },
    width > 600 && { key: "start_date", label: "Start Date", render: (l) => <span className="text-sm text-gray-600">{fmtDate(l.start_date || l.from_date || l.from)}</span> },
    width > 600 && { key: "end_date", label: "End Date", render: (l) => <span className="text-sm text-gray-600">{fmtDate(l.end_date || l.to_date || l.to)}</span> },
    { key: "total_days", label: "Total Days", render: (l) => <span className="font-semibold text-gray-700 text-sm">{formatDays(l.total_days || l.days)}</span> },
    width > 800 && { key: "status", label: "Status", render: (l) => <Pill value={l.status} /> },
  ].filter(Boolean);

  const cardRenderer = (l, index, activeId, onToggle) => (
    <ManagementCard key={l.id || index} accent="amber" delay={index * 0.04} onClick={() => onView(l)} activeId={activeId} onToggle={onToggle} menuId={`lv-${l.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(l), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable title={l.leave_type || l.type || "Leave"} subtitle={`${fmtDate(l.start_date || l.from_date || l.from)} → ${fmtDate(l.end_date || l.to_date || l.to)}`} eyebrow="Leave Record" badge={<Pill value={l.status} />}
      footer={<div className="flex w-full items-center justify-between text-xs text-gray-400"><span>{formatDays(l.total_days || l.days)} day(s)</span><span>{Array.isArray(l.attachments) ? `${l.attachments.length} attachment(s)` : "No attachments"}</span></div>}
    >
      {l.reason && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{l.reason}</p>}
    </ManagementCard>
  );
  return { columns, cardRenderer, rowKey: "id" };
}

function useShiftConfig(onView, width) {
  const columns = [
    { key: "shift_date", label: "Date", render: (s) => <span className="font-medium text-gray-800 text-sm">{fmtDate(s.shift_date)}</span> },
    {
      key: "start_time", label: "Timing",
      render: (s) => <span className="text-sm text-gray-700 font-medium">{s.start_time ? new Date(s.start_time.replace(" ", "T")).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}{" → "}{s.end_time ? new Date(s.end_time.replace(" ", "T")).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>,
    },
    { key: "worked_minutes", label: "Worked", render: (s) => <span className="text-sm text-emerald-600 font-semibold">{s.worked_minutes} <span className="text-[10px] text-gray-400 uppercase">mins</span></span> },
    width > 700 && {
      key: "late_early", label: "Late/Early",
      render: (s) => <div className="flex gap-2">{s.late_minutes > 0 && <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">Late: {s.late_minutes}m</span>}{s.early_leave_minutes > 0 && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">Early: {s.early_leave_minutes}m</span>}</div>,
    },
    {
      key: "status", label: "Status",
      render: (s) => <div className="flex gap-1">{s.is_half_day && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">Half Day</span>}{s.is_deductible && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Deductible</span>}{!s.is_half_day && !s.is_deductible && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Full Day</span>}</div>,
    },
  ].filter(Boolean);

  const cardRenderer = (s, index, activeId, onToggle) => (
    <ManagementCard key={s.id || index} accent="violet" delay={index * 0.04} onClick={() => onView(s)} activeId={activeId} onToggle={onToggle} menuId={`sh-${s.id || index}`}
      actions={[{ label: "View Details", icon: <FaEye size={12} />, onClick: () => onView(s), className: "text-blue-600 hover:bg-blue-50" }]}
      hoverable title={fmtDate(s.shift_date)} subtitle={`${s.worked_minutes} mins worked`} eyebrow="Shift Record"
      badge={<div className="flex gap-1">{s.is_half_day && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full font-bold">HD</span>}{s.is_deductible && <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 rounded-full font-bold">D</span>}</div>}
    >
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs"><span className="text-gray-400">Start:</span><span className="text-gray-700 font-medium">{s.start_time ? new Date(s.start_time.replace(" ", "T")).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-400">End:</span><span className="text-gray-700 font-medium">{s.end_time ? new Date(s.end_time.replace(" ", "T")).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span></div>
        {(s.late_minutes > 0 || s.early_leave_minutes > 0) && (
          <div className="flex gap-2 mt-2">
            {s.late_minutes > 0 && <span className="text-[9px] text-rose-500 font-bold">Late: {s.late_minutes}m</span>}
            {s.early_leave_minutes > 0 && <span className="text-[9px] text-amber-500 font-bold">Early: {s.early_leave_minutes}m</span>}
          </div>
        )}
      </div>
    </ManagementCard>
  );
  return { columns, cardRenderer, rowKey: "id" };
}

// ─── GENERIC TAB CONTENT ──────────────────────────────────────────────────────

function TabContent({ tabKey, tabLabel, employeeId, refreshKey = 0 }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedLogItem, setSelectedLogItem] = useState(null);
  const [subType, setSubType] = useState("attendance");
  const { pagination, updatePagination, goToPage, changeLimit } = usePagination(1, 10);
  const fetchRef = useRef(false);
  const mountedRef = useRef(false);
  const normalizedTabKey = tabKey === "leave" ? "leaves" : tabKey === "shift" ? "shifts" : tabKey;
  const isAttendance = normalizedTabKey === "attendance";

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const ACCENT_MAP = { basic: "slate", permissions: "indigo", attendance: "blue", salary: "green", payroll: "emerald", leaves: "amber", shifts: "violet" };
  const accent = ACCENT_MAP[normalizedTabKey] || "indigo";

  const fetchData = useCallback(async (page, limit) => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    try {
      if (mountedRef.current) { setLoading(true); setWarn(false); }
      const { res, json } = await runDedupedRequest(
        `employee:${employeeId}:tab:${normalizedTabKey}:sub:${isAttendance ? subType : "none"}:page:${page}:limit:${limit}`,
        async () => {
          const companyStr = localStorage.getItem("company");
          const companyId = companyStr ? JSON.parse(companyStr)?.id : null;
          const response = await apiCall(`/employees/${employeeId}?include=${normalizedTabKey}${isAttendance ? `&sub-tab=${subType}` : ""}&page=${page}&limit=${limit}`, "GET", null, companyId);
          const data = await response.json();
          return { res: response, json: data };
        }
      );
      if (!res.ok || !json.success) throw new Error(json.message || "API error");
      const rawData = json.data?.[normalizedTabKey] ?? json.data?.[tabKey] ?? json.data ?? [];
      const dataArr = Array.isArray(rawData) ? rawData : rawData && typeof rawData === "object" ? [rawData] : [];
      const meta = json.meta?.[normalizedTabKey] ?? json.meta?.[tabKey] ?? json.meta ?? {};
      if (mountedRef.current) {
        setRows(Array.isArray(dataArr) ? dataArr : []);
        updatePagination({ page: Number(meta.page ?? page), limit: Number(meta.limit ?? limit), total: Number(meta.total ?? dataArr.length), total_pages: Number(meta.total_pages ?? 1), is_last_page: meta.is_last_page ?? true });
      }
    } catch {
      if (mountedRef.current) { setRows([]); setWarn(true); updatePagination({ page, limit, total: 0, total_pages: 1, is_last_page: true }); }
    } finally {
      if (mountedRef.current) setLoading(false);
      fetchRef.current = false;
    }
  }, [employeeId, isAttendance, subType, normalizedTabKey, tabKey, updatePagination]);

  useEffect(() => {
    const page = normalizedTabKey === "permissions" ? 1 : pagination.page;
    const limit = normalizedTabKey === "permissions" ? 1000 : pagination.limit;
    fetchData(page, limit);
  }, [normalizedTabKey, subType, pagination.page, pagination.limit, refreshKey]);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setWindowWidth(window.innerWidth), 150); };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, []);
  const sidebarOffset = windowWidth >= 1024 ? 280 : (windowWidth >= 768 ? 80 : 0);
  const effectiveWidth = windowWidth - sidebarOffset;

  const onView = (item) => setSelectedItem(item);
  const onViewLogs = (item) => setSelectedLogItem(item);
  const permConfig = usePermissionsConfig(onView, effectiveWidth);
  const attConfig = useAttendanceConfig(onView, onViewLogs, effectiveWidth, subType);
  const salConfig = useSalaryConfig(onView, effectiveWidth);
  const payConfig = usePayrollConfig(onView, effectiveWidth);
  const leaveConfig = useLeaveConfig(onView, effectiveWidth);
  const shiftConfig = useShiftConfig(onView, effectiveWidth);

  const CONFIG_MAP = { permissions: permConfig, attendance: attConfig, salary: salConfig, payroll: payConfig, leaves: leaveConfig, shifts: shiftConfig };
  const { columns, cardRenderer, rowKey } = CONFIG_MAP[normalizedTabKey] || permConfig;

  const getActions = (row) => {
    const base = [{ label: "View Details", icon: <FaEye size={13} />, onClick: () => setSelectedItem(row), className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50" }];
    if (normalizedTabKey === "attendance") base.push({ label: "View History", icon: <FaHistory size={13} />, onClick: () => setSelectedLogItem(row), className: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" });
    return base;
  };

  return (
    <div className="space-y-4">
      {warn && <p className="text-xs text-amber-500">⚠ Could not load data from API — list may be empty.</p>}

      {normalizedTabKey === "attendance" && (
        <div className="mb-2">
          <AttendanceTypeTabs value={subType} onChange={(val) => { setSubType(val); goToPage(1); }} />
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{rows.length}</span>
            {pagination.total > rows.length && <> of <span className="font-semibold text-gray-800">{pagination.total}</span></>}
            {" "}{tabLabel.toLowerCase()} records
          </p>
          <div className="flex items-center gap-2">
            {normalizedTabKey === "salary" && (
              <button onClick={() => navigate(`/employee-salary-history/${employeeId}`)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all shadow-sm">
                <FaHistory size={10} /> History
              </button>
            )}
            {normalizedTabKey !== "permissions" && (
              <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} accent={accent} />
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm">Loading {tabLabel.toLowerCase()}…</span>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3"><FaEye size={20} className="text-gray-200" /></div>
          <p className="text-sm font-medium">No {tabLabel.toLowerCase()} records found</p>
        </div>
      )}

      {!loading && rows.length > 0 && normalizedTabKey === "permissions" && (
        <CategoryPermissionSelector
          allPermissions={rows.map(r => ({
            ...r,
            category: r.category || (r.code ? r.code.split('_')[0].replace(/\b\w/g, c => c.toUpperCase()) : 'Unknown')
          }))}
          selectedIds={rows.map(r => r.id)}
          readOnly={true}
          listHeightClass="max-h-[60vh]"
        />
      )}

      {!loading && rows.length > 0 && normalizedTabKey !== "permissions" && viewMode === "table" && (
        <ManagementTable rows={rows} columns={columns} rowKey={rowKey} onRowClick={onView} activeId={activeMenu} onToggleAction={(e, id) => setActiveMenu((c) => (c === id ? null : id))} getActions={getActions} accent={accent} headerClassName="xsm:hidden" />
      )}

      {!loading && rows.length > 0 && normalizedTabKey !== "permissions" && viewMode === "card" && (
        <ManagementGrid viewMode={viewMode}>
          {rows.map((row, idx) => cardRenderer(row, idx, activeMenu, (e, id) => setActiveMenu((c) => (c === id ? null : id))))}
        </ManagementGrid>
      )}

      {!loading && rows.length > 0 && normalizedTabKey !== "permissions" && (
        <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={goToPage} onLimitChange={changeLimit} className="mt-2" />
      )}

      <AnimatePresence>
        {selectedItem && <DetailModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} tabKey={tabKey} tabLabel={tabLabel} subType={subType} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedLogItem && <AttendanceLogsModal id={selectedLogItem.id} type={subType} onClose={() => setSelectedLogItem(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export default function EmployeeProfilePage() {
  const { employeeId, tabKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(false);
  const requestedTab = new URLSearchParams(location.search).get("tab");
  const activeTab = PROFILE_TAB_IDS.has(tabKey) ? tabKey : DEFAULT_PROFILE_TAB;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    const candidateTab = PROFILE_TAB_IDS.has(requestedTab) ? requestedTab : activeTab;
    const desiredPath = `/employee-profile/${employeeId}/${candidateTab}`;
    const hasLegacyQuery = location.search.includes("tab=");
    if (hasLegacyQuery || !tabKey || tabKey !== candidateTab || location.pathname !== desiredPath) {
      navigate(desiredPath, { replace: true });
    }
  }, [activeTab, employeeId, location.pathname, location.search, navigate, requestedTab, tabKey]);

  const fetchProfile = useCallback(async (id) => {
    if (!id) { if (mountedRef.current) { setError("Missing employee id"); setProfile(null); } return; }
    try {
      if (mountedRef.current) { setLoading(true); setError(null); setProfile(null); }
      const { res, json } = await runDedupedRequest(`employee-profile:${id}`, async () => {
        const companyStr = localStorage.getItem("company");
        const companyId = companyStr ? JSON.parse(companyStr)?.id : null;
        const response = await apiCall(`/employees/${id}?include=basic`, "GET", null, companyId);
        const data = await response.json();
        return { res: response, json: data };
      });
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch profile details");
      const raw = json.data?.basic ?? json.data?.[0] ?? json.data ?? {};
      if (mountedRef.current) {
        setProfile({
          employee: { ...raw, code: raw.employee_code || raw.code },
          user: { ...raw, name: raw.user_name || raw.name },
          company: { ...raw, name: raw.company_name || (raw.company?.name ?? "—"), legal_name: raw.legal_name || (raw.company?.legal_name ?? "—"), logo_url: raw.logo_url || raw.company?.logo_url, city: raw.city || raw.company?.city, state: raw.state || raw.company?.state, country: raw.country || raw.company?.country },
        });
      }
    } catch (err) {
      if (mountedRef.current) { setError(err.message || "Failed to load profile"); setProfile(null); }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(employeeId); }, [employeeId, fetchProfile]);

  const handleTabChange = useCallback((nextTab) => {
    if (!PROFILE_TAB_IDS.has(nextTab) || nextTab === activeTab) return;
    navigate(`/employee-profile/${employeeId}/${nextTab}`);
  }, [activeTab, employeeId, navigate]);

  const handleRefresh = useCallback(async () => {
    setRefreshKey((key) => key + 1);
    await fetchProfile(employeeId);
  }, [employeeId, fetchProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-6 font-sans">
      <div className="mx-auto max-w-7xl">
        {loading && (
          <div className="flex flex-col items-center py-16 gap-2 text-slate-400">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Fetching employee data…</span>
          </div>
        )}

        {error && (
          <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">⚠ {error}</div>
        )}

        {!loading && !profile && !error && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-sm font-medium text-gray-700">No employee profile data found.</p>
            <p className="text-xs text-gray-500 mt-1">This page now depends entirely on the `include=basic` response.</p>
          </div>
        )}

        <AnimatePresence>
          {profile && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
              <ProfileHub
                eyebrow={<><FaIdCard size={11} /> Employee Profile</>}
                title={`${profile.employee?.name || profile.user?.name || "Employee"} Profile`}
                description="Detailed overview of employee performance, attendance, and employment records."
                accent="blue"
                summary={<ProfileHeaderSummary data={profile} />}
                actions={
                  <RefreshButton loading={loading} onClick={handleRefresh}>
                    Refresh
                  </RefreshButton>
                }
                tabs={TABS.map((tab) => ({ id: tab.key, label: tab.label, icon: tab.icon, title: tab.label }))}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              >
                <div className="space-y-4">
                  {activeTab === "attendance" ? (
                    <EmployeeAttendanceCalendar employee={profile.employee} fallbackId={employeeId} refreshKey={refreshKey} />
                  ) : activeTab === "ledger" ? (
                    <CompanyLedger employeeId={profile.employee?.id ?? employeeId} />
                  ) : (
                    <TabContent tabKey={activeTab} tabLabel={TABS.find((tab) => tab.key === activeTab)?.label || "Profile"} employeeId={profile.employee?.id ?? employeeId} refreshKey={refreshKey} />
                  )}
                </div>
              </ProfileHub>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
