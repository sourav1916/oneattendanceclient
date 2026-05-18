import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import countryCodes from "../../utils/countryCodes.json";

// Helper to generate flag emoji from ISO code
export const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Reusable country codes modal component
const CountryCodeModal = ({ isOpen, onClose, onSelect, selectedCode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  if (!isOpen) return null;

  const filteredCountries = countryCodes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dial_code.includes(searchQuery)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm"
        />

        {/* Modal content card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10 border border-gray-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="font-bold text-gray-800 text-sm">Select Country</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-sm p-1 transition-colors font-semibold"
            >
              ✕
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-gray-150 bg-gray-50/50">
            <input
              type="text"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-xs bg-white transition-colors"
            />
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[400px] custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = selectedCode === c.dial_code;
                return (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => {
                      onSelect(c.dial_code);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-between text-sm ${
                      isSelected
                        ? "bg-purple-50 text-purple-600 font-bold border border-purple-100"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">
                        {getFlagEmoji(c.code)}
                      </span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <span className="text-gray-400 font-semibold">+{c.dial_code}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No countries found
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CountryCodeModal;
