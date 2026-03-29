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
    company_ip: "",
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
  const [ipMode, setIpMode] = useState('auto');
  const [addressMode, setAddressMode] = useState('manual');
  const [logoFile, setLogoFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (userId) {
      setCompanyForm(prev => ({ ...prev, owner_user_id: userId }));
    }
  }, [userId]);

  // Auto-calculate latitude and longitude when address fields change
  useEffect(() => {
    if (!addressTouched || addressMode === 'auto') return;

    const getCoordinates = async () => {
      const addressString = [
        companyForm.address_line1,
        companyForm.city,
        companyForm.state,
        companyForm.postal_code,
        companyForm.country
      ].filter(Boolean).join(", ");

      if (addressString.split(", ").length < 2) return;

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
            'User-Agent': 'AttendanceApp/1.0'
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
      } finally {
        setIsGeocoding(false);
      }
    };

    const timeoutId = setTimeout(getCoordinates, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    companyForm.address_line1,
    companyForm.city,
    companyForm.state,
    companyForm.postal_code,
    companyForm.country,
    addressTouched,
    addressMode
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (['address_line1', 'city', 'state', 'postal_code', 'country'].includes(name)) {
      setAddressTouched(true);
    }
  };

  const handleAddressModeChange = (mode) => {
    setAddressMode(mode);
    if (mode === 'auto') {
      if ("geolocation" in navigator) {
        setIsGeocoding(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            try {
              const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                format: 'json',
                addressdetails: 1
              });
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'AttendanceApp/1.0'
                }
              });
              const data = await response.json();
              if (data && data.address) {
                setCompanyForm(prev => ({
                  ...prev,
                  latitude: lat.toString(),
                  longitude: lon.toString(),
                  address_line1: data.address.road || data.address.suburb || data.address.neighbourhood || "",
                  city: data.address.city || data.address.town || data.address.county || "",
                  state: data.address.state || "",
                  postal_code: data.address.postcode || ""
                }));
                toast.success("📍 Location and address auto-detected!");
              } else {
                setCompanyForm(prev => ({ ...prev, latitude: lat.toString(), longitude: lon.toString() }));
                toast.info("📍 Coordinates detected, but could not resolve address.");
              }
            } catch (err) {
              console.error("Reverse geocoding error:", err);
              setCompanyForm(prev => ({ ...prev, latitude: lat.toString(), longitude: lon.toString() }));
              toast.info("📍 Coordinates detected, but could not resolve address.");
            } finally {
              setIsGeocoding(false);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast.error("Failed to get current location");
            setIsGeocoding(false);
            setAddressMode('manual');
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser");
        setAddressMode('manual');
      }
    }
  };

  const handleSubmit = async () => {
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

      const formData = new FormData();
      Object.keys(companyForm).forEach(key => {
        if (key === 'logo_url') return;
        if (key === 'company_ip' && ipMode === 'auto') return;
        
        if (companyForm[key] !== null && companyForm[key] !== undefined && companyForm[key] !== "") {
          formData.append(key, companyForm[key]);
        }
      });
      
      if (logoFile) {
        formData.append('logo_url', logoFile);
      }

      const res = await apiCall('/company/create', 'POST', formData);
      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Failed to create company");
        return;
      }

      if (result.success) {
        localStorage.setItem("company", JSON.stringify(result.data));
        
        if (onCompanyCreated) {
          await onCompanyCreated();
        }
        
        toast.success(result.message || "Company created successfully 🎉");
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
      company_ip: "",
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
    setIpMode('auto');
    setAddressMode('manual');
    setLogoFile(null);
    setAddressTouched(false);
    setIsSubmitting(false);
    setIsGeocoding(false);
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
            className="bg-white backdrop-blur-xl w-[95%] sm:w-[80%] max-w-5xl max-h-[85vh] rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 m-auto flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FaBuilding className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Company</h2>
            </div>

            <div className="grid grid-cols-1 overflow-y-auto md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaBuilding className="w-4 h-4" />
                  Basic Information
                </h3>
              </div>

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
                  className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>

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
                  className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaLink className="w-3 h-3 text-indigo-500" />
                  Company Logo
                </label>
                <input
                  type="file"
                  name="logo_url"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-sm"
                />
                {logoFile && (
                  <p className="text-xs text-green-600 pl-2 mt-1">Selected: {logoFile.name}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Company IP Settings
                </label>
                
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ipMode" 
                      value="auto"
                      checked={ipMode === 'auto'}
                      onChange={() => setIpMode('auto')}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">Auto-detect</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="ipMode" 
                      value="manual"
                      checked={ipMode === 'manual'}
                      onChange={() => setIpMode('manual')}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">Manual Entry</span>
                  </label>
                </div>

                {ipMode === 'manual' ? (
                  <div className="space-y-1 pt-2">
                    <input
                      name="company_ip"
                      placeholder="e.g., 192.168.1.1, 8.8.8.8 (Comma-separated)"
                      value={companyForm.company_ip}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm bg-white"
                    />
                    <p className="text-xs text-gray-500">Provide multiple IP addresses separated by commas.</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 pt-1">The system will automatically record the valid network IP via connection headers.</p>
                )}
              </div>

              {/* Address toggle header */}
              <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <FaMapMarkerAlt className="w-4 h-4" />
                  Address Information
                </h3>
                {isGeocoding && <span className="text-xs text-indigo-500 animate-pulse">Detecting...</span>}
                <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="addressMode" 
                      value="auto"
                      checked={addressMode === 'auto'}
                      onChange={() => handleAddressModeChange('auto')}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 font-medium">Auto-detect</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="addressMode" 
                      value="manual"
                      checked={addressMode === 'manual'}
                      onChange={() => handleAddressModeChange('manual')}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 font-medium">Manual Entry</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaRoad className="w-3 h-3 text-indigo-500" />
                  Address Line 1
                </label>
                <input
                  name="address_line1"
                  placeholder="Street address, P.O. box"
                  value={companyForm.address_line1}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaRoad className="w-3 h-3 text-indigo-500" />
                  Address Line 2
                </label>
                <input
                  name="address_line2"
                  placeholder="Apartment, suite, unit, etc."
                  value={companyForm.address_line2}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaCity className="w-3 h-3 text-indigo-500" />
                  City
                </label>
                <input
                  name="city"
                  placeholder="City"
                  value={companyForm.city}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaGlobe className="w-3 h-3 text-indigo-500" />
                  State
                </label>
                <input
                  name="state"
                  placeholder="State"
                  value={companyForm.state}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaEnvelope className="w-3 h-3 text-indigo-500" />
                  Postal Code
                </label>
                <input
                  name="postal_code"
                  placeholder="Postal Code"
                  value={companyForm.postal_code}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaGlobe className="w-3 h-3 text-indigo-500" />
                  Country
                </label>
                <input
                  name="country"
                  value="India"
                  readOnly
                  className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaMapPin className="w-4 h-4" />
                  Location Coordinates
                </h3>
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaCrosshairs className="w-3 h-3 text-indigo-500" />
                  Latitude
                </label>
                <div className="relative">
                  <input
                    name="latitude"
                    placeholder="Latitude"
                    value={companyForm.latitude}
                    onChange={handleChange}
                    disabled={addressMode === 'auto'}
                    className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                  {companyForm.latitude && (
                    <FaCheck className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaCrosshairs className="w-3 h-3 text-indigo-500" />
                  Longitude
                </label>
                <div className="relative">
                  <input
                    name="longitude"
                    placeholder="Longitude"
                    value={companyForm.longitude}
                    onChange={handleChange}
                    disabled={addressMode === 'auto'}
                    className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                  {companyForm.longitude && (
                    <FaCheck className="absolute right-3 top-3 w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateCompanyModal;