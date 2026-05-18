import Select from "./SelectField";

const customSelectStyles = {
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#ede9fe" : state.isFocused ? "#f3f4f6" : "transparent",
    color: state.isSelected ? "#6d28d9" : "#1e293b",
    "&:active": { backgroundColor: "#e9d5ff" }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#ede9fe",
    borderRadius: "0.625rem"
  }),
  multiValueLabel: (base) => ({ ...base, color: "#6d28d9", fontWeight: 600 }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#7c3aed",
    "&:hover": { backgroundColor: "#7c3aed", color: "white" }
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
