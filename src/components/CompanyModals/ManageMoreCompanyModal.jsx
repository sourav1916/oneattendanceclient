import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaCheck,
  FaBuilding,
  FaClock,
  FaPlus,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaWifi,
  FaMapMarkerAlt,
  FaGlobe,
  FaCity,
  FaRoad,
  FaCrosshairs,
  FaUserCheck,
  FaCamera,
  FaQrcode,
  FaFingerprint,
  FaInfoCircle,
  FaLocationArrow,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiCall from '../../utils/api';
import { getPreciseLocation } from '../../utils/geolocation';
import ModalScrollLock from '../ModalScrollLock';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', duration: 0.45 } },
  exit: { opacity: 0, scale: 0.96, y: 18, transition: { duration: 0.2 } },
};

const getCompanyId = (company) => company?.id ?? null;

const parseIPs = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') return String(item.ip_v4 || item.ip || item.value || '').trim();
        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseIPs(parsed);
    } catch {
      return [value.trim()].filter(Boolean);
    }
  }

  return [];
};

const parseMethods = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim().toLowerCase();
        if (item && typeof item === 'object') {
          return String(item.method || item.key || item.id || item.value || '').trim().toLowerCase();
        }
        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseMethods(parsed);
    } catch {
      return [value.trim().toLowerCase()].filter(Boolean);
    }
  }

  return [];
};

const normalizeMethodOptions = (items = []) =>
  items.map((item) => ({
    key: String(item.key || '').toLowerCase(),
    value: String(item.value?.value || item.value || '').toLowerCase(),
    label: item.value?.label || item.label || item.key,
    description: item.value?.description || '',
    requiresDevice: !!item.value?.requiresDevice,
    requiresLocation: !!item.value?.requiresLocation,
    requiresCamera: !!item.value?.requiresCamera,
    isAvailable: item.value?.is_available !== false,
  })).filter((item) => item.value);

const methodIcon = (value) => {
  switch (value) {
    case 'gps':
      return FaLocationArrow;
    case 'ip':
      return FaWifi;
    case 'face':
      return FaCamera;
    case 'qr':
      return FaQrcode;
    case 'fingerprint':
      return FaFingerprint;
    case 'manual':
    default:
      return FaUserCheck;
  }
};

function MethodTabButton({ tab, active, disabled, onClick }) {
  const Icon = methodIcon(tab.value);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
        active
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
          : disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
            : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
        active ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-500'
      }`}>
        <Icon size={14} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{tab.label}</span>
        <span className="block text-[11px] opacity-70">{tab.description || tab.value}</span>
      </span>
    </button>
  );
}

export default function ManageMoreCompanyModal({ isOpen, company, onClose, onSuccess }) {
  const [availableMethods, setAvailableMethods] = useState([]);
  const [activeMethod, setActiveMethod] = useState('manual');
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState([]);
  const [ips, setIps] = useState([]);
  const [ipInput, setIpInput] = useState('');
  const [ipMode, setIpMode] = useState('manual');
  const [address, setAddress] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    latitude: '',
    longitude: '',
  });

  const companyId = getCompanyId(company);

  const originalIps = useMemo(() => parseIPs(company?.company_ips || []), [company]);
  const originalEnabledMethods = useMemo(() => parseMethods(company?.attendance_methods || []), [company]);

  useEffect(() => {
    if (!isOpen || !company) return;

    setIps(parseIPs(company.company_ips || []));
    setEnabledMethods(parseMethods(company.attendance_methods || []));
    setIpMode('manual');
    setAddress({
      address_line1: company.address_line1 || '',
      address_line2: company.address_line2 || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.postal_code || '',
      country: company.country || 'India',
      latitude: company.latitude || '',
      longitude: company.longitude || '',
    });
    setIpInput('');
  }, [company, isOpen]);

  useEffect(() => {
    if (!isOpen || !companyId) return;

    let ignore = false;

    const loadAttendanceMethods = async () => {
      setLoadingMethods(true);
      try {
        const response = await apiCall('/constants/?type=attendance_method', 'GET', null, companyId);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load attendance methods');
        }

        const options = normalizeMethodOptions(result.data?.attendance_methods || []);
        if (!ignore) {
          setAvailableMethods(options);
          const preferred = options.find((option) => option.value === 'manual') || options[0];
          if (preferred) {
            setActiveMethod((current) => (current && options.some((option) => option.value === current) ? current : preferred.value));
          }
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error.message || 'Failed to load attendance methods');
          setAvailableMethods([]);
        }
      } finally {
        if (!ignore) {
          setLoadingMethods(false);
        }
      }
    };

    loadAttendanceMethods();

    return () => {
      ignore = true;
    };
  }, [companyId, isOpen]);

  const activeTab = availableMethods.find((method) => method.value === activeMethod) || availableMethods[0];

  const toggleMethod = (methodValue) => {
    setEnabledMethods((prev) =>
      prev.includes(methodValue)
        ? prev.filter((item) => item !== methodValue)
        : [...prev, methodValue]
    );
  };

  const addIp = () => {
    const next = ipInput.trim();
    if (!next) return;
    if (ips.includes(next)) {
      toast.info('IP already added');
      return;
    }
    setIps((prev) => [...prev, next]);
    setIpInput('');
  };

  const removeIp = (value) => {
    setIps((prev) => prev.filter((ip) => ip !== value));
  };

  const submitCompanyUpdate = async ({ forceAutoDetect = false } = {}) => {
    if (!companyId) return;

    const normalizedIps = forceAutoDetect ? [] : ips.map((ip) => ip.trim()).filter(Boolean);
    const normalizedMethods = enabledMethods.map((method) => method.trim().toLowerCase()).filter(Boolean);

    if (activeTab?.value && !normalizedMethods.includes(activeTab.value)) {
      normalizedMethods.push(activeTab.value);
    }

    const payload = {
      id: companyId,
      company_ips: normalizedIps,
      attendance_methods: normalizedMethods,
    };

    if (!forceAutoDetect && normalizedIps.length === 0) {
      payload.clear_ips = true;
    }

    const response = await apiCall('/company/update', 'PUT', payload, companyId);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to update company');
    }

    return payload;
  };

  const handleAutoDetectIps = async () => {
    setSaving(true);
    try {
      setIpMode('auto');
      const payload = await submitCompanyUpdate({ forceAutoDetect: true });
      toast.success('Company IP auto-detected successfully');
      onSuccess?.(payload);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to auto-detect IP');
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getPreciseLocation({ fetchAddress: true });
      setAddress((prev) => ({
        ...prev,
        latitude: String(position.latitude ?? ''),
        longitude: String(position.longitude ?? ''),
        address_line1: position.address?.line1 || prev.address_line1,
        address_line2: position.address?.line2 || prev.address_line2,
        city: position.address?.city || prev.city,
        state: position.address?.state || prev.state,
        postal_code: position.address?.postal_code || prev.postal_code,
        country: position.address?.country || prev.country,
      }));
      toast.success('Location detected successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to detect location');
    }
  };

  const handleSubmit = async () => {
    if (!companyId) return;

    const normalizedIps = ips.map((ip) => ip.trim()).filter(Boolean);
    const normalizedMethods = enabledMethods.map((method) => method.trim().toLowerCase()).filter(Boolean);

    if (activeTab?.value && !normalizedMethods.includes(activeTab.value)) {
      normalizedMethods.push(activeTab.value);
    }

    const changed =
      normalizedIps.length !== originalIps.length ||
      normalizedIps.some((ip, index) => ip !== originalIps[index]) ||
      normalizedMethods.length !== originalEnabledMethods.length ||
      normalizedMethods.some((method, index) => method !== originalEnabledMethods[index]);

    const payload = {
      id: companyId,
      company_ips: normalizedIps,
      attendance_methods: normalizedMethods,
    };

    if (ipMode === 'manual' && normalizedIps.length === 0) {
      payload.clear_ips = true;
    }

    if (!changed) {
      toast.info('No changes detected');
      onClose?.();
      return;
    }

    setSaving(true);
    try {
      const updatedPayload = await submitCompanyUpdate({ forceAutoDetect: false });

      toast.success('Company updated successfully');
      onSuccess?.(updatedPayload || payload);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const renderMethodBody = () => {
    if (!activeTab) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          <FaInfoCircle className="mx-auto mb-2" />
          No attendance method data available.
        </div>
      );
    }

    const methodEnabled = enabledMethods.includes(activeTab.value);

    if (activeTab.value === 'ip') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">Manage IP addresses</p>
            <p className="mt-1 text-xs text-indigo-700">
              These IPs will be sent as `company_ips` to the company update API.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ips.length > 0 ? ips.map((ip) => (
              <span
                key={ip}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
              >
                {ip}
                <button
                  type="button"
                  onClick={() => removeIp(ip)}
                  className="rounded-full p-0.5 text-indigo-400 transition hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )) : (
              <span className="text-sm text-gray-400">No IP restrictions configured</span>
            )}
          </div>

          <div className="flex gap-3">
            <input
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addIp();
                }
              }}
              placeholder="Enter IP address"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={addIp}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <FaPlus size={12} />
              Add
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Auto detect or clear IPs</p>
              <p className="text-xs text-gray-400">Auto detect stores the current request IP. Clear removes all restrictions.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAutoDetectIps}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => setIps([])}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
              >
                <FaTrash className="mr-2 inline" size={10} />
                Clear
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab.value === 'gps') {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">GPS attendance settings</p>
            <p className="mt-1 text-xs text-blue-700">
              Update the company address and coordinates used for location-based attendance.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address line 1</span>
              <input
                value={address.address_line1}
                onChange={(e) => setAddress((prev) => ({ ...prev, address_line1: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Street, building, landmark"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address line 2</span>
              <input
                value={address.address_line2}
                onChange={(e) => setAddress((prev) => ({ ...prev, address_line2: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Apartment, suite, etc."
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">City</span>
              <input
                value={address.city}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="City"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">State</span>
              <input
                value={address.state}
                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="State"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Postal code</span>
              <input
                value={address.postal_code}
                onChange={(e) => setAddress((prev) => ({ ...prev, postal_code: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Postal code"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Country</span>
              <input
                value={address.country}
                onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Country"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Latitude</span>
              <input
                value={address.latitude}
                onChange={(e) => setAddress((prev) => ({ ...prev, latitude: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Latitude"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Longitude</span>
              <input
                value={address.longitude}
                onChange={(e) => setAddress((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Longitude"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <FaLocationArrow size={12} />
            Use current location
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeTab.label}</p>
              <p className="mt-1 text-xs text-slate-600">{activeTab.description}</p>
            </div>
            <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
              activeTab.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {activeTab.isAvailable ? 'Available' : 'Unavailable'}
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <FaClock className="text-slate-400" />
              <span>Method key: {activeTab.value}</span>
            </div>
            <div className="flex items-center gap-2">
              {activeTab.requiresDevice && <span className="rounded-full bg-white px-2 py-1">Requires device</span>}
              {activeTab.requiresLocation && <span className="rounded-full bg-white px-2 py-1">Requires location</span>}
              {activeTab.requiresCamera && <span className="rounded-full bg-white px-2 py-1">Requires camera</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleMethod(activeTab.value)}
          disabled={!activeTab.isAvailable}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
            methodEnabled
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
          } ${!activeTab.isAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span>{methodEnabled ? 'Enabled for company' : 'Disabled for company'}</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${methodEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {methodEnabled ? <FaCheck size={12} /> : <FaTimes size={12} />}
          </span>
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 px-4 sm:px-2"
          onClick={onClose}
        >
          <ModalScrollLock />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-white z-10 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                <FaInfoCircle />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage More</h2>
                <p className="text-xs text-gray-400 mt-0.5">Configure attendance methods, IPs, and GPS address details</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-auto w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="grid gap-0 lg:grid-cols-[300px_1fr] flex-1 min-h-0 overflow-scroll scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-50">
              <div className="border-b border-gray-100 bg-gray-50/80 p-4 lg:border-b-0 lg:border-r lg:overflow-y-auto">
                <div className="mb-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Attendance Tabs</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">Choose a method</p>
                </div>

                {loadingMethods ? (
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-400">
                    <FaSpinner className="mr-2 animate-spin text-indigo-500" />
                    Loading methods...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableMethods.map((tab) => (
                      <MethodTabButton
                        key={tab.value}
                        tab={tab}
                        active={activeMethod === tab.value}
                        disabled={!tab.isAvailable}
                        onClick={() => setActiveMethod(tab.value)}
                      />
                    ))}
                    {availableMethods.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                        No attendance methods found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 lg:overflow-y-auto">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <FaBuilding size={11} />
                    {company?.name || 'Company'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <FaUserCheck size={11} />
                    {enabledMethods.length} enabled
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
                    <FaWifi size={11} />
                    {ips.length} IPs
                  </span>
                </div>

                {renderMethodBody()}
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <FaSpinner className="mr-2 inline animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2 inline" size={12} />
                    Save Changes
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
