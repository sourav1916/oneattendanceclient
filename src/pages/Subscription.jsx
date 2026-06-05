import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaCheckCircle, FaArrowRight, FaSpinner,
  FaExclamationTriangle, FaRocket, FaShieldAlt, FaClock,
  FaCalculator, FaCreditCard, FaBuilding, FaCalendarAlt,
  FaCalendarCheck, FaInfoCircle, FaLock,
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { initiateLayerPayment } from '../utils/layerPayment';
import { loadLayerScript } from '../utils/loadLayer';

// ─── Constants ───────────────────────────────────────────────
const DURATION_OPTIONS = [
  { key: 'monthly_price',     label: 'Monthly',     suffix: '/mo',      billedLabel: 'billed monthly',           discount: 0  },
  { key: 'quarterly_price',   label: 'Quarterly',   suffix: '/qtr',     billedLabel: 'billed quarterly',         discount: 10 },
  { key: 'half_yearly_price', label: 'Half-yearly', suffix: '/6 mo',    billedLabel: 'billed every 6 months',    discount: 15 },
  { key: 'yearly_price',      label: 'Yearly',      suffix: '/yr',      billedLabel: 'billed yearly',            discount: 20 },
];

const PERIOD_MAP = {
  monthly_price:     'monthly',
  quarterly_price:   'quarterly',
  half_yearly_price: 'half_yearly',
  yearly_price:      'yearly',
};

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (value) => {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num);
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// ─── Sub-components ──────────────────────────────────────────

/** Single stat cell used in the top stats strip */
const StatCell = ({ label, value, sub, last }) => (
  <div className={`px-5 py-4 ${!last ? 'border-r border-gray-100' : ''}`}>
    <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <p className="text-[22px] font-semibold text-gray-800 leading-none">{value ?? '—'}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

/** Compact subscription plan card (current or upcoming) */
const PlanCard = ({ plan, variant }) => {
  const isCurrent = variant === 'current';
  const progressPct = isCurrent && plan.days_remaining != null
    ? Math.max(0, Math.min(100, Math.round(((30 - plan.days_remaining) / 30) * 100)))
    : 0;

  return (
    <div className={`rounded-xl p-5 bg-white ${
      isCurrent
        ? 'border-2 border-blue-500'
        : 'border border-gray-200'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
          isCurrent
            ? 'bg-blue-50 text-blue-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {isCurrent ? 'Current' : 'Upcoming'}
        </span>
        <span className="text-[11px] text-gray-400 capitalize bg-gray-50 px-2.5 py-1 rounded-full">
          {plan.subscription_type} billing
        </span>
      </div>

      <p className="text-sm font-semibold text-gray-800 mb-3">{plan.package_name}</p>

      {/* Detail rows */}
      <div className="space-y-2">
        {[
          { icon: <FaUsers className="text-[11px]" />, label: 'Employees', val: `${plan.employee_limit} limit` },
          { icon: <FaCalendarAlt className="text-[11px]" />, label: isCurrent ? 'Started' : 'Starts', val: fmtDate(plan.starts_at) },
          { icon: <FaCalendarCheck className="text-[11px]" />, label: 'Expires', val: fmtDate(plan.expires_at) },
          { icon: <FaCreditCard className="text-[11px]" />, label: 'Amount paid', val: fmt(plan.amount_paid) },
        ].map(({ icon, label, val }) => (
          <div key={label} className="flex justify-between items-center text-[12px]">
            <span className={`flex items-center gap-1.5 ${isCurrent ? 'text-blue-400' : 'text-amber-400'}`}>
              {icon}
              <span className="text-gray-500">{label}</span>
            </span>
            <span className="font-medium text-gray-800">{val}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
          <span>{isCurrent ? 'Period progress' : 'Starts in'}</span>
          <span>{isCurrent ? `${plan.days_remaining} days left` : `${plan.until_start} days`}</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isCurrent ? 'bg-blue-500' : 'bg-amber-400'}`}
            style={{ width: isCurrent ? `${progressPct}%` : '0%' }}
          />
        </div>
      </div>

      <p className="text-[10px] text-gray-300 font-mono mt-3 truncate"># {plan.payment_reference}</p>
    </div>
  );
};

/** Top section showing company info + current/upcoming subscriptions */
const SubscriptionDetailsCard = ({ details, detailsLoading, detailsError }) => {
  if (detailsLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 flex items-center gap-3 text-gray-400 text-sm">
        <FaSpinner className="animate-spin text-gray-400" />
        Loading subscription details…
      </div>
    );
  }
  if (detailsError || !details) return null;

  const { company, subscriptions } = details;
  const current  = subscriptions?.find(s => s.type === 'current');
  const upcoming = subscriptions?.find(s => s.type === 'upcoming');

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5 shadow-sm"
    >
      {/* Company header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <FaBuilding className="text-sm" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{company.name}</p>
            <p className="text-[11px] text-gray-400">{company.legal_name}</p>
          </div>
        </div>
        {company.active_subscription && (
          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active
          </span>
        )}
      </div>

      {/* Stats strip */}
      <div className={`grid border-b border-gray-100 ${
        current && upcoming ? 'grid-cols-4' : 'grid-cols-3'
      }`}>
        <StatCell label="Employees"    value={company.employee_count}       sub={`of ${current?.employee_limit ?? '—'} in plan`} />
        <StatCell label="Seats free"   value={company.employee_available}   sub="remaining" />
        <StatCell label="Days left"    value={current?.days_remaining ?? '—'} sub="in current plan" />
        <StatCell label="Queued"       value={company.queued_subscriptions}  sub="plans" last />
      </div>

      {/* Plan cards */}
      <div className="p-5">
        {(current || upcoming) && (
          <div className={`grid gap-4 ${current && upcoming ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {current  && <PlanCard plan={current}  variant="current"  />}
            {upcoming && <PlanCard plan={upcoming} variant="upcoming" />}
          </div>
        )}

        {/* Queued notice */}
        {company.queued_subscriptions > 0 && upcoming && (
          <div className="mt-4 flex items-start gap-2.5 text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <FaInfoCircle className="mt-0.5 flex-shrink-0 text-amber-500" />
            <span>
              <strong>{upcoming.package_name}</strong> activates automatically when your current plan expires.
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/** Duration tab button */
const DurButton = ({ duration, isSelected, price, employees, onClick }) => {
  const priceNum = price != null ? parseFloat(price) : null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative flex-1 min-w-[110px] cursor-pointer rounded-xl p-4 text-center transition-all duration-200 select-none ${
        isSelected
          ? 'bg-white border-2 border-blue-500 shadow-sm'
          : 'bg-white border border-gray-200 hover:border-gray-300'
      }`}
    >
      {duration.discount > 0 && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold bg-green-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
          Save {duration.discount}%
        </span>
      )}
      <p className={`text-[12px] font-semibold mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
        {duration.label}
      </p>
      <p className="text-[17px] font-semibold text-gray-800">
        {priceNum != null && !isNaN(priceNum) ? fmt(priceNum) : '—'}
      </p>
      {priceNum != null && !isNaN(priceNum) && employees > 0 && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          {fmt(priceNum / employees)}{duration.suffix}
        </p>
      )}
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const SubscriptionPage = () => {
  const navigate = useNavigate();

  const [packages,        setPackages]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [employees,       setEmployees]       = useState(25);
  const [selectedDur,     setSelectedDur]     = useState(DURATION_OPTIONS[0]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const [details,        setDetails]        = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError,   setDetailsError]   = useState(null);

  const hasFetched        = useRef(false);
  const hasFetchedDetails = useRef(false);

  // Load payment gateway script
  useEffect(() => {
    loadLayerScript().catch((err) => {
      console.error(err);
      toast.error('Unable to load payment gateway');
    });
  }, []);

  // Fetch subscription details
  useEffect(() => {
    if (hasFetchedDetails.current) return;
    hasFetchedDetails.current = true;

    (async () => {
      try {
        setDetailsLoading(true);
        const company  = JSON.parse(localStorage.getItem('company'));
        const response = await apiCall('/subscriptions/details', 'GET', null, company?.id);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) setDetails(result.data);
        else throw new Error(result.message || 'Invalid response');
      } catch (err) {
        console.error('Details fetch error:', err);
        setDetailsError(err.message);
      } finally {
        setDetailsLoading(false);
      }
    })();
  }, []);

  // Fetch packages
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      try {
        setLoading(true);
        const response = await apiCall('/subscriptions/packages', 'GET');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) setPackages(result.data);
        else throw new Error(result.message || 'Invalid API response');
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived values
  const currentPackage = packages.find(
    (pkg) => employees >= pkg.min_employee_count && employees <= pkg.max_employee_count
  ) ?? null;

  const currentPrice = currentPackage
    ? parseFloat(currentPackage[selectedDur.key]) || null
    : null;

  const pricePerUser = currentPrice && employees > 0
    ? currentPrice / employees
    : null;

  const maxEmployees = packages.length ? Math.max(...packages.map(p => p.max_employee_count)) : 200;
  const minEmployees = packages.length ? Math.min(...packages.map(p => p.min_employee_count)) : 1;

  const handlePurchase = async () => {
    if (!currentPackage || purchaseLoading) return;
    try {
      setPurchaseLoading(true);
      const company  = JSON.parse(localStorage.getItem('company') || 'null');
      const response = await apiCall(
        '/subscriptions/purchase-subscription', 'POST',
        { package_id: currentPackage.id, package_period: PERIOD_MAP[selectedDur.key] },
        company?.id,
      );
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Purchase failed');

      if (result.message === 'Subscription purchased successfully.') {
        toast.success(result.message);
        setTimeout(() => navigate('/home'), 1500);
        return;
      }
      if (result.data?.payment_token) {
        toast.info('Redirecting to payment gateway…');
        await initiateLayerPayment(result.data.payment_token, navigate);
        return;
      }
      toast.success(result.message);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-gray-800">Subscription plans</h1>
            <p className="text-[12px] text-gray-400 mt-0.5">Choose the perfect plan for your team</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
            <FaShieldAlt className="text-green-500" />
            Secure payment
          </div>
        </div>
      </header>

      <div className="w-full mx-auto px-4 sm:px-6 py-6">

        {/* ── Subscription details ── */}
        <SubscriptionDetailsCard
          details={details}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
        />

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <FaSpinner className="animate-spin text-3xl text-blue-400" />
            <p className="text-sm">Loading subscription packages…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-3xl text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-600 mb-1">Failed to load packages</p>
            <p className="text-xs text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Main content ── */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
          >
            {/* ── Duration selector ── */}
            <div className="p-5 border-b border-gray-100">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Billing period</p>
              <div className="flex gap-3 flex-wrap">
                {DURATION_OPTIONS.map((dur) => (
                  <DurButton
                    key={dur.key}
                    duration={dur}
                    isSelected={selectedDur.key === dur.key}
                    price={currentPackage ? currentPackage[dur.key] : null}
                    employees={employees}
                    onClick={() => setSelectedDur(dur)}
                  />
                ))}
              </div>
            </div>

            {/* ── Price calculator ── */}
            <div className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Price calculator</p>

              {/* Employees slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] text-gray-600 flex items-center gap-1.5">
                    <FaUsers className="text-blue-400 text-[11px]" />
                    Employees
                  </label>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={employees}
                      initial={{ scale: 1.15, color: '#3b82f6' }}
                      animate={{ scale: 1,    color: '#1f2937' }}
                      transition={{ duration: 0.2 }}
                      className="text-[18px] font-semibold text-gray-800"
                    >
                      {employees}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <input
                  type="range"
                  min={minEmployees}
                  max={maxEmployees}
                  value={employees}
                  step={1}
                  onChange={(e) => setEmployees(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                  <span>{minEmployees}</span>
                  <span>{Math.floor(maxEmployees / 2)}</span>
                  <span>{maxEmployees}+</span>
                </div>
              </div>

              {/* Package badge */}
              <div className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3 mb-5 text-[13px]">
                <span className="text-gray-500">Your package</span>
                <AnimatePresence mode="wait">
                  {currentPackage ? (
                    <motion.span
                      key={currentPackage.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-blue-50 text-blue-700 text-[12px] font-semibold px-3 py-1 rounded-full"
                    >
                      {currentPackage.name}
                    </motion.span>
                  ) : (
                    <span className="text-gray-400 text-[12px]">Select employee range</span>
                  )}
                </AnimatePresence>
              </div>

              {/* Breakdown */}
              <div className="space-y-0 border-y border-gray-100 mb-5">
                {[
                  {
                    label: 'Base price',
                    value: currentPrice ? fmt(currentPrice) : '—',
                    valueClass: 'text-gray-800 font-medium',
                  },
                  {
                    label: 'Per employee',
                    value: pricePerUser ? `${fmt(pricePerUser)}${selectedDur.suffix}` : '—',
                    valueClass: 'text-gray-600',
                  },
                  ...(selectedDur.discount > 0 && currentPrice ? [{
                    label: (
                      <span className="flex items-center gap-1 text-green-600">
                        <FaRocket className="text-[10px]" /> You save
                      </span>
                    ),
                    value: fmt(currentPrice * selectedDur.discount / 100),
                    valueClass: 'text-green-600 font-medium',
                  }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 text-[13px]">
                    <span className="text-gray-500">{row.label}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={String(row.value)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={row.valueClass}
                      >
                        {row.value}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline bg-gray-50 rounded-xl px-4 py-4 mb-5">
                <div>
                  <p className="text-[13px] text-gray-500 font-medium">Estimated total</p>
                  {currentPrice && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{selectedDur.billedLabel}</p>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentPrice}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[28px] font-semibold text-gray-800"
                  >
                    {currentPrice ? fmt(currentPrice) : '—'}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Buy button */}
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
                disabled={!currentPackage || purchaseLoading}
                onClick={handlePurchase}
                className={`w-full py-3 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all ${
                  currentPackage && !purchaseLoading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {purchaseLoading
                  ? <><FaSpinner className="animate-spin" /> Processing…</>
                  : <><FaCreditCard /> Buy now <FaArrowRight className="text-[11px]" /></>
                }
              </motion.button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 mt-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><FaShieldAlt /> Secure checkout</span>
                <span className="flex items-center gap-1"><FaLock /> 256-bit SSL</span>
                <span className="flex items-center gap-1"><FaClock /> Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;