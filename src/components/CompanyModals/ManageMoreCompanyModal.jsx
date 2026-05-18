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
  FaChevronDown,
  FaChevronUp,
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

function MethodTabButton({ tab, active, enabled, disabled, onClick, onExpand, onToggle }) {
  const Icon = methodIcon(tab.value);
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 sm:py-4 transition-all ${active ? 'bg-indigo-50/50 rounded-t-xl' : 'hover:bg-slate-50 rounded-xl'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex flex-1 items-center gap-4 text-left w-full overflow-hidden"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-500'
          }`}>
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] font-bold transition-colors ${active ? 'text-indigo-900' : 'text-gray-800'}`}>{tab.label}</span>
          <span className="block text-xs font-medium opacity-80 truncate text-gray-500 mt-0.5">{tab.description || tab.value}</span>
        </span>
        <span className={`flex-shrink-0 ml-1 mr-2 p-1.5 rounded-full transition-colors ${active ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
          {active ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </span>
      </button>

      <div className="flex shrink-0 items-center justify-center pl-2 pr-1">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={enabled}
            onChange={(e) => {
              onToggle();
              if (!active && onExpand) onExpand();
            }}
            disabled={disabled}
          />
          <div className={`h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center ${enabled ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-200' : 'border-gray-300 bg-white'
            }`}>
            <FaCheck className={`text-white transition-all transform ${enabled ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} size={12} />
          </div>
        </label>
      </div>
    </div>
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
  const originalAddress = useMemo(() => ({
    address_line1: company?.address_line1 || '',
    address_line2: company?.address_line2 || '',
    city: company?.city || '',
    state: company?.state || '',
    postal_code: company?.postal_code || '',
    country: company?.country || 'India',
    latitude: company?.latitude || '',
    longitude: company?.longitude || '',
  }), [company]);

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

  // Active method tracked via state

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

    let currentIps = [...ips];
    const rawIp = ipInput.trim();
    if (rawIp && !currentIps.includes(rawIp)) {
      currentIps.push(rawIp);
    }

    const normalizedIps = forceAutoDetect ? [] : currentIps.map((ip) => ip.trim()).filter(Boolean);
    const normalizedMethods = enabledMethods.map((method) => method.trim().toLowerCase()).filter(Boolean);

    const payload = {
      id: companyId,
      company_ips: normalizedIps,
      attendance_methods: normalizedMethods,
      // Always include address fields so GPS coordinates/address are persisted
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
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

    setSaving(true);
    try {
      const updatedPayload = await submitCompanyUpdate({ forceAutoDetect: false });

      toast.success('Company updated successfully');
      onSuccess?.(updatedPayload);
      onClose?.();
    } catch (error) {
      toast.error(error.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const renderMethodBody = (methodItem) => {
    if (!methodItem) return null;

    const methodEnabled = enabledMethods.includes(methodItem.value);

    if (methodItem.value === 'ip') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
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
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={addIp}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <FaPlus size={12} />
              Add
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
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

          <div className="pt-2">
            <button
              type="button"
              onClick={() => toggleMethod('ip')}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${enabledMethods.includes('ip')
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
            >
              <span>{enabledMethods.includes('ip') ? 'IP Restriction Enabled' : 'IP Restriction Disabled'}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${enabledMethods.includes('ip') ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {enabledMethods.includes('ip') ? <FaCheck size={12} /> : <FaTimes size={12} />}
              </span>
            </button>
          </div>
        </div>
      );
    }

    if (methodItem.value === 'gps') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
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
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Street, building, landmark"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address line 2</span>
              <input
                value={address.address_line2}
                onChange={(e) => setAddress((prev) => ({ ...prev, address_line2: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Apartment, suite, etc."
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">City</span>
              <input
                value={address.city}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="City"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">State</span>
              <input
                value={address.state}
                onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="State"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Postal code</span>
              <input
                value={address.postal_code}
                onChange={(e) => setAddress((prev) => ({ ...prev, postal_code: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Postal code"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Country</span>
              <input
                value={address.country}
                onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Country"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Latitude</span>
              <input
                value={address.latitude}
                onChange={(e) => setAddress((prev) => ({ ...prev, latitude: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Latitude"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Longitude</span>
              <input
                value={address.longitude}
                onChange={(e) => setAddress((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Longitude"
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 flex-1"
            >
              <FaLocationArrow size={12} />
              Use current location
            </button>
            <button
              type="button"
              onClick={() => toggleMethod('gps')}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all flex-1 ${enabledMethods.includes('gps')
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
            >
              <span>{enabledMethods.includes('gps') ? 'GPS Enabled' : 'GPS Disabled'}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${enabledMethods.includes('gps') ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {enabledMethods.includes('gps') ? <FaCheck size={12} /> : <FaTimes size={12} />}
              </span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{methodItem.label}</p>
              <p className="mt-1 text-xs text-slate-600">{methodItem.description}</p>
            </div>
            <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${methodItem.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
              }`}>
              {methodItem.isAvailable ? 'Available' : 'Unavailable'}
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <FaClock className="text-slate-400" />
              <span>Method key: {methodItem.value}</span>
            </div>
            <div className="flex items-center gap-2">
              {methodItem.requiresDevice && <span className="rounded-full bg-white px-2 py-1">Requires device</span>}
              {methodItem.requiresLocation && <span className="rounded-full bg-white px-2 py-1">Requires location</span>}
              {methodItem.requiresCamera && <span className="rounded-full bg-white px-2 py-1">Requires camera</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleMethod(methodItem.value)}
          disabled={!methodItem.isAvailable}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${methodEnabled
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50'
            } ${!methodItem.isAvailable ? 'cursor-not-allowed opacity-50' : ''}`}
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
            className="bg-white relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl border border-gray-100 m-auto flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-white z-10 flex-shrink-0">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <FaInfoCircle className="text-indigo-500" />
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

            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 scrollbar-none bg-slate-50/50">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
                  <FaBuilding size={11} />
                  {company?.name || 'Company'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm">
                  <FaUserCheck size={11} />
                  {enabledMethods.length} enabled
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
                  <FaWifi size={11} />
                  {ips.length} IPs
                </span>
              </div>

              {loadingMethods ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-400">
                  <FaSpinner className="mr-2 animate-spin text-indigo-500" />
                  Loading methods...
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {availableMethods.map((tab) => {
                    const isActive = activeMethod === tab.value;
                    const isEnabled = enabledMethods.includes(tab.value);
                    return (
                      <div key={tab.value} className={`bg-white rounded-xl border transition-all duration-300 ${isActive ? 'border-indigo-200 shadow-lg ring-1 ring-indigo-50' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                        <MethodTabButton
                          tab={tab}
                          active={isActive}
                          enabled={isEnabled}
                          disabled={!tab.isAvailable}
                          onClick={() => setActiveMethod(isActive ? null : tab.value)}
                          onExpand={() => setActiveMethod(tab.value)}
                          onToggle={() => toggleMethod(tab.value)}
                        />
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-gray-100 bg-white p-5 sm:p-7">
                                {renderMethodBody(tab)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  {availableMethods.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                      No attendance methods found.
                    </div>
                  )}
                </div>
              )}
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
