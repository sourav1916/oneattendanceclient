import { useCompany } from "../context/CompanyContext";

export default function CompanySwitcher({ companies }) {

  const { setActiveCompany } = useCompany();

  return (
    <select
      onChange={(e) =>
        setActiveCompany(companies.find(c => c.id == e.target.value))
      }
    >

      {companies.map(c => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}

    </select>
  );
}
