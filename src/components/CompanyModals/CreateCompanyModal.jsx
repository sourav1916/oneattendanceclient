import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const API_BASE = "https://api-attendance.onesaas.in";

function CreateCompanyModal({ isOpen, onClose, onSuccess, userId }) {
  const [companyForm, setCompanyForm] = useState({
    owner_user_id: userId,
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

  useEffect(() => {
    if (userId) {
      setCompanyForm(prev => ({ ...prev, owner_user_id: userId }));
    }
  }, [userId]);

  const handleChange = (e) => {
    setCompanyForm({
      ...companyForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const response = await fetch(`${API_BASE}/company/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(companyForm)
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to create company");
        return;
      }

      if (result.success) {
        localStorage.setItem("company", JSON.stringify(result.data));
        toast.success("Company created successfully 🎉");
        onSuccess?.(result.data);
        handleClose();
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please check your internet connection.");
    }
  };

  const handleClose = () => {
    setCompanyForm({
      owner_user_id: userId,
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
            className="bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl p-8 border border-gray-100 my-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Company</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Company Name *"
                value={companyForm.name}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="legal_name"
                placeholder="Legal Name *"
                value={companyForm.legal_name}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="logo_url"
                placeholder="Logo URL"
                value={companyForm.logo_url}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="address_line1"
                placeholder="Address Line 1"
                value={companyForm.address_line1}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="address_line2"
                placeholder="Address Line 2"
                value={companyForm.address_line2}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl col-span-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="city"
                placeholder="City"
                value={companyForm.city}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="state"
                placeholder="State"
                value={companyForm.state}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="postal_code"
                placeholder="Postal Code"
                value={companyForm.postal_code}
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
                value={companyForm.latitude}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <input
                name="longitude"
                placeholder="Longitude"
                value={companyForm.longitude}
                onChange={handleChange}
                className="border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Company
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateCompanyModal;