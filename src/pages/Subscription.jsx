import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, 
  FaDatabase, 
  FaChartBar, 
  FaCode, 
  FaCheckCircle,
  FaArrowRight,
  FaSpinner,
  FaExclamationTriangle,
  FaCrown,
  FaRocket,
  FaShieldAlt,
  FaClock,
  FaCalculator,
  FaCreditCard
} from 'react-icons/fa';
import apiCall from '../utils/api';
import { toast } from 'react-toastify';

const DURATION_OPTIONS = [
  { key: 'monthly_price', label: 'Monthly', suffix: '/mo', discount: 0 },
  { key: 'quarterly_price', label: 'Quarterly', suffix: '/qtr', discount: 10 },
  { key: 'half_yearly_price', label: 'Half-Yearly', suffix: '/half-yr', discount: 15 },
  { key: 'yearly_price', label: 'Yearly', suffix: '/yr', discount: 20 },
];



// Helper: Format currency
const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

// Helper: Calculate price per user
const calculatePricePerUser = (totalPrice, employeeCount) => {
  if (!totalPrice || !employeeCount || employeeCount === 0) return null;
  return totalPrice / employeeCount;
};

const SubscriptionPage = () => {
  // State
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState(25);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Fetch packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const companyId=localStorage.getItem('companyId');
        const response = await apiCall('/subscriptions/packages', 'GET',companyId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setPackages(result.data);
        } else {
          throw new Error(result.message || 'Invalid API response');
        }
      } catch (err) {
        console.error('API Error:', err);
        setError(err.message);
        // Fallback to empty array
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, []);
  
  // Find package matching employee count
  const findMatchingPackage = () => {
    if (!packages.length) return null;
    
    return packages.find(pkg => 
      employees >= pkg.min_employee_count && 
      employees <= pkg.max_employee_count
    );
  };
  
  const currentPackage = findMatchingPackage();
  
  // Calculate current price based on selected duration
  const getCurrentPrice = () => {
    if (!currentPackage) return null;
    const priceValue = currentPackage[selectedDuration.key];
    return priceValue ? parseFloat(priceValue) : null;
  };
  
  const currentPrice = getCurrentPrice();
  const pricePerUser = calculatePricePerUser(currentPrice, employees);
  
  // Get max employee range from packages
  const maxEmployees = packages.length > 0 
    ? Math.max(...packages.map(p => p.max_employee_count))
    : 200;
  
  const minEmployees = packages.length > 0
    ? Math.min(...packages.map(p => p.min_employee_count))
    : 1;
  
  // Handle slider change
  const handleEmployeesChange = (e) => {
    setEmployees(parseInt(e.target.value));
  };
  
  // Handle duration change
  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
  };
  
  // Handle plan button click
  const handlePlanAction = (planName) => {
    if (planName === 'Current') {
      alert('This is your current plan');
    } else {
      alert(`Selected ${planName} plan for ${employees} employees`);
    }
  };
  
  const handlePurchase = async (durationKey) => {
    if (!currentPackage) return;
    
    // Map durationKey to package_period
    const periodMap = {
      'monthly_price': 'monthly',
      'quarterly_price': 'quarterly',
      'half_yearly_price': 'half_yearly',
      'yearly_price': 'yearly'
    };
    
    try {
      setPurchaseLoading(true);
      const companyId = localStorage.getItem('companyId');
      const payload = {
        package_id: currentPackage.id,
        package_period: periodMap[durationKey]
      };
      
      const response = await apiCall('/subscriptions/purchase-subscription', 'POST', companyId, payload);
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Subscription purchased successfully!');
      } else {
        throw new Error(result.message || 'Failed to purchase subscription');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.message || 'An error occurred during purchase');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
              <p className="text-sm text-gray-500 mt-1">Choose the perfect plan for your team</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FaShieldAlt className="text-green-500" />
              <span>Secure payment</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
            <p className="text-gray-500">Loading subscription packages...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">Failed to load packages</p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Duration Cards Row */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex justify-center items-center flex-wrap gap-6 mb-10"
            >
              {DURATION_OPTIONS.map((duration) => {
                const priceValue = currentPackage ? parseFloat(currentPackage[duration.key]) : null;
                const isSelected = selectedDuration.key === duration.key;
                
                return (
                  <motion.div
                    key={duration.key}
                    variants={fadeInUp}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    onClick={() => handleDurationChange(duration)}
                    className={`relative rounded-2xl w-full max-w-[250px] min-w-[200px] cursor-pointer transition-all duration-300 p-6 ${
                      isSelected 
                        ? 'bg-white shadow-xl border-2 border-indigo-500 scale-105 md:scale-105 z-10' 
                        : 'bg-white shadow-md border border-gray-200 hover:shadow-lg'
                    }`}
                  >
                    {duration.discount > 0 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                          SAVE {duration.discount}%
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className={`text-xl font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-800'}`}>
                        {duration.label}
                      </h3>
                      <div className="mt-4 mb-2 flex justify-center items-baseline">
                        <span className="text-4xl font-extrabold text-gray-900">
                          {priceValue !== null ? formatCurrency(priceValue) : '—'}
                        </span>
                      </div>
                      
                      {priceValue !== null && !isNaN(priceValue) && employees > 0 ? (
                        <p className="text-sm text-gray-500 font-medium">
                          {formatCurrency(priceValue / employees)} <span className="font-normal text-gray-400">/ user{duration.suffix}</span>
                        </p>
                      ) : (
                         <p className="text-sm text-gray-400">—</p>
                      )}
                      
                      <div className="mt-6 space-y-3 text-left">
                         <div className="flex items-center gap-2 text-sm text-gray-600">
                           <FaUsers className="text-indigo-500 text-xs" />
                           <span>Up to {currentPackage ? currentPackage.max_employee_count : 10} Users</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm text-gray-600">
                           <FaCheckCircle className="text-green-500 text-xs" />
                           <span>All Pro Features</span>
                         </div>
                      </div>
                      
                      <button
                        disabled={priceValue === null || isNaN(priceValue) || purchaseLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            handlePurchase(duration.key);
                          } else {
                            handleDurationChange(duration);
                          }
                        }}
                        className={`mt-6 w-full py-2.5 rounded-xl font-semibold transition-all duration-200 flex justify-center items-center gap-2 ${
                          priceValue === null || isNaN(priceValue)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                        }`}
                      >
                        {purchaseLoading && isSelected && <FaSpinner className="animate-spin" />}
                        {isSelected ? 'Buy Now' : 'Choose Plan'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
            
            {/* Price Calculator Section - Right side as in image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full mx-auto"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <FaCalculator className="text-white text-xl" />
                  <h2 className="text-xl font-bold text-white">Price calculator</h2>
                </div>
                <p className="text-indigo-100 text-sm mt-1">Calculate your exact subscription cost</p>
              </div>
              
              <div className="p-6">
                {/* Employees Slider */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FaUsers className="text-indigo-500" />
                      Employees
                    </label>
                    <motion.span 
                      key={employees}
                      initial={{ scale: 1.2, color: '#6366f1' }}
                      animate={{ scale: 1, color: '#1f2937' }}
                      className="text-2xl font-bold text-gray-800"
                    >
                      {employees}
                    </motion.span>
                  </div>
                  <input
                    type="range"
                    min={minEmployees}
                    max={maxEmployees}
                    value={employees}
                    onChange={handleEmployeesChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{minEmployees}</span>
                    <span>{Math.floor(maxEmployees / 2)}</span>
                    <span>{maxEmployees}+</span>
                  </div>
                </div>
                
                {/* Duration Tabs */}
                <div className="mb-8">
                  <label className="text-sm font-semibold text-gray-700 block mb-3">Duration</label>
                  <div className="flex gap-3 flex-wrap">
                    {DURATION_OPTIONS.map((duration) => (
                      <motion.button
                        key={duration.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDurationChange(duration)}
                        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all ${
                          selectedDuration.key === duration.key
                            ? 'text-white'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {selectedDuration.key === duration.key && (
                          <motion.div
                            layoutId="durationBg"
                            className="absolute inset-0 bg-indigo-600 rounded-xl"
                            transition={{ type: "spring", duration: 0.4 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {duration.label}
                          {duration.discount > 0 && (
                            <span className="text-xs font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                              -{duration.discount}%
                            </span>
                          )}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Package Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your package</span>
                    {currentPackage ? (
                      <motion.span 
                        key={currentPackage.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full"
                      >
                        {currentPackage.name}
                      </motion.span>
                    ) : (
                      <span className="text-sm text-gray-400">Select employee range</span>
                    )}
                  </div>
                </div>
                
                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Base price</span>
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={currentPrice}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-semibold text-gray-800"
                      >
                        {currentPrice ? formatCurrency(currentPrice) : '—'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  
                  {pricePerUser && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Per employee</span>
                      <span className="text-gray-700">
                        {formatCurrency(pricePerUser)}{selectedDuration.suffix}
                      </span>
                    </div>
                  )}
                  
                  {selectedDuration.discount > 0 && currentPrice && (
                    <div className="flex justify-between items-center py-2 text-green-600">
                      <span className="flex items-center gap-1">
                        <FaRocket className="text-xs" />
                        You save
                      </span>
                      <span className="font-medium">
                        {formatCurrency(currentPrice * selectedDuration.discount / 100)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Total */}
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Estimated total</span>
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={currentPrice}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-3xl font-extrabold text-indigo-600"
                      >
                        {currentPrice ? formatCurrency(currentPrice) : '—'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  {selectedDuration.suffix && currentPrice && (
                    <p className="text-xs text-gray-500 mt-1">billed {selectedDuration.label.toLowerCase()}</p>
                  )}
                </div>
                
                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!currentPackage || purchaseLoading}
                  onClick={() => handlePurchase(selectedDuration.key)}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    currentPackage && !purchaseLoading
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md hover:shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {purchaseLoading ? <FaSpinner className="animate-spin text-lg" /> : <FaCreditCard />}
                  {purchaseLoading ? 'Processing...' : 'Buy Now'}
                  {!purchaseLoading && <FaArrowRight className="text-sm" />}
                </motion.button>
                
                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FaShieldAlt /> Secure checkout
                  </span>
                  <span className="flex items-center gap-1">
                    <FaClock /> Cancel anytime
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;