import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaEdit, FaTrash, FaEye, FaTimes, FaCheck, FaSearch, FaSpinner,
  FaEllipsisV, FaShieldAlt, FaPlus, FaInfoCircle, FaCode,
  FaLayerGroup, FaTag, FaAlignLeft, FaBan, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import apiCall from '../utils/api';
import Pagination, { usePagination } from '../components/PaginationComponent';
import ModalScrollLock from '../components/ModalScrollLock';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODAL_TYPES = {
    NONE: 'NONE',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    VIEW: 'VIEW',
    DELETE_CONFIRM: 'DELETE_CONFIRM',
    PERM_LIST: 'PERM_LIST'
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.3 } }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const GROUP_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
];

const PACKAGE_REQUEST_CACHE_TTL = 5000;
let permissionListRequestCache = { companyId: null, promise: null, data: null };
const permissionPackagesRequestCache = new Map();

const getPermissionPackagesCacheKey = ({ companyId, page, limit, search }) =>
  `${companyId ?? 'none'}|${page}|${limit}|${search ?? ''}`;

// ─── Package Form ─────────────────────────────────────────────────────────────
const PackageFormBody = ({
  onSubmit, isEdit = false,
  formData, onInputChange, onTogglePermission, onSelectAll, onClearAll,
  allPermissions, permsLoading, loading, onClose,
}) => (
  <form onSubmit={onSubmit} className="p-3 sm:p-6">
    {permsLoading ? (
      <div className="flex justify-center py-12 text-center">
        <div>
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading permissions...</p>
        </div>
      </div>
    ) : (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaLayerGroup className="text-blue-500" /> Package Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="package_name" value={formData.package_name}
              onChange={onInputChange} required placeholder="e.g. HR Manager Package"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaCode className="text-purple-500" /> Group Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="group_code" value={formData.group_code}
              onChange={onInputChange} required placeholder="e.g. HR_MGR"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FaAlignLeft className="text-emerald-500" /> Description
            </label>
            <input
              type="text" name="description" value={formData.description}
              onChange={onInputChange} placeholder="Brief description..."
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-300 bg-white hover:border-gray-400 text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaShieldAlt className="text-blue-500" /> Assign Permissions
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{formData.permissions.length} selected</span>
            </h3>
            <div className="flex gap-2">
              <button type="button" onClick={onSelectAll} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium border border-blue-200">Select All</button>
              <button type="button" onClick={onClearAll} className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-medium border border-gray-200">Clear All</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 rounded-xl">
            {allPermissions.map((perm) => {
              const isSelected = formData.permissions.includes(perm.id);
              return (
                <motion.div key={perm.id} whileTap={{ scale: 0.97 }}
                  onClick={() => onTogglePermission(perm.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/40'}`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <FaCheck size={8} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 leading-tight">{perm.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{perm.code}</p>
                  </div>
                </motion.div>
              );
            })}
            {allPermissions.length === 0 && (
              <div className="col-span-2 text-center py-6 text-gray-400 text-sm">No permissions available</div>
            )}
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <FaInfoCircle className="text-blue-500 flex-shrink-0" />
              Click permissions to toggle selection. All selected permissions will be assigned to this package.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 sm:px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-sm">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm">
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheck size={12} />}
            {isEdit ? 'Update Package' : 'Create Package'}
          </button>
        </div>
      </>
    )}
  </form>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PermissionManagement = () => {
  const [packages, setPackages] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permsLoading, setPermsLoading] = useState(false);
  // ✅ No error state — all errors go to toast only
  const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { pagination, updatePagination, goToPage } = usePagination(1, 6);
  const permsFetched = useRef(false);
  const isInitialLoad = useRef(true);
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);

  const emptyForm = { package_name: '', group_code: '', description: '', permissions: [] };
  const [formData, setFormData] = useState(emptyForm);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset page on new search
  useEffect(() => {
    if (!isInitialLoad.current) {
      if (pagination.page !== 1) goToPage(1);
      else fetchPackages(1);
    }
  }, [debouncedSearch]);

  // ─── API Calls ────────────────────────────────────────────────────────────
  const fetchAllPermissions = useCallback(async () => {
    if (permsFetched.current) return;
    setPermsLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const companyId = company?.id ?? null;

      if (permissionListRequestCache.companyId === companyId && permissionListRequestCache.data) {
        setAllPermissions(permissionListRequestCache.data);
        permsFetched.current = true;
        return;
      }

      if (permissionListRequestCache.companyId !== companyId) {
        permissionListRequestCache = { companyId, promise: null, data: null };
      }

      if (!permissionListRequestCache.promise) {
        permissionListRequestCache.promise = (async () => {
          const res = await apiCall('/permissions/list', 'GET', null, companyId);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const result = await res.json();
          if (!result.success) throw new Error(result.message || 'Failed to fetch permissions');

          permissionListRequestCache = {
            companyId,
            promise: null,
            data: result.data
          };

          return result.data;
        })().catch((error) => {
          permissionListRequestCache = { companyId, promise: null, data: null };
          throw error;
        });
      }

      const permissions = await permissionListRequestCache.promise;
      setAllPermissions(permissions);
      permsFetched.current = true;
    } catch (e) {
      console.error('fetchAllPermissions:', e);
      toast.error('Failed to load permissions list');
    } finally {
      setPermsLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async (page = pagination.page, resetLoading = true) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    if (resetLoading) setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const companyId = company?.id ?? null;
      const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
      if (debouncedSearch) params.append('search', debouncedSearch);

      const requestKey = getPermissionPackagesCacheKey({
        companyId,
        page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      const cachedEntry = permissionPackagesRequestCache.get(requestKey);
      let result;

      if (cachedEntry?.data && cachedEntry.expiresAt > Date.now()) {
        result = cachedEntry.data;
      } else if (cachedEntry?.promise) {
        result = await cachedEntry.promise;
      } else {
        const requestPromise = (async () => {
          const res = await apiCall(`/permissions/permission-packages?${params}`, 'GET', null, companyId);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.message || 'Failed to fetch packages');

          permissionPackagesRequestCache.set(requestKey, {
            data: json,
            expiresAt: Date.now() + PACKAGE_REQUEST_CACHE_TTL
          });

          return json;
        })().catch((error) => {
          permissionPackagesRequestCache.delete(requestKey);
          throw error;
        });

        permissionPackagesRequestCache.set(requestKey, { promise: requestPromise });
        result = await requestPromise;
      }

      if (result.success) {
        const d = result.data;
        const list = d?.packages ?? d ?? [];
        const total = d?.total ?? list.length;
        const total_pages = (d?.totalPages ?? d?.total_pages ?? Math.ceil(total / pagination.limit)) || 1;
        const cur_page = d?.page ?? page;
        const cur_limit = d?.limit ?? pagination.limit;
        setPackages(list);
        updatePagination({ page: cur_page, limit: cur_limit, total, total_pages, is_last_page: cur_page >= total_pages });
      } else throw new Error(result.message || 'Failed to fetch packages');
    } catch (e) {
      console.error('fetchPackages:', e);
      toast.error(e.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
      isInitialLoad.current = false;
    }
  }, [pagination.page, pagination.limit, debouncedSearch, updatePagination]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllPermissions();
      fetchPackages(1, true);
    }
  }, [fetchPackages, fetchAllPermissions]);

  useEffect(() => {
    if (!isInitialLoad.current && !fetchInProgress.current && initialFetchDone.current) {
      fetchPackages(pagination.page, true);
    }
  }, [pagination.page, fetchPackages]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const createPackage = async (data) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/permissions/create-package', 'POST', {
        package_name: data.package_name,
        group_code: data.group_code,
        description: data.description,
        permissions: data.permissions
      }, company?.id);

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `HTTP ${res.status}`);
      if (result.success) return { success: true };
      throw new Error(result.message || 'Create failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const updatePackage = async (data) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/permissions/update-package', 'PUT', {
        id: data.id,
        package_name: data.package_name,
        group_code: data.group_code,
        description: data.description,
        permissions: data.permissions
      }, company?.id);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) return { success: true };
      throw new Error(result.message || 'Update failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  const deletePackage = async (packageId) => {
    setLoading(true);
    try {
      const company = JSON.parse(localStorage.getItem('company'));
      const res = await apiCall('/permissions/delete-package', 'DELETE', {
        "packageId": packageId
      }, company?.id);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) return { success: true };
      throw new Error(result.message || 'Delete failed');
    } catch (e) { return { success: false, error: e.message }; }
    finally { setLoading(false); }
  };

  // ─── Modal handlers ───────────────────────────────────────────────────────
  const openCreateModal = () => { setFormData(emptyForm); setModalType(MODAL_TYPES.CREATE); setActiveActionMenu(null); };
  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    const permIds = (pkg.permissions || []).map(p => typeof p === 'object' ? (p.permission_id ?? p.id) : p);
    setFormData({ package_name: pkg.package_name, group_code: pkg.group_code, description: pkg.description || '', permissions: permIds });
    setModalType(MODAL_TYPES.EDIT);
    setActiveActionMenu(null);
  };
  const openViewModal = (pkg) => { setSelectedPackage(pkg); setModalType(MODAL_TYPES.VIEW); setActiveActionMenu(null); };
  const openDeleteModal = (pkg) => { setSelectedPackage(pkg); setModalType(MODAL_TYPES.DELETE_CONFIRM); setActiveActionMenu(null); };
  const openPermListModal = (pkg) => { setSelectedPackage(pkg); setModalType(MODAL_TYPES.PERM_LIST); setActiveActionMenu(null); };
  const closeModal = () => { setModalType(MODAL_TYPES.NONE); setSelectedPackage(null); setFormData(emptyForm); };
  const toggleActionMenu = (e, id) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === id ? null : id); };

  // ─── Form handlers ────────────────────────────────────────────────────────
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    const result = await createPackage(formData);
    if (result.success) { permissionPackagesRequestCache.clear(); toast.success('Package created successfully!'); closeModal(); fetchPackages(1); }
    else toast.error(result.error || 'Failed to create package');
  };
  const handleEdit = async (e) => {
    e.preventDefault();
    const result = await updatePackage({ id: selectedPackage.id, ...formData });
    if (result.success) { permissionPackagesRequestCache.clear(); toast.success('Package updated successfully!'); closeModal(); fetchPackages(pagination.page, false); }
    else toast.error(result.error || 'Failed to update package');
  };
  const handleDelete = async () => {
    const result = await deletePackage(selectedPackage.id);
    if (result.success) { permissionPackagesRequestCache.clear(); toast.success('Package deleted successfully!'); closeModal(); fetchPackages(pagination.page, false); }
    else toast.error(result.error || 'Failed to delete package');
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const normalisePermission = useCallback((permEntry) => {
    if (permEntry === null || permEntry === undefined) return null;
    if (typeof permEntry === 'object') {
      return {
        id: permEntry.permission_id ?? permEntry.id,
        code: permEntry.permission_code ?? permEntry.code ?? '',
        name: permEntry.permission_name ?? permEntry.name ?? 'Unknown Permission',
        action: permEntry.permission_action ?? permEntry.action ?? '',
      };
    }
    const found = allPermissions.find(p => p.id === permEntry || p.id === Number(permEntry));
    return found ? { id: found.id, code: found.code, name: found.name, action: found.action } : null;
  }, [allPermissions]);

  const getGroupColor = (idx) => GROUP_COLORS[idx % GROUP_COLORS.length];

  useEffect(() => {
    const handler = () => setActiveActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage !== pagination.page) goToPage(newPage);
  }, [pagination.page, goToPage]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-2 sm:p-3 md:p-6 font-sans">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-center sm:text-left">
          Permission Management
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <div className="text-xs sm:text-sm text-gray-500 bg-white px-3 py-2 rounded-full shadow-sm whitespace-nowrap">
            Total: <span className="font-semibold text-blue-600">{pagination.total}</span> packages
          </div>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl text-xs sm:text-sm whitespace-nowrap">
            <FaPlus size={11} /><span>New Package</span>
          </button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 sm:mb-6">
        <div className="relative w-full">
          <input
            type="text" placeholder="Search packages by name, code, or description..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-lg transition-all text-sm"
          />
          <FaSearch className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-sm sm:text-xl" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-gray-600">
              <FaTimes size={13} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading && packages.length === 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-1/5" />
                <div className="h-4 bg-gray-100 rounded w-1/6" />
                <div className="h-4 bg-gray-100 rounded w-2/5" />
                <div className="flex gap-1.5 flex-1">
                  <div className="h-6 w-14 bg-gray-100 rounded-lg" />
                  <div className="h-6 w-14 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full ml-auto" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-3" />
                <div className="flex gap-2 flex-wrap">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-6 w-16 bg-gray-100 rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && packages.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-16 bg-white rounded-2xl shadow-xl">
          <FaShieldAlt className="text-6xl sm:text-8xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg sm:text-xl text-gray-500">No permission packages found</p>
          <p className="text-gray-400 mt-2 text-sm">Try adjusting your search or create a new package</p>
          <button onClick={openCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all text-sm">
            <FaPlus size={12} /> Create Package
          </button>
        </motion.div>
      )}

      {/* Desktop Table + Mobile Cards */}
      {!loading && packages.length > 0 && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Package Name</th>
                    <th className="px-6 py-4">Group Code</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Description</th>
                    <th className="px-6 py-4 text-center">Permissions</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.map((pkg, index) => (
                    <motion.tr key={pkg.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl flex-shrink-0"><FaShieldAlt className="text-white text-xs" /></div>
                          <span className="font-semibold text-gray-800 truncate max-w-[160px]">{pkg.package_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                          <FaCode size={9} />{pkg.group_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-gray-500 text-xs line-clamp-2 max-w-[220px] block">
                          {pkg.description || <span className="italic text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(pkg.permissions?.length || 0) > 0 ? (
                          <button onClick={() => openPermListModal(pkg)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 text-xs font-bold hover:from-blue-100 hover:to-purple-100 hover:border-blue-400 hover:shadow-md transition-all duration-200 group">
                            <FaShieldAlt size={10} className="text-purple-500 group-hover:scale-110 transition-transform" />
                            {pkg.permissions.length} permission{pkg.permissions.length !== 1 ? 's' : ''}
                          </button>
                        ) : <span className="text-xs text-gray-400 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button onClick={e => toggleActionMenu(e, pkg.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:shadow-md">
                          <FaEllipsisV className="text-gray-600 text-xs" />
                        </button>
                        <AnimatePresence>
                          {activeActionMenu === pkg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                              onClick={e => e.stopPropagation()}
                            >
                              <button onClick={() => openViewModal(pkg)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaEye size={12} /> View Details</button>
                              <button onClick={() => openEditModal(pkg)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaEdit size={12} /> Edit</button>
                              <button onClick={() => openDeleteModal(pkg)} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 text-red-600 flex items-center gap-3 transition-all duration-300 text-sm"><FaTrash size={12} /> Delete</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            {packages.map((pkg, index) => (
              <motion.div key={pkg.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl flex-shrink-0"><FaShieldAlt className="text-white text-xl" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-base text-gray-800 truncate">{pkg.package_name}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200 flex-shrink-0">
                        <FaCode size={8} />{pkg.group_code}
                      </span>
                    </div>
                    {pkg.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{pkg.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-1"><FaTag size={9} /> Permissions</p>
                      {(pkg.permissions?.length || 0) > 0 ? (
                        <button onClick={() => openPermListModal(pkg)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 text-xs font-bold hover:from-blue-100 hover:to-purple-100 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                          <FaShieldAlt size={10} className="text-purple-500" />
                          {pkg.permissions.length} permission{pkg.permissions.length !== 1 ? 's' : ''}
                        </button>
                      ) : <span className="text-xs text-gray-400 italic">No permissions</span>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => openViewModal(pkg)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all duration-300 hover:scale-110"><FaEye size={14} /></button>
                  <button onClick={() => openEditModal(pkg)} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 hover:scale-110"><FaEdit size={14} /></button>
                  <button onClick={() => openDeleteModal(pkg)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 hover:scale-110"><FaTrash size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>

          <Pagination
            currentPage={pagination.page} totalItems={pagination.total}
            itemsPerPage={pagination.limit} onPageChange={handlePageChange}
            variant="default" showInfo={true}
          />
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalType !== MODAL_TYPES.NONE && (
          <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={closeModal}
          >
            <ModalScrollLock />
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* VIEW */}
              {modalType === MODAL_TYPES.VIEW && selectedPackage && (
                <>
                  <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-t-2xl overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-white/30 flex-shrink-0"><FaShieldAlt className="text-white text-2xl sm:text-3xl" /></div>
                          <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight break-words">{selectedPackage.package_name}</h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 text-white rounded-full text-xs font-semibold"><FaCode size={9} />{selectedPackage.group_code}</span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/30 text-white rounded-full text-xs font-semibold"><FaShieldAlt size={9} />{selectedPackage.permissions?.length || 0} permissions</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0 text-white"><FaTimes size={16} /></button>
                      </div>
                      {selectedPackage.description && <p className="mt-3 text-sm text-blue-100 leading-relaxed pl-1">{selectedPackage.description}</p>}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{selectedPackage.permissions?.length || 0}</p>
                        <p className="text-xs text-blue-500 font-medium mt-1">Total Permissions</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-lg sm:text-xl font-bold text-purple-600 truncate">{selectedPackage.group_code}</p>
                        <p className="text-xs text-purple-500 font-medium mt-1">Group Code</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-lg sm:text-xl font-bold text-emerald-600">Active</p>
                        <p className="text-xs text-emerald-500 font-medium mt-1">Package Status</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center"><FaShieldAlt size={10} className="text-blue-600" /></span>
                          Assigned Permissions
                        </h4>
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{selectedPackage.permissions?.length || 0} total</span>
                      </div>
                      {selectedPackage.permissions?.length > 0 ? (
                        <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                          {(selectedPackage.permissions || []).map((permEntry, idx) => {
                            const perm = normalisePermission(permEntry);
                            const displayCode = perm?.code ?? (typeof permEntry === 'object' ? permEntry?.code : `#${permEntry}`);
                            const displayName = perm?.name ?? (typeof permEntry === 'object' ? permEntry?.name : 'Unknown Permission');
                            const displayAction = perm?.action ?? (typeof permEntry === 'object' ? permEntry?.action : '');
                            return (
                              <motion.div key={idx} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.035 }}
                                className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm transition-all duration-200 group">
                                <span className="w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors">{idx + 1}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex-shrink-0 ${getGroupColor(idx)}`}>{displayCode}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                                  {displayAction && <p className="text-xs text-gray-400 font-mono mt-0.5">{displayAction}</p>}
                                </div>
                                <div className="w-6 h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0"><FaCheck size={9} className="text-green-500" /></div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><FaBan className="text-2xl text-gray-300" /></div>
                          <p className="text-sm font-medium text-gray-400">No permissions assigned</p>
                          <p className="text-xs text-gray-300 mt-1">Click edit to add permissions</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                      <button onClick={closeModal} className="px-4 sm:px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium text-sm">Close</button>
                      <button onClick={() => openEditModal(selectedPackage)} className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"><FaEdit size={12} /> Edit Package</button>
                    </div>
                  </div>
                </>
              )}

              {/* PERM LIST */}
              {modalType === MODAL_TYPES.PERM_LIST && selectedPackage && (
                <>
                  <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 rounded-t-2xl overflow-hidden">
                    <div className="absolute -top-5 -right-5 w-24 h-24 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/10 rounded-full" />
                    <div className="relative p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl border border-white/30 flex-shrink-0"><FaShieldAlt className="text-white text-lg sm:text-xl" /></div>
                          <div className="min-w-0">
                            <h2 className="text-base sm:text-xl font-bold text-white leading-tight truncate">{selectedPackage.package_name}</h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 border border-white/30 text-white rounded-full text-xs font-semibold"><FaCode size={8} />{selectedPackage.group_code}</span>
                              <span className="text-xs text-indigo-200">{selectedPackage.permissions?.length || 0} permissions assigned</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 flex-shrink-0 text-white"><FaTimes size={16} /></button>
                      </div>
                      {selectedPackage.description && <p className="mt-2.5 text-xs text-indigo-200 leading-relaxed pl-1 line-clamp-2">{selectedPackage.description}</p>}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {selectedPackage.permissions?.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">All Permissions</p>
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{selectedPackage.permissions.length} total</span>
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                          {(selectedPackage.permissions || []).map((permEntry, idx) => {
                            const perm = normalisePermission(permEntry);
                            const displayCode = perm?.code ?? (typeof permEntry === 'object' ? permEntry?.code : `#${permEntry}`);
                            const displayName = perm?.name ?? (typeof permEntry === 'object' ? permEntry?.name : 'Unknown Permission');
                            const displayAction = perm?.action ?? (typeof permEntry === 'object' ? permEntry?.action : '');
                            return (
                              <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm transition-all duration-200 group">
                                <span className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-indigo-100 text-gray-500 group-hover:text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0 ${getGroupColor(idx)}`}>{displayCode}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800 leading-tight">{displayName}</p>
                                  {displayAction && <p className="text-xs text-gray-400 font-mono mt-0.5">{displayAction}</p>}
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-600 rounded-full text-xs font-semibold flex-shrink-0"><FaCheck size={8} /> Allowed</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FaBan className="text-3xl text-gray-300" /></div>
                        <p className="text-sm font-semibold text-gray-400">No permissions assigned</p>
                        <p className="text-xs text-gray-300 mt-1">Edit this package to add permissions</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                      <button onClick={closeModal} className="px-4 sm:px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium text-sm">Close</button>
                      <button onClick={() => openEditModal(selectedPackage)} className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"><FaEdit size={12} /> Edit Package</button>
                    </div>
                  </div>
                </>
              )}

              {/* CREATE */}
              {modalType === MODAL_TYPES.CREATE && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl z-10">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaPlus /> Create Permission Package</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={16} /></button>
                  </div>
                  <PackageFormBody
                    onSubmit={handleCreate} isEdit={false} formData={formData}
                    onInputChange={handleInputChange} onTogglePermission={togglePermission}
                    onSelectAll={() => setFormData(prev => ({ ...prev, permissions: allPermissions.map(p => p.id) }))}
                    onClearAll={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                    allPermissions={allPermissions} permsLoading={permsLoading} loading={loading} onClose={closeModal}
                  />
                </>
              )}

              {/* EDIT */}
              {modalType === MODAL_TYPES.EDIT && selectedPackage && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl z-10">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaEdit /> Edit Package</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={16} /></button>
                  </div>
                  <PackageFormBody
                    onSubmit={handleEdit} isEdit={true} formData={formData}
                    onInputChange={handleInputChange} onTogglePermission={togglePermission}
                    onSelectAll={() => setFormData(prev => ({ ...prev, permissions: allPermissions.map(p => p.id) }))}
                    onClearAll={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                    allPermissions={allPermissions} permsLoading={permsLoading} loading={loading} onClose={closeModal}
                  />
                </>
              )}

              {/* DELETE CONFIRM */}
              {modalType === MODAL_TYPES.DELETE_CONFIRM && selectedPackage && (
                <>
                  <div className="sticky top-0 flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl z-10">
                    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2"><FaTrash /> Confirm Delete</h2>
                    <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300"><FaTimes size={16} /></button>
                  </div>
                  <div className="p-4 sm:p-6 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.5 }}
                      className="w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaTrash className="text-2xl sm:text-4xl text-red-600" />
                    </motion.div>
                    <p className="text-lg sm:text-xl text-gray-700 mb-2 font-semibold">Are you sure?</p>
                    <p className="text-sm text-gray-500 mb-6 px-2">
                      You are about to delete <span className="font-semibold text-red-600">{selectedPackage.package_name}</span>. This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-4">
                      <button onClick={closeModal} className="px-4 sm:px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-300 font-medium text-sm">Cancel</button>
                      <button onClick={handleDelete} disabled={loading}
                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center gap-2 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm">
                        {loading ? <FaSpinner className="animate-spin" /> : <FaTrash size={12} />}
                        Delete Package
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermissionManagement;
