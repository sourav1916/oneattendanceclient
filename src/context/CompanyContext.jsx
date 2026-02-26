import { createContext, useContext, useState } from "react";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {

  const [activeCompany, setActiveCompany] = useState(null);

  return (
    <CompanyContext.Provider value={{
      activeCompany,
      setActiveCompany
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
