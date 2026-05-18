import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import apiCall, { uploadFile } from "../../utils/api";
import { getPreciseLocation } from "../../utils/geolocation";
import {
  FaBuilding, FaTimes, FaCheck, FaSpinner,
  FaMapMarkerAlt, FaGlobe, FaCity, FaRoad,
  FaEnvelope, FaMapPin, FaLink,
  FaEye, FaTrash, FaCrosshairs, FaChevronDown
} from "react-icons/fa";
import ModalScrollLock from "../ModalScrollLock";

const GEOCODING_API = "https://nominatim.openstreetmap.org/search";

// Collapsible Section Component
function CollapsibleSection({ title, icon, children, defaultOpen = false, badge = null }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="md:col-span-2 border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-indigo-500">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {badge && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium">
              {badge}
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FaChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="p-4 bg-white space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [addressMode, setAddressMode] = useState('manual');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressAutoDetected, setIsAddressAutoDetected] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Load company data when modal opens
  useEffect(() => {
    if (company && isOpen) {
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
      setAddressMode('manual');
      setIsAddressAutoDetected(false);
      setLogoPreview(null);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [company, isOpen]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
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
    setFormData(prev => ({ ...prev, logo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (addressMode === 'auto' && !isAddressAutoDetected) {
      setAddressMode('manual');
      setIsAddressAutoDetected(false);
    }
  };

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

  const handleManualGeocode = async () => {
    const addressString = [
      formData.address_line1, formData.city,
      formData.state, formData.postal_code, formData.country
    ].filter(Boolean).join(", ");

    if (addressString.split(", ").length < 2) {
      toast.warning("Please enter at least address line and city to get coordinates");
      return;
    }
    setIsGeocoding(true);
    try {
      const params = new URLSearchParams({ q: addressString, format: 'json', limit: 1, addressdetails: 1 });
      const response = await fetch(`${GEOCODING_API}?${params}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AttendanceApp/1.0' }
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
      toast.error("Failed to get coordinates");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    const changedFields = {};

    Object.keys(formData).forEach(key => {
      if (key !== 'logo_url' && formData[key] !== originalData[key]) {
        if (formData[key] || originalData[key]) {
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

  const inputClass = "w-full border border-gray-200 p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm";
  const disabledClass = "bg-gray-50 text-gray-400 cursor-not-allowed";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalScrollLock />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-white z-10 flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FaBuilding className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Company</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your company details</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ── Basic Information ── */}
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FaBuilding className="w-3 h-3" /> Basic Information
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    name="name"
                    placeholder="e.g., Acme Corp"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Legal Name</label>
                  <input
                    name="legal_name"
                    placeholder="e.g., Acme Corp Pvt. Ltd."
                    value={formData.legal_name}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Company Logo */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <FaLink className="w-3 h-3 text-indigo-500" /> Company Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploadingLogo}
                      className="flex-1 border border-gray-200 p-2 rounded-xl text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                    />
                    {isUploadingLogo && <FaSpinner className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />}
                    {(logoPreview || formData.logo_url) && !isUploadingLogo && (
                      <>
                        <button type="button" onClick={() => setShowPreview(!showPreview)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors" title="Preview">
                          <FaEye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button type="button" onClick={handleRemoveLogo}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors" title="Remove">
                          <FaTrash className="w-4 h-4 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                  {(logoPreview || formData.logo_url) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <img
                        src={logoPreview || formData.logo_url}
                        alt="Logo"
                        className="w-14 h-14 rounded-lg object-cover bg-white border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {logoFile?.name || "Current logo"}
                        </p>
                        {logoFile?.size && (
                          <p className="text-xs text-gray-400">{(logoFile.size / 1024).toFixed(2)} KB</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Address Information (Collapsible) ── */}
                <CollapsibleSection
                  title="Address Information"
                  icon={<FaMapMarkerAlt className="w-4 h-4" />}
                  badge={formData.city || null}
                >
                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="addressMode" value="auto"
                          checked={addressMode === 'auto'} onChange={() => handleAddressModeChange('auto')}
                          className="text-indigo-600 w-3.5 h-3.5" />
                        <span className="text-xs text-gray-700 font-medium">Auto-detect</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="addressMode" value="manual"
                          checked={addressMode === 'manual'} onChange={() => handleAddressModeChange('manual')}
                          className="text-indigo-600 w-3.5 h-3.5" />
                        <span className="text-xs text-gray-700 font-medium">Manual Entry</span>
                      </label>
                    </div>
                    {isGeocoding && (
                      <span className="text-xs text-indigo-500 flex items-center gap-1">
                        <FaSpinner className="w-3 h-3 animate-spin" /> Detecting...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaRoad className="w-3 h-3 text-indigo-400" /> Address Line 1
                      </label>
                      <input name="address_line1" placeholder="Street address, P.O. box"
                        value={formData.address_line1} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaRoad className="w-3 h-3 text-indigo-400" /> Address Line 2
                      </label>
                      <input name="address_line2" placeholder="Apartment, suite, unit, etc."
                        value={formData.address_line2} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaCity className="w-3 h-3 text-indigo-400" /> City
                      </label>
                      <input name="city" placeholder="City" value={formData.city} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaGlobe className="w-3 h-3 text-indigo-400" /> State
                      </label>
                      <input name="state" placeholder="State" value={formData.state} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaEnvelope className="w-3 h-3 text-indigo-400" /> Postal Code
                      </label>
                      <input name="postal_code" placeholder="Postal Code" value={formData.postal_code} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FaGlobe className="w-3 h-3 text-indigo-400" /> Country
                      </label>
                      <input name="country" value={formData.country} onChange={handleChange}
                        disabled={addressMode === 'auto' && !isAddressAutoDetected}
                        className={`${inputClass} ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FaMapPin className="w-3 h-3" /> Coordinates
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <FaCrosshairs className="w-3 h-3 text-indigo-400" /> Latitude
                        </label>
                        <div className="relative">
                          <input name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange}
                            disabled={addressMode === 'auto' && !isAddressAutoDetected}
                            className={`${inputClass} pr-8 ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                          {formData.latitude && <FaCheck className="absolute right-3 top-3 w-3.5 h-3.5 text-green-500" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <FaCrosshairs className="w-3 h-3 text-indigo-400" /> Longitude
                        </label>
                        <div className="relative">
                          <input name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange}
                            disabled={addressMode === 'auto' && !isAddressAutoDetected}
                            className={`${inputClass} pr-8 ${(addressMode === 'auto' && !isAddressAutoDetected) ? disabledClass : ''}`} />
                          {formData.longitude && <FaCheck className="absolute right-3 top-3 w-3.5 h-3.5 text-green-500" />}
                        </div>
                      </div>
                    </div>
                    {addressMode === 'manual' && (
                      <button type="button" onClick={handleManualGeocode} disabled={isGeocoding}
                        className="mt-3 w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {isGeocoding
                          ? <><FaSpinner className="w-4 h-4 animate-spin" /> Getting Coordinates...</>
                          : <><FaMapPin className="w-4 h-4" /> Get Coordinates from Address</>}
                      </button>
                    )}
                  </div>
                </CollapsibleSection>

              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
              <button onClick={onClose} disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting
                  ? <><FaSpinner className="w-4 h-4 animate-spin" /> Updating...</>
                  : <><FaCheck className="w-4 h-4" /> Update Company</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Logo Preview Overlay */}
      {showPreview && (logoPreview || formData.logo_url) && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative bg-white rounded-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPreview(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100">
              <FaTimes className="w-4 h-4 text-gray-600" />
            </button>
            <img src={logoPreview || formData.logo_url} alt="Logo Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditCompanyModal;