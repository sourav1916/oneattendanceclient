import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

function SwitchCompanyModal({ isOpen, onClose, companies, onSwitch }) {
  const handleSwitch = (company) => {
    localStorage.setItem("company", JSON.stringify(company));
    toast.success(`Switched to ${company.name}`);
    onSwitch?.(company);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Switch Company</h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {companies.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500">No companies found</p>
                </div>
              )}

              {companies.map((company) => (
                <motion.button
                  key={company.id}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => handleSwitch(company)}
                  className="w-full text-left p-5 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {company.name || "Unnamed Company"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {company.legal_name || "No legal name"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {company.city}, {company.state}
                  </p>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SwitchCompanyModal;