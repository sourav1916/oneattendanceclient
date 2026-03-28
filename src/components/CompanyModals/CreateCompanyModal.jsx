import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import apiCall from "../../utils/api";
import { 
  FaBuilding, FaTimes, FaCheck, FaSpinner, 
  FaMapMarkerAlt, FaGlobe, FaCity, FaRoad,
  FaEnvelope, FaLink, FaMapPin, FaCrosshairs
} from "react-icons/fa";


const GEOCODING_API = "https://nominatim.openstreetmap.org/search";

function CreateCompanyModal({ isOpen, onClose, onSuccess, userId, onCompanyCreated }) {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  useEffect(() => {
    if (userId) {
      setCompanyForm(prev => ({ ...prev, owner_user_id: userId }));
    }
  }, [userId]);

  // Auto-calculate latitude and longitude when address fields change
  useEffect(() => {
    if (!addressTouched) return;

    const getCoordinates = async () => {
      // Check if we have enough address info
      const addressString = [
        companyForm.address_line1,
        companyForm.city,
        companyForm.state,
        companyForm.postal_code,
        companyForm.country
      ].filter(Boolean).join(", ");

      if (addressString.split(", ").length < 2) return; // Need at least city and country

      setIsGeocoding(true);

      try {
        const params = new URLSearchParams({
          q: addressString,
          format: 'json',
          limit: 1,
          addressdetails: 1
        });

        const response = await fetch(`${GEOCODING_API}?${params}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AttendanceApp/1.0' // Required by Nominatim
          }
        });

        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setCompanyForm(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon
          }));
          toast.success("📍 Location coordinates found!");
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        // Don't show error toast for geocoding failure, just log it
      } finally {
        setIsGeocoding(false);
      }
    };

    // Debounce the geocoding request
    const timeoutId = setTimeout(getCoordinates, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    companyForm.address_line1,
    companyForm.city,
    companyForm.state,
    companyForm.postal_code,
    companyForm.country,
    addressTouched
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Mark address fields as touched
    if (['address_line1', 'city', 'state', 'postal_code', 'country'].includes(name)) {
      setAddressTouched(true);
    }
  };

  const handleManualLocation = () => {
    if ("geolocation" in navigator) {
      setIsGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCompanyForm(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          setIsGeocoding(false);
          toast.success("📍 Current location detected!");
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Failed to get current location");
          setIsGeocoding(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!companyForm.name || !companyForm.legal_name) {
      toast.error("Company name and legal name are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication expired. Please login again.");
        return;
      }

      const result = await apiCall('/company/create', 'POST', companyForm);

      if (!result.success) {
        toast.error(result.message || "Failed to create company");
        return;
      }

      if (result.success) {
        localStorage.setItem("company", JSON.stringify(result.data));
        
        // Call the onCompanyCreated callback to refresh user data
        if (onCompanyCreated) {
          await onCompanyCreated();
        }
        
        toast.success("Company created successfully 🎉");
        onSuccess?.(result.data);
        handleClose();
      } else {
        toast.error(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
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
    setAddressTouched(false);
    setIsSubmitting(false);
    setIsGeocoding(false);
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-h-[70%] max-w-3xl bg-white rounded-2xl shadow-2xl overflow-auto [scrollbar-behaviour:smooth] [scrollbar-width:none]"
          >
            {/* Gradient Header Bar */}
            <div className="relative h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <FaBuilding className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New Company</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Set up your organization details</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information Section */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaBuilding className="w-4 h-4" />
                    Basic Information
                  </h3>
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaBuilding className="w-3 h-3 text-indigo-500" />
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Tech Corp"
                    value={companyForm.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Legal Name */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaEnvelope className="w-3 h-3 text-indigo-500" />
                    Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="legal_name"
                    placeholder="e.g., Tech Corporation Pvt Ltd"
                    value={companyForm.legal_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Logo URL */}
                <div className="md:col-span-2 space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaLink className="w-3 h-3 text-indigo-500" />
                    Logo URL
                  </label>
                  <input
                    name="logo_url"
                    placeholder="https://example.com/logo.png"
                    value={companyForm.logo_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Address Section */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    Address Information
                  </h3>
                </div>

                {/* Address Line 1 */}
                <div className="md:col-span-2 space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaRoad className="w-3 h-3 text-indigo-500" />
                    Address Line 1
                  </label>
                  <input
                    name="address_line1"
                    placeholder="Street address, P.O. box, company name"
                    value={companyForm.address_line1}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2 space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaRoad className="w-3 h-3 text-indigo-500" />
                    Address Line 2
                  </label>
                  <input
                    name="address_line2"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    value={companyForm.address_line2}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaCity className="w-3 h-3 text-indigo-500" />
                    City
                  </label>
                  <input
                    name="city"
                    placeholder="e.g., Mumbai"
                    value={companyForm.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaGlobe className="w-3 h-3 text-indigo-500" />
                    State
                  </label>
                  <input
                    name="state"
                    placeholder="e.g., Maharashtra"
                    value={companyForm.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Postal Code */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaEnvelope className="w-3 h-3 text-indigo-500" />
                    Postal Code
                  </label>
                  <input
                    name="postal_code"
                    placeholder="e.g., 400001"
                    value={companyForm.postal_code}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaGlobe className="w-3 h-3 text-indigo-500" />
                    Country
                  </label>
                  <input
                    name="country"
                    value="India"
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Location Coordinates Section */}
                <div className="md:col-span-2 mt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FaMapPin className="w-4 h-4" />
                      Location Coordinates
                    </h3>
                    {isGeocoding && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        <FaSpinner className="w-3 h-3 animate-spin" />
                        Detecting location...
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Coordinates are automatically calculated from your address. You can also manually set them or use your current location.
                  </p>
                </div>

                {/* Latitude */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaCrosshairs className="w-3 h-3 text-indigo-500" />
                    Latitude
                  </label>
                  <div className="relative">
                    <input
                      name="latitude"
                      placeholder="Auto-detected"
                      value={companyForm.latitude}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm pr-10"
                    />
                    {companyForm.latitude && (
                      <FaCheck className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Longitude */}
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                    <FaCrosshairs className="w-3 h-3 text-indigo-500" />
                    Longitude
                  </label>
                  <div className="relative">
                    <input
                      name="longitude"
                      placeholder="Auto-detected"
                      value={companyForm.longitude}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm pr-10"
                    />
                    {companyForm.longitude && (
                      <FaCheck className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Manual Location Button */}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleManualLocation}
                    disabled={isGeocoding}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeocoding ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <FaCrosshairs className="w-4 h-4" />
                    )}
                    Use My Current Location
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-white hover:border-gray-300 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Create Company
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateCompanyModal;