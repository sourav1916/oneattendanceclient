import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeCompany, setActiveCompany] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    if (user?.companies && user.companies.length > 0) {
      setCompanies(user.companies);
      if (!activeCompany && user.companies[0]) {
        setActiveCompany(user.companies[0]);
      }
    } else {
      setCompanies([]);
      setActiveCompany(null);
    }
  }, [user]);

  const value = { 
    activeCompany, 
    setActiveCompany, 
    companies 
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  return context || { activeCompany: null, companies: [], setActiveCompany: () => {} };
};
