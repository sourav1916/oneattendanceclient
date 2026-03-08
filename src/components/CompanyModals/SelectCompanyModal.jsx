import React from "react";
import { AnimatePresence, motion } from "framer-motion";

function SelectCompanyModal({ isOpen, onClose, companies, onSelect }) {
  const handleSelect = (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    onSelect?.(company);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
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
            <h2 className="text-lg font-semibold mb-4">Select Company</h2>

            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-slate-50 transition"
                >
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-gray-500">{company.legal_name}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SelectCompanyModal;