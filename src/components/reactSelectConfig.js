export const getReactSelectMenuProps = () => ({
  menuPlacement: "auto",
  menuPosition: "fixed",
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuShouldBlockScroll: true,
});

const baseControlStyle = (base, state) => ({
  ...base,
  minHeight: "48px",
  borderRadius: "0.75rem",
  backgroundColor: "#f9fafb",
  fontSize: "0.875rem",
  borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
  boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.10)" : "none",
  "&:hover": {
    borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
  },
});

export const reactSelectStyles = {
  control: baseControlStyle,
  valueContainer: (base) => ({
    ...base,
    padding: "0 0.875rem",
    fontSize: "0.875rem",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "#1f2937",
    fontSize: "0.875rem",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontWeight: 500,
    fontSize: "0.875rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#334155",
    fontWeight: 500,
    fontSize: "0.875rem",
  }),
  indicatorSeparator: (base) => ({
    ...base,
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#3b82f6" : "#9ca3af",
    "&:hover": {
      color: "#2563eb",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#9ca3af",
    "&:hover": {
      color: "#4b5563",
    },
  }),
  menu: (base) => ({
    ...base,
    marginTop: "0.5rem",
    borderRadius: "0.75rem",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 30px -14px rgba(15, 23, 42, 0.18)",
    backgroundColor: "#ffffff",
  }),
  menuList: (base) => ({
    ...base,
    padding: "0.25rem",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.625rem",
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? "#dbeafe"
      : state.isFocused
        ? "#f3f4f6"
        : "transparent",
    color: state.isSelected ? "#1d4ed8" : "#334155",
    fontWeight: state.isSelected ? 700 : 500,
    "&:active": {
      backgroundColor: "#bfdbfe",
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#dbeafe",
    borderRadius: "0.625rem",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1d4ed8",
    fontWeight: 600,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#2563eb",
    "&:hover": {
      backgroundColor: "#2563eb",
      color: "white",
    },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};
