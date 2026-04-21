import Select from "react-select";
import { getReactSelectMenuProps, reactSelectStyles } from "./reactSelectConfig";

const SelectField = ({ styles, ...props }) => {
  const mergedStyles = {
    ...(styles || {}),
    menuPortal: (base, state) => {
      const portalBase = reactSelectStyles.menuPortal(base, state);
      return styles?.menuPortal ? styles.menuPortal(portalBase, state) : portalBase;
    },
  };

  return (
    <Select
      {...getReactSelectMenuProps()}
      {...props}
      styles={mergedStyles}
    />
  );
};

export default SelectField;
