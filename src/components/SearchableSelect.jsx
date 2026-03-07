import Select from "react-select";

const SearchableSelect = ({ users, onSelect }) => {

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
      placeholder="Search user..."
      isSearchable
      onChange={handleChange}
    />
  );
};

export default SearchableSelect;
