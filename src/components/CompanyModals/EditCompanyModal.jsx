import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import apiCall, { uploadFile } from "../../utils/api";
import { getPreciseLocation } from "../../utils/geolocation";
import { 
  FaBuilding, FaTimes, FaCheck, FaSpinner,
  FaMapMarkerAlt, FaGlobe, FaCity, FaRoad,
  FaEnvelope, FaMapPin, FaLink, FaPlus, FaMinusCircle,
  FaEye, FaTrash, FaCrosshairs
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";

const GEOCODING_API = "https://nominatim.openstreetmap.org/search";

function EditCompanyModal({ isOpen, onClose, onSuccess, company }) {
  const [formData, setFormData] = useState({
    company_ips: [],
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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [ipMode, setIpMode] = useState('auto');
  const [addressMode, setAddressMode] = useState('manual');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [ipInputValue, setIpInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressAutoDetected, setIsAddressAutoDetected] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Parse IPs from company data (handles both object and string formats)
  const parseCompanyIPs = (companyData) => {
    if (!companyData.company_ips) return [];
    
    let ipArray = [];
    if (Array.isArray(companyData.company_ips)) {
      if (companyData.company_ips.length > 0) {
        // Check if it's array of objects with ip_v4
        if (companyData.company_ips[0] && typeof companyData.company_ips[0] === 'object' && companyData.company_ips[0].ip_v4) {
          ipArray = companyData.company_ips.map(item => item.ip_v4).filter(Boolean);
        } else if (typeof companyData.company_ips[0] === 'string') {
          ipArray = companyData.company_ips;
        }
      }
    } else if (typeof companyData.company_ips === 'string') {
      try {
        const parsed = JSON.parse(companyData.company_ips);
        if (Array.isArray(parsed)) {
          if (parsed[0] && typeof parsed[0] === 'object' && parsed[0].ip_v4) {
            ipArray = parsed.map(item => item.ip_v4).filter(Boolean);
          } else {
            ipArray = parsed;
          }
        }
      } catch {
        ipArray = companyData.company_ips.split(',').map(ip => ip.trim()).filter(ip => ip);
      }
    }
    
    return ipArray;
  };

  // Load company data when modal opens
  useEffect(() => {
    if (company && isOpen) {
      const ipArray = parseCompanyIPs(company);
      
      const data = {
        company_ips: ipArray,
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
      setIpMode(ipArray.length > 0 ? 'manual' : 'auto');
      setAddressMode('manual');
      setIsAddressAutoDetected(false);
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [company, isOpen]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingLogo(true);
      try {
        const url = await uploadFile(file);
        setFormData(prev => ({ ...prev, logo_url: url }));
        setLogoFile(file);
        setLogoPreview(url);
        toast.success("Logo uploaded successfully!");
      } catch (error) {
        toast.error(error.message || "Failed to upload logo");
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddIp = () => {
    if (ipInputValue.trim()) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ips = ipInputValue.split(',').map(ip => ip.trim()).filter(ip => ip);
      
      const validIps = ips.filter(ip => ipPattern.test(ip));
      const invalidIps = ips.filter(ip => !ipPattern.test(ip));
      
      if (invalidIps.length > 0) {
        toast.error(`Invalid IP address(es): ${invalidIps.join(', ')}`);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        company_ips: [...prev.company_ips, ...validIps]
      }));
      setIpInputValue("");
    }
  };

  const handleRemoveIp = (ipToRemove) => {
    setFormData(prev => ({
      ...prev,
      company_ips: prev.company_ips.filter(ip => ip !== ipToRemove)
    }));
  };

  const handleIpKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIp();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (addressMode === 'auto' && !isAddressAutoDetected) {
      setAddressMode('manual');
      setIsAddressAutoDetected(false);
    }
  };

  // Auto-detect address from current location
  const handleAddressModeChange = async (mode) => {
    if (mode === 'manual') {
      setAddressMode('manual');
      setIsAddressAutoDetected(false);
      return;
    }

    setIsGeocoding(true);

    try {
      const position = await getPreciseLocation({ fetchAddress: true });
      setAddressMode('auto');
      
      const formUpdate = {
        latitude: position.latitude.toString(),
        longitude: position.longitude.toString()
      };

      if (position.address) {
        formUpdate.address_line1 = position.address.line1;
        formUpdate.address_line2 = position.address.line2;
        formUpdate.city = position.address.city;
        formUpdate.state = position.address.state;
        formUpdate.postal_code = position.address.postal_code;
        formUpdate.country = position.address.country;
        setIsAddressAutoDetected(true);
        toast.success("📍 Location and address auto-detected successfully!");
      } else {
        toast.info("📍 Coordinates detected, but could not resolve full address.");
      }
      
      setFormData(prev => ({ ...prev, ...formUpdate }));
    } catch (error) {
      setAddressMode('manual');
      toast.info((error.message || "Unable to get current location.") + " Please use manual address entry.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Manual geocoding from address
  const handleManualGeocode = async () => {
    const addressString = [
      formData.address_line1,
      formData.city,
      formData.state,
      formData.postal_code,
      formData.country
    ].filter(Boolean).join(", ");

    if (addressString.split(", ").length < 2) {
      toast.warning("Please enter at least address line and city to get coordinates");
      return;
    }

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
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        toast.success("📍 Location coordinates found!");
      } else {
        toast.warning("Could not find coordinates for this address");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to get coordinates");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    const changedFields = {};
    
    // Check for IP changes
    const originalIpArray = originalData.company_ips || [];
    const currentIpArray = formData.company_ips || [];
    
    if (ipMode === 'manual') {
      if (JSON.stringify(originalIpArray.sort()) !== JSON.stringify(currentIpArray.sort())) {
        changedFields.company_ips = currentIpArray;
      }
    } else if (ipMode === 'auto' && originalIpArray.length > 0) {
      // Switching from manual to auto - clear IPs
      changedFields.company_ips = [];
    }
    
    // Check other fields
    Object.keys(formData).forEach(key => {
      if (key !== 'logo_url' && key !== 'company_ips' && formData[key] !== originalData[key]) {
        if (formData[key] || originalData[key]) { // Only include if there's a change
          changedFields[key] = formData[key];
        }
      }
    });

    if (logoFile) {
      changedFields['logo_url'] = formData.logo_url;
    }

    if (Object.keys(changedFields).length === 0) {
      toast.info("No changes detected");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(company.id, changedFields);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
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
          <ModalScrollLock />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white backdrop-blur-xl w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 m-auto flex flex-col overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-6 sticky top-0 bg-white z-10 pb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Company</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mt-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FaBuilding className="w-4 h-4" />
                  Basic Information
                </h3>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaBuilding className="w-3 h-3 text-indigo-500" />
                  Company Name
                </label>
                <input
                  name="name"
                  placeholder="e.g., Acme Corp"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaBuilding className="w-3 h-3 text-indigo-500" />
                  Legal Name
                </label>
                <input
                  name="legal_name"
                  placeholder="e.g., Acme Corp Pvt. Ltd."
                  value={formData.legal_name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaLink className="w-3 h-3 text-indigo-500" />
                  Company Logo
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="logo_url"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploadingLogo}
                      className="flex-1 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-sm disabled:opacity-50"
                    />
                    {isUploadingLogo && <FaSpinner className="w-5 h-5 text-indigo-600 animate-spin" />}
                    {(logoPreview || formData.logo_url) && !isUploadingLogo && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                          title="Preview logo"
                        >
                          <FaEye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                          title="Remove logo"
                        >
                          <FaTrash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {showPreview && (logoPreview || formData.logo_url) && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setShowPreview(false)}>
                      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setShowPreview(false)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <FaTimes className="w-4 h-4 text-gray-600" />
                        </button>
                        <img 
                          src={logoPreview || formData.logo_url} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-[80vh] object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                  
                  {(logoPreview || formData.logo_url) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={logoPreview || formData.logo_url} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {logoFile?.name || (formData.logo_url ? "Current logo" : "")}
                        </p>
                        {logoFile && (
                          <p className="text-xs text-gray-500">
                            {(logoFile.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <input
                        value={ipInputValue}
                        onChange={(e) => setIpInputValue(e.target.value)}
                        onKeyPress={handleIpKeyPress}
                        placeholder="e.g., 192.168.1.1 or 192.168.1.1, 8.8.8.8"
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddIp}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        <FaPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    
                    {formData.company_ips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.company_ips.map((ip, index) => (
                          <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                            <span className="text-sm text-gray-700 font-mono">{ip}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIp(ip)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <FaMinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">Add IP addresses one by one or comma-separated. Supports IPv4 addresses only.</p>
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
                  value={formData.address_line1}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
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
                  value={formData.address_line2}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
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
                  value={formData.city}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
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
                  value={formData.state}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
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
                  value={formData.postal_code}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaGlobe className="w-3 h-3 text-indigo-500" />
                  Country
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
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
                <input
                  name="latitude"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaCrosshairs className="w-3 h-3 text-indigo-500" />
                  Longitude
                </label>
                <input
                  name="longitude"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  disabled={addressMode === 'auto' && !isAddressAutoDetected}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${(addressMode === 'auto' && !isAddressAutoDetected) ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>

              {/* Manual Geocode Button */}
              {addressMode === 'manual' && (
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleManualGeocode}
                    disabled={isGeocoding}
                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {isGeocoding ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Getting Coordinates...
                      </>
                    ) : (
                      <>
                        <FaMapPin className="w-4 h-4" />
                        Get Coordinates from Address
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 order-2 sm:order-1 disabled:opacity-50"
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
                    Updating...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Update Company
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

export default EditCompanyModal;