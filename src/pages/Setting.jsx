import { useEffect, useState } from "react";
import { FaBuilding, FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const SettingsPage = () => {

  const [companies, setCompanies] = useState([]);
  const [activeCompany, setActiveCompany] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("company"));
    if (stored) setActiveCompany(stored);

    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData?.companies) {
      setCompanies(userData.companies);
    }
  }, []);

  const selectCompany = (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    setActiveCompany(company);
  };

  return (
    <div className="p-6">

      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* Manage Companies */}
      <div className="bg-white rounded-xl shadow border p-6">

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaBuilding /> Manage Companies
          </h2>

          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            <FaPlus />
            Add Company
          </button>
        </div>

        <div className="space-y-3">

          {companies.map((company) => (

            <div
              key={company.id}
              className={`flex justify-between items-center p-4 border rounded-lg 
              ${activeCompany?.id === company.id ? "border-indigo-500 bg-indigo-50" : ""}`}
            >

              <div>

                <p className="font-medium">{company.name}</p>

                <p className="text-sm text-gray-500">
                  {company.legal_name}
                </p>

                {activeCompany?.id === company.id && (
                  <span className="text-xs text-indigo-600 font-medium">
                    Active
                  </span>
                )}

              </div>

              <div className="flex items-center gap-3">

                <button
                  onClick={() => selectCompany(company)}
                  className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Switch
                </button>

                <button className="text-gray-500 hover:text-indigo-600">
                  <FaEdit />
                </button>

                <button className="text-gray-500 hover:text-red-600">
                  <FaTrash />
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
};

export default SettingsPage;
