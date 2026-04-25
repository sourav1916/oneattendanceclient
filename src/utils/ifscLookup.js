import apiCall from './api';

export const normalizeIfscDetails = (data = {}) => ({
  bank_name: data.bank_name || '',
  branch_name: data.branch || data.branch_name || '',
  address: data.address || '',
  city: data.city || '',
  district: data.district || '',
  state: data.state || '',
  micr: data.micr || '',
  contact: data.contact || '',
  upi: data.upi ?? false,
});

export const fetchIfscDetails = async (ifscCode, companyId = null) => {
  const ifsc = String(ifscCode || '').trim().toUpperCase();

  if (!ifsc) {
    throw new Error('IFSC code is required');
  }

  const response = await apiCall(`/bank-accounts/ifsc/${encodeURIComponent(ifsc)}`, 'GET', null, companyId);
  const result = await response.json();

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to fetch IFSC details');
  }

  return normalizeIfscDetails(result.data || {});
};
