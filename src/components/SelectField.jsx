import Select from "react-select";
import { getReactSelectMenuProps, reactSelectStyles } from "../hooks/reactSelectConfig";

const mergeSelectStyles = (styles = {}) => {
  const customStyles = styles || {};
  const keys = new Set([...Object.keys(reactSelectStyles), ...Object.keys(customStyles)]);

  const merged = {};
  keys.forEach((key) => {
    const baseStyle = reactSelectStyles[key];
    const overrideStyle = customStyles[key];

    if (baseStyle && overrideStyle) {
      merged[key] = (provided, state) => overrideStyle(baseStyle(provided, state), state);
    } else {
      merged[key] = overrideStyle || baseStyle;
    }
  });

  return merged;
};

const SelectField = ({ styles, ...props }) => {
  return (
    <Select
      {...getReactSelectMenuProps()}
      {...props}
      styles={mergeSelectStyles(styles)}
    />
  );
};

export default SelectField;
