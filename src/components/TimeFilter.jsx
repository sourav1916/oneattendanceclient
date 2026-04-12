import { useState, useRef, useEffect } from "react";
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
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "1 week" },
  { key: "custom", label: "Custom" },
];

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

  useEffect(() => {
    const handler = (e) => {
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
      if (apply) apply(getParams(key, from, to));
    } else {
      setLabel("Custom");
    }
  };

  const applyCustomRange = ({ start, end }) => {
    setFrom(start);
    setTo(end);
    setLabel(`${start} -> ${end}`);
    setOpen(false);
    if (apply) apply(getParams("custom", start, end));
  };

  const clear = () => {
    setMode(null);
    setLabel("Filter");
    setFrom(fmt(weekAgo));
    setTo(todayStr);
    setOpen(false);
    if (apply) apply({});
  };

  return (
    <div ref={rootRef} style={s.root}>
      {/* Trigger button */}
      <button style={s.btn} onClick={() => setOpen((o) => !o)}>
        <FilterIcon />
        <span>{label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={s.dropdown}>
          {MODES.map(({ key, label: lbl }) => (
            <div
              key={key}
              style={{ ...s.item, ...(mode === key ? s.itemActive : {}) }}
              onClick={() => pick(key)}
            >
              <span style={{ ...s.dot, ...(mode === key ? s.dotActive : {}) }} />
              {lbl}
            </div>
          ))}

          {/* Custom date picker */}
          {mode === "custom" && (
            <div style={s.customSec}>
              <DateRangePickerField
                value={{ start: from, end: to }}
                onChange={applyCustomRange}
                placeholder="Select range"
                buttonClassName="w-full px-2.5 py-2 border border-gray-200 rounded-lg bg-white text-left text-[11px] text-gray-700"
                wrapperClassName="w-full"
                popoverClassName="w-[19rem]"
              />
            </div>
          )}

          {/* Clear */}
          <div style={s.clearRow} onClick={clear}>
            <CrossIcon />
            <span style={s.clearText}>Clear</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* Icons */
const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
  >
    <path
      d="M2 3.5L5 6.5L8 3.5"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
    <path d="M3 3l10 10M13 3L3 13" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* Styles */
const s = {
  root: {
    position: "relative",
    display: "inline-block",
    fontFamily: "system-ui, sans-serif",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 8,
    border: "1.5px solid #7C3AED",
    background: "#7C3AED",
    color: "#fff",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    width: 180,
    maxHeight: 200,
    overflow: "scroll",
    scrollBehavior: "smooth",
    scrollbarWidth: "none",
    borderRadius: 10,
    border: "1.5px solid #C4B5FD",
    background: "#fff",
    zIndex: 100,
    boxShadow: "0 4px 16px rgba(109,40,217,0.13)",
  },
  item: {
    padding: "9px 14px",
    fontSize: 12.5,
    color: "#3B0764",
    cursor: "pointer",
    borderBottom: "1px solid #EDE9FE",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  itemActive: {
    background: "#EDE9FE",
    color: "#6D28D9",
    fontWeight: 500,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#DDD6FE",
    flexShrink: 0,
  },
  dotActive: {
    background: "#7C3AED",
  },
  customSec: {
    background: "#F5F3FF",
    padding: "8px 10px",
    borderBottom: "1px solid #EDE9FE",
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  clbl: {
    fontSize: 10,
    color: "#7C3AED",
    fontWeight: 500,
    marginBottom: 2,
  },
  dateInput: {
    width: "100%",
    height: 24,
    fontSize: 10.5,
    padding: "0 5px",
    borderRadius: 6,
    border: "1.5px solid #C4B5FD",
    background: "#fff",
    color: "#3B0764",
    outline: "none",
    fontFamily: "inherit",
  },
  applyBtn: {
    width: "100%",
    height: 24,
    fontSize: 11,
    borderRadius: 6,
    border: "none",
    background: "#7C3AED",
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 2,
    fontFamily: "inherit",
  },
  clearRow: {
    background: "#FEF2F2",
    padding: "8px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    cursor: "pointer",
    borderTop: "1.5px solid #FECACA",
  },
  clearText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: 500,
  },
};
