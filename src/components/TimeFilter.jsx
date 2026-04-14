import { useEffect, useMemo, useRef, useState } from "react";
import { FaCalendarAlt, FaChevronDown, FaFilter, FaTimes } from "react-icons/fa";
import { DateRangePickerField } from "./DatePicker";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const today = new Date();
const todayStr = fmt(today);
const yest = new Date(today);
yest.setDate(yest.getDate() - 1);
const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);

const MODES = [
  { key: "today", label: "Today", hint: todayStr },
  { key: "yesterday", label: "Yesterday", hint: fmt(yest) },
  { key: "week", label: "1 week", hint: `${fmt(weekAgo)} - ${todayStr}` },
  { key: "custom", label: "Custom", hint: "Pick your own range" },
];

const MODE_STYLES = {
  today: {
    ring: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-100 hover:border-cyan-300",
    active: "border-cyan-400 bg-gradient-to-br from-cyan-100 to-sky-200 shadow-cyan-100",
    dot: "bg-cyan-500",
    text: "text-cyan-800",
    hint: "text-cyan-600",
  },
  yesterday: {
    ring: "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 hover:border-amber-300",
    active: "border-amber-400 bg-gradient-to-br from-amber-100 to-orange-200 shadow-amber-100",
    dot: "bg-amber-500",
    text: "text-amber-800",
    hint: "text-amber-600",
  },
  week: {
    ring: "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-100 hover:border-violet-300",
    active: "border-violet-400 bg-gradient-to-br from-violet-100 to-fuchsia-200 shadow-violet-100",
    dot: "bg-violet-500",
    text: "text-violet-800",
    hint: "text-violet-600",
  },
  custom: {
    ring: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 hover:border-emerald-300",
    active: "border-emerald-400 bg-gradient-to-br from-emerald-100 to-teal-200 shadow-emerald-100",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    hint: "text-emerald-600",
  },
};

function getParams(mode, from, to) {
  if (mode === "today") return { date: todayStr };
  if (mode === "yesterday") return { date: fmt(yest) };
  if (mode === "week") return { from_date: fmt(weekAgo), to_date: todayStr };
  if (mode === "custom") return { from_date: from, to_date: to };
  return {};
}

export default function TimeFilter({ onApply, onFetch }) {
  const apply = onApply || onFetch;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [from, setFrom] = useState(fmt(weekAgo));
  const [to, setTo] = useState(todayStr);
  const [label, setLabel] = useState("Filter");
  const rootRef = useRef(null);

  const summary = useMemo(() => {
    if (mode === "today") return todayStr;
    if (mode === "yesterday") return fmt(yest);
    if (mode === "week") return `${fmt(weekAgo)} - ${todayStr}`;
    if (mode === "custom") return from && to ? `${from} - ${to}` : "Custom range";
    return "All dates";
  }, [mode, from, to]);

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const clickedDatePickerPortal =
        target instanceof Element && target.closest('[data-datepicker-portal="true"]');

      if (clickedDatePickerPortal) return;

      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (key) => {
    setMode(key);
    if (key !== "custom") {
      const lbl = { today: "Today", yesterday: "Yesterday", week: "1 week" }[key];
      setLabel(lbl);
      setOpen(false);
      apply?.(getParams(key, from, to));
      return;
    }
    setLabel("Custom");
  };

  const applyCustomRange = ({ start, end }) => {
    setFrom(start);
    setTo(end);
    setLabel(start && end ? `${start} → ${end}` : "Custom");
    setOpen(false);
    apply?.(getParams("custom", start, end));
  };

  const clear = () => {
    setMode(null);
    setLabel("Filter");
    setFrom(fmt(weekAgo));
    setTo(todayStr);
    setOpen(false);
    apply?.({});
  };

  const panelContent = (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50 px-4 py-3 xsm:px-3 xsm:py-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500 xsm:text-[10px]">
            Choose time
          </p>
          <p className="text-sm text-slate-600 xsm:text-[11px]">Preset or custom range</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700 xsm:h-7 xsm:w-7"
          aria-label="Close"
        >
          <FaTimes className="h-4 w-4 xsm:h-3.5 xsm:w-3.5" />
        </button>
      </div>

      <div className="space-y-4 p-4 xsm:space-y-3 xsm:p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xsm:gap-1.5">
          {MODES.map(({ key, label: itemLabel, hint }) => {
            const active = mode === key;
            const palette = MODE_STYLES[key] || MODE_STYLES.today;

            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                className={`flex min-h-[78px] flex-col justify-between rounded-2xl border px-3 py-3 text-left transition-all xsm:min-h-[64px] xsm:rounded-xl xsm:px-2.5 xsm:py-2 ${active ? palette.active : palette.ring}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full xsm:h-2 xsm:w-2 ${active ? palette.dot : "bg-white/80"}`} />
                  <span className={`text-sm font-semibold xsm:text-[12px] ${active ? palette.text : "text-slate-700"}`}>
                    {itemLabel}
                  </span>
                </div>
                <span className={`text-[11px] leading-snug xsm:text-[10px] ${active ? palette.hint : "text-slate-500"}`}>
                  {hint}
                </span>
              </button>
            );
          })}
        </div>

        {mode === "custom" && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 xsm:rounded-xl xsm:p-2.5">
            <div className="mb-3 flex items-start gap-3 xsm:mb-2 xsm:gap-2">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm xsm:h-8 xsm:w-8 xsm:rounded-lg">
                <FaCalendarAlt className="h-4 w-4 xsm:h-3.5 xsm:w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 xsm:text-[12px]">Custom range</p>
                <p className="text-xs text-slate-500 xsm:text-[10px]">Pick a start and end date from the calendar overlay.</p>
              </div>
            </div>
            <DateRangePickerField
              value={{ start: from, end: to }}
              onChange={applyCustomRange}
              placeholder="Select range"
              buttonClassName="w-full rounded-xl border border-white bg-white px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm xsm:px-2.5 xsm:py-2 xsm:text-[11px]"
              wrapperClassName="w-full"
              popoverClassName="w-[19rem]"
              initialTab="range"
            />
          </div>
        )}

        <button
          type="button"
          onClick={clear}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 xsm:rounded-xl xsm:px-3 xsm:py-2.5 xsm:text-[11px]"
        >
          <FaTimes className="h-3.5 w-3.5 xsm:h-3 xsm:w-3" />
          Clear filter
        </button>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className="relative inline-block font-sans">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`group inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 xsm:gap-2 xsm:px-2.5 xsm:py-2 xsm:text-[11px] ${
          open
            ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-indigo-100"
            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition xsm:h-7 xsm:w-7 ${
            open
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
          }`}
        >
          <FaFilter className="h-4 w-4 xsm:h-3.5 xsm:w-3.5" />
        </span>

        <span className="flex min-w-0 flex-col items-start text-left leading-tight xsm:hidden">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Time Filter</span>
          <span className="truncate text-sm font-semibold text-slate-800">{label}</span>
        </span>

        <span className="hidden max-w-[8rem] truncate text-[11px] text-slate-400 xsm:block xsm:max-w-[5rem] xsm:text-[10px]">
          {summary}
        </span>

        <FaChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 xsm:h-3 xsm:w-3 ${
            open ? "rotate-180 text-indigo-600" : "text-slate-400"
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] sm:hidden" onClick={() => setOpen(false)} />

          <div className="fixed inset-x-3 bottom-3 z-50 max-h-[85vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 xsm:inset-x-2 xsm:bottom-2 xsm:max-h-[82vh] xsm:rounded-2xl sm:absolute sm:right-0 sm:top-full sm:bottom-auto sm:mt-3 sm:w-[min(92vw,24rem)] sm:max-h-none">
            <div className="sm:hidden">{panelContent}</div>
            <div className="hidden sm:block">{panelContent}</div>
          </div>
        </>
      )}
    </div>
  );
}
