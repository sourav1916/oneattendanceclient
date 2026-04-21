import Select from "./SelectField";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "48px",
    borderColor: state.isFocused ? "#6366f1" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    "&:hover": { borderColor: "#6366f1" },
    borderRadius: "0.75rem",
    padding: "0 0.5rem"
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f1f5f9" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    "&:active": { backgroundColor: "#6366f1" }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#e0e7ff",
    borderRadius: "0.5rem"
  }),
  multiValueLabel: (base) => ({ ...base, color: "#4f46e5" }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#4f46e5",
    "&:hover": { backgroundColor: "#4f46e5", color: "white" }
  })
};

const SearchableSelect = ({ users, onSelect, placeholder = "Search user...", ...props }) => {

  const options = users.map((user) => ({
    value: user.id,
    label: `${user.full_name || user.name} (${user.email})`,
    user: user
  }));

  const handleChange = (selectedOption) => {
    if (selectedOption) {
      onSelect(selectedOption.user);
    }
  };

  return (
    <Select
      options={options}
      placeholder={placeholder}
      isSearchable
      onChange={handleChange}
      styles={customSelectStyles}
      {...props}
    />
  );
};

export default SearchableSelect;
