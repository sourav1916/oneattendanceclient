import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaSpinner, FaUniversity } from 'react-icons/fa';
import apiCall from '../utils/api';
import SelectField from './SelectField';

const DEFAULT_LIMIT = 20;

const getCompanyId = () => {
  try {
    return JSON.parse(localStorage.getItem('company'))?.id ?? null;
  } catch {
    return null;
  }
};

const getAccountId = (account) => account?.bank_id ?? account?.id ?? account?.account_id ?? '';

const getAccountIds = (account) =>
  [account?.bank_id, account?.id, account?.account_id]
    .filter(id => id !== undefined && id !== null && id !== '')
    .map(String);

const getAccountTitle = (account) =>
  account?.account_holder_name || account?.employee_name || account?.bank_name || 'Account';

const getAccountSubtitle = (account) => {
  const method = account?.account_type === 'upi'
    ? account?.upi_id
    : account?.bank_name || account?.account_number;
  const parts = [method, account?.employee_name, account?.account_number]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index);
  return parts.join(' / ');
};

const toOption = (account) => {
  const id = getAccountId(account);
  const title = getAccountTitle(account);
  const subtitle = getAccountSubtitle(account);
  return {
    value: String(id),
    label: subtitle ? `${title} - ${subtitle}` : title,
    account,
  };
};

const mergeUniqueOptions = (current, incoming) => {
  const seen = new Set();
  return [...current, ...incoming].filter((option) => {
    const key = String(option.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const readRows = (result) => {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.accounts)) return result.accounts;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
};

const readMeta = (result, page, limit, rowCount) => {
  const meta = result?.meta || result?.pagination || result?.data?.meta || result?.data?.pagination || {};
  const totalPages = Number(meta.total_pages ?? result?.total_pages ?? result?.last_page ?? 0);
  const currentPage = Number(meta.page ?? meta.current_page ?? result?.page ?? result?.current_page ?? page);
  const isLastPage = meta.is_last_page ?? result?.is_last_page ?? (
    totalPages ? currentPage >= totalPages : rowCount < limit
  );
  return { isLastPage };
};

const formatAccountOption = ({ account }) => (
  <div className="flex items-center gap-3 min-w-0">
    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
      <FaUniversity size={13} />
    </span>
    <span className="min-w-0 flex flex-col">
      <span className="text-sm font-bold text-slate-700 truncate">{getAccountTitle(account)}</span>
      <span className="text-[11px] text-slate-400 truncate">{getAccountSubtitle(account) || 'Bank account'}</span>
    </span>
  </div>
);

const BankAccountSelectField = ({
  ownerType,
  employeeId,
  value,
  onChange,
  placeholder,
  initialAccount = null,
  isDisabled = false,
}) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue.trim());
      setPage(1);
      setHasMore(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const initialOption = useMemo(() => {
    if (!initialAccount || !value) return null;
    if (!getAccountIds(initialAccount).includes(String(value))) return null;
    return toOption(initialAccount);
  }, [initialAccount, value]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => String(option.value) === String(value)) || initialOption;
  }, [initialOption, options, value]);

  const fetchAccounts = useCallback(async (targetPage, search) => {
    const companyId = getCompanyId();
    if (!companyId || !ownerType) return;
    if (ownerType === 'employee' && !employeeId) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        limit: String(DEFAULT_LIMIT),
      });
      if (search) params.append('search', search);
      if (ownerType === 'employee') params.append('employee_id', String(employeeId));

      const endpoint = ownerType === 'company'
        ? '/bank-accounts/management/company'
        : '/bank-accounts/management/employee';
      const response = await apiCall(`${endpoint}?${params.toString()}`, 'GET', null, companyId);
      const result = await response.json();

      if (requestRef.current !== requestId) return;

      if (result.success) {
        const rows = readRows(result);
        const nextOptions = rows.map(toOption).filter(option => option.value);
        setOptions(prev => targetPage > 1 ? mergeUniqueOptions(prev, nextOptions) : nextOptions);
        const meta = readMeta(result, targetPage, DEFAULT_LIMIT, rows.length);
        setHasMore(!meta.isLastPage);
      } else {
        if (targetPage === 1) setOptions([]);
        setHasMore(false);
      }
    } catch {
      if (requestRef.current === requestId) {
        if (targetPage === 1) setOptions([]);
        setHasMore(false);
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [employeeId, ownerType]);

  useEffect(() => {
    fetchAccounts(page, debouncedSearch);
  }, [debouncedSearch, fetchAccounts, page]);

  useEffect(() => {
    if (initialOption) {
      setOptions(prev => mergeUniqueOptions([initialOption], prev));
    }
  }, [initialOption]);

  const handleMenuScrollToBottom = () => {
    if (!loading && hasMore) setPage(prev => prev + 1);
  };

  return (
    <SelectField
      isClearable
      isSearchable
      isDisabled={isDisabled}
      options={options}
      value={selectedOption}
      placeholder={placeholder}
      inputValue={inputValue}
      onInputChange={(nextValue, meta) => {
        if (meta.action === 'input-change') setInputValue(nextValue);
        if (meta.action === 'menu-close') setInputValue('');
      }}
      onChange={(option) => onChange(option?.value || '', option?.account || null)}
      onMenuScrollToBottom={handleMenuScrollToBottom}
      filterOption={() => true}
      formatOptionLabel={formatAccountOption}
      noOptionsMessage={() => loading ? 'Loading accounts...' : 'No accounts found'}
      loadingMessage={() => 'Loading accounts...'}
      isLoading={loading}
      components={{
        LoadingIndicator: () => <FaSpinner className="animate-spin text-blue-500 mr-3" size={13} />,
      }}
    />
  );
};

export default BankAccountSelectField;
