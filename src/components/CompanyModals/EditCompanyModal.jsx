import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { 
  FaBuilding, FaMapMarkerAlt, FaGlobe, FaCity, FaRoad,
  FaEnvelope, FaMapPin, FaLink, FaPlus, FaMinusCircle,
  FaEye, FaTrash
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";

const GEOCODING_API = "https://nominatim.openstreetmap.org/reverse";

function EditCompanyModal({ isOpen, onClose, onSuccess, company }) {
  const [formData, setFormData] = useState({
    company_ip: [], // Changed to array
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
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
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

  // Add IP to list
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
        company_ip: [...prev.company_ip, ...validIps]
      }));
      setIpInputValue("");
    }
  };

  // Remove IP from list
  const handleRemoveIp = (ipToRemove) => {
    setFormData(prev => ({
      ...prev,
      company_ip: prev.company_ip.filter(ip => ip !== ipToRemove)
    }));
  };

  const handleIpKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIp();
    }
  };

  useEffect(() => {
    if (company) {
      // Parse company_ip if it's a string, otherwise use as is
      let ipArray = [];
      if (company.company_ip) {
        if (Array.isArray(company.company_ip)) {
          ipArray = company.company_ip;
        } else if (typeof company.company_ip === 'string') {
          try {
            ipArray = JSON.parse(company.company_ip);
          } catch {
            ipArray = company.company_ip.split(',').map(ip => ip.trim()).filter(ip => ip);
          }
        }
      }
      
      const data = {
        company_ip: ipArray,
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
    }
  }, [company]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
              const response = await fetch(`${GEOCODING_API}?${params}`, {
                headers: {
                  'Accept': 'application/json',
                  'User-Agent': 'AttendanceApp/1.0'
                }
              });
              const data = await response.json();
              if (data && data.address) {
                setFormData(prev => ({
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
                setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lon.toString() }));
                toast.info("📍 Coordinates detected, but could not resolve address.");
              }
            } catch (err) {
              console.error("Reverse geocoding error:", err);
              setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lon.toString() }));
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

  const handleSubmit = () => {
    const changedFields = {};
    
    // Check for IP changes
    const originalIpArray = originalData.company_ip || [];
    const currentIpArray = formData.company_ip || [];
    
    if (ipMode === 'manual') {
      if (JSON.stringify(originalIpArray) !== JSON.stringify(currentIpArray)) {
        changedFields.company_ip = currentIpArray;
      }
    } else if (ipMode === 'auto' && originalIpArray.length > 0) {
      changedFields.company_ip = [];
    }
    
    // Check other fields
    Object.keys(formData).forEach(key => {
      if (key !== 'logo_url' && key !== 'company_ip' && formData[key] !== originalData[key]) {
        changedFields[key] = formData[key];
      }
    });

    if (logoFile) {
      changedFields['logo_url'] = logoFile;
    }

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
          <ModalScrollLock />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white backdrop-blur-xl w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 m-auto flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Company</h2>
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
                      className="flex-1 border border-gray-200 p-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-sm"
                    />
                    {logoPreview && (
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
                  
                  {showPreview && logoPreview && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={() => setShowPreview(false)}>
                      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setShowPreview(false)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <FaTimes className="w-4 h-4 text-gray-600" />
                        </button>
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="max-w-full max-h-[80vh] object-contain rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                  
                  {logoPreview && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{logoFile?.name}</p>
                        <p className="text-xs text-gray-500">
                          {(logoFile?.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveLogo}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FaTrash className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                  
                  {!logoPreview && formData.logo_url && (
                    <p className="text-xs text-gray-500 pl-2 mt-1">Current logo exists. Select new file to replace.</p>
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
                    
                    {formData.company_ip.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.company_ip.map((ip, index) => (
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
                  <p className="text-xs text-gray-500 pt-1">The system will automatically record the valid network IP via connection headers. An empty array [] will be sent to backend.</p>
                )}
              </div>

              {/* Address toggle header - same as before */}
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

              {/* Rest of the address fields remain the same */}
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
                  value={formData.address_line2}
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
                  value={formData.city}
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
                  value={formData.state}
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
                  value={formData.postal_code}
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
                  <FaMapPin className="w-3 h-3 text-indigo-500" />
                  Latitude
                </label>
                <input
                  name="latitude"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <FaMapPin className="w-3 h-3 text-indigo-500" />
                  Longitude
                </label>
                <input
                  name="longitude"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  disabled={addressMode === 'auto'}
                  className={`w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm ${addressMode === 'auto' ? 'bg-gray-50 text-gray-500' : ''}`}
                />
              </div>
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
