// components/CompanyModals/EditCompanyModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function EditCompanyModal({ isOpen, onClose, onSuccess, company }) {
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    logo_url: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    latitude: "",
    longitude: ""
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (company) {
      const data = {
        name: company.name || "",
        legal_name: company.legal_name || "",
        logo_url: company.logo_url || "",
        address_line1: company.address_line1 || "",
        address_line2: company.address_line2 || "",
        city: company.city || "",
        state: company.state || "",
        postal_code: company.postal_code || "",
        country: company.country || "India",
        latitude: company.latitude || "",
        longitude: company.longitude || ""
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [company]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    // Only send fields that have changed
    const changedFields = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== originalData[key]) {
        changedFields[key] = formData[key];
      }
    });

    // If no fields changed, show message and close
    if (Object.keys(changedFields).length === 0) {
      toast.info("No changes detected");
      onClose();
      return;
    }

    onSuccess(company.id, changedFields);
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
            className="bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-8 border border-gray-100 my-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Company</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Company Name *"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all col-span-1"
              />
              <input
                name="legal_name"
                placeholder="Legal Name *"
                value={formData.legal_name}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all col-span-1"
              />
              <input
                name="logo_url"
                placeholder="Logo URL"
                value={formData.logo_url}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-1 sm:col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="address_line1"
                placeholder="Address Line 1"
                value={formData.address_line1}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-1 sm:col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="address_line2"
                placeholder="Address Line 2"
                value={formData.address_line2}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-1 sm:col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="postal_code"
                placeholder="Postal Code"
                value={formData.postal_code}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="country"
                value="India"
                readOnly
                className="border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-600"
              />
              <input
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl order-1 sm:order-2"
              >
                Update Company
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditCompanyModal;