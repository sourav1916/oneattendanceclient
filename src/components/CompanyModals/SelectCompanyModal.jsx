import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

function SelectCompanyModal({ isOpen, onClose, companies, onSelect }) {
  const handleSelect = (company) => {
    onSelect?.(company);
  };

  // Prevent navigation when modal is open
  useEffect(() => {
    if (isOpen) {
      // Disable browser back button
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
      };
      
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl w-[420px] p-6 shadow-xl"
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Company</h2>
            <p className="text-sm text-gray-600">
              You have access to multiple companies. Please select one to continue.
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto my-4">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className="w-full text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 group-hover:text-blue-600">
                      {company.name}
                    </p>
                    {company.legal_name && (
                      <p className="text-xs text-gray-500 mt-1">{company.legal_name}</p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-center text-gray-500">
              You can switch companies later from your profile settings
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SelectCompanyModal;