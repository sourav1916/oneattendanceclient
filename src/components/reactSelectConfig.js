export const getReactSelectMenuProps = () => ({
  menuPlacement: "auto",
  menuPosition: "fixed",
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuShouldBlockScroll: true,
});

export const reactSelectStyles = {
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};
