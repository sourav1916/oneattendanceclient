# Salary Table Design Reference

Source page: `src/pages/SalaryManagement.jsx`

This document captures the table pattern used in Salary Management so the same UI language can be reused across other management pages.

## What Makes The Current Table Work

- Clear hierarchy: summary cards, filters, table, card fallback, pagination.
- Responsive column collapse: the table hides lower-priority fields as the viewport shrinks.
- Action consistency: all destructive or secondary actions live in the same three-dot menu.
- Strong card framing: white surface, soft border, rounded corners, shadow, and subtle hover states.
- Controlled by data: columns and actions are driven by page state, not hard-coded in a shared component.

## Responsive Column Contract

The Salary Management table uses the following breakpoints:

- `showEmployee`: always visible
- `showBaseAmount`: visible at `>= 420px`
- `showNetSalary`: visible at `>= 640px`
- `showStatus`: visible at `>= 768px`
- `showPackage`: visible at `>= 1024px`
- `showEffectivePeriod`: visible at `>= 1280px`

That pattern is a good default for future tables:

1. Keep identity fields visible first.
2. Keep money/status fields visible next.
3. Push long metadata to larger screens.
4. Move all actions into the last narrow column.

## Recommended Reusable Components

### `ManagementButton`

Use for page-level actions such as `Add`, `Assign`, `Save`, `Delete`, and `Filter`.

Parent controls:

- Button text
- Variant and tone
- Icon(s)
- Loading state
- Disabled state
- Full width or compact width

Example:

```jsx
<ManagementButton
  tone="green"
  variant="solid"
  leftIcon={<FaPlus />}
  onClick={() => setOpen(true)}
>
  Assign Salary
</ManagementButton>
```

### `ManagementTable`

Use for any list page that needs:

- Configurable columns
- Row rendering from props
- Optional row click
- Optional action menu
- Empty state handling

Parent controls:

- Which fields are visible
- Column labels
- Cell renderers
- Action menu items
- Row key
- Row click behavior

Suggested column format:

```jsx
const columns = [
  {
    key: 'employee',
    label: 'Employee',
    render: (row) => <EmployeeCell row={row} />,
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => formatCurrency(row.amount),
  },
];
```

Suggested action format:

```jsx
const getActions = (row) => [
  { label: 'View', icon: <FaEye />, onClick: () => open(row) },
  { label: 'Edit', icon: <FaEdit />, onClick: () => edit(row) },
  { label: 'Delete', icon: <FaTrash />, onClick: () => remove(row), className: 'text-red-600' },
];
```

### `ManagementCard`

Use for card view, mobile fallback, or summary tiles.

Parent controls:

- Title and subtitle
- Badge or status chip
- Header icon
- Footer content
- Action menu items
- Click behavior

### `ManagementHub`

Use for page-level shell and tabbed management areas.

Parent controls:

- Header eyebrow
- Title and description
- Accent tone
- Summary strip
- Tabs
- Right-side actions
- Main content area

This is a good fit for hub pages like Salary Management, Employee Management, and Leave Management.

## UI Rules To Keep Pages Consistent

- Use the same card radius: `rounded-2xl` or `rounded-[2rem]` for page shells.
- Use one shadow family per surface level.
- Keep action buttons aligned to the right in header areas.
- Keep tables dense but readable.
- Keep row hover states subtle and consistent.
- Keep action menus in the final column, never mixed into data columns.
- Avoid page-specific table markup when the same structure can be described by props.

## Production-Level Prop Strategy

The parent page should own:

- Visible columns
- Action menu items
- Empty state copy
- Table accent color
- Button labels and colors
- Card content
- Tab order
- Row click behavior

The reusable component should own:

- Layout
- Spacing
- Hover behavior
- Menu anchoring
- Animation
- Responsive frame

## How To Scale This Across Other Pages

1. Convert each page into column config + action config.
2. Reuse the same `ManagementButton`, `ManagementTable`, and `ManagementCard`.
3. Use `ManagementHub` for common page shell and tabbed management screens.
4. Keep all colors and labels controlled by the page so the component stays generic.

## Source Reference

The original design came from:

- `src/pages/SalaryManagement.jsx`

If you change that page later, update this document so the shared component contract stays aligned with the live UI.
