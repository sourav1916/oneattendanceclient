import { useCompany } from "../context/CompanyContext";

export default function CompanySwitcher() {
  const { companies, activeCompany, setActiveCompany } = useCompany();

  if (!companies || companies.length <= 1) return null;

  return (
    <select
      value={activeCompany?.id || ''}
      onChange={(e) => {
        const company = companies.find(c => c.id == e.target.value);
        if (company) {
          setActiveCompany(company);
          // Backend call to switch context would go here
        }
      }}
      className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {companies.map(c => (
        <option key={c.id} value={c.id}>
          {c.name} {c.roleBadge && `(${c.roleBadge})`}
        </option>
      ))}
    </select>
  );
}
