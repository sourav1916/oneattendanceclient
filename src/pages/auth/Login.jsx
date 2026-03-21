import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserShield,
  FaArrowRight,
  FaShieldAlt,
  FaRocket,
  FaCheckCircle,
  FaRegClock,
  FaBuilding
} from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { BiReset } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "https://api-attendance.onesaas.in";

const Login = () => {
  const { user, login, selectCompany, companies, mustSelectCompany, showCompanySelection, setShowCompanySelection } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userCompanies, setUserCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Check after login if company selection is needed
  useEffect(() => {
    if (user && mustSelectCompany && companies.length > 1) {
      setUserCompanies(companies);
      setShowCompanySelection(true);
    } else if (user && !mustSelectCompany) {
      // User has company selected, redirect to home
      navigate("/home", { replace: true });
    }
  }, [user, mustSelectCompany, companies, navigate, setShowCompanySelection]);

  // Prevent navigation away when company selection is needed
  useEffect(() => {
    if (showCompanySelection) {
      // Push a state to prevent back navigation
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        showToast("Please select a company to continue", "error");
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [showCompanySelection]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  const floatingIconsVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 ${type === "success"
      ? "bg-gradient-to-r from-green-500 to-blue-500"
      : "bg-red-500"
      } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn`;
    toast.innerHTML = type === "success" ? `✓ ${message}` : `✗ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleRequestOtp = async () => {
    if (!email || !password) {
      showToast("Please enter both email and password", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/otp/login/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOtpSent(true);
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);

      showToast("OTP sent to your email 📧");
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      showToast("Please enter complete 6-digit OTP", "error");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/otp/login/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpString
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Login will fetch user profile and set mustSelectCompany if needed
      await login(data.token);
      
      showToast("Login successful 🎉");
      
      // The useEffect will handle showing company selection or redirecting to home

    } catch (err) {
      showToast(err.message || "OTP verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    await handleRequestOtp();
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
  };

  const handleConfirmCompany = () => {
    if (selectedCompany) {
      selectCompany(selectedCompany);
      setShowCompanySelection(false);
      // Redirect to home after company selection
      navigate("/home", { replace: true });
    } else {
      showToast("Please select a company to continue", "error");
    }
  };

  // Animation styles
  const animationStyles = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .animate-slideIn {
      animation: slideIn 0.3s ease-out;
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-5 relative overflow-hidden">

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/10 rounded-full"
              style={{
                width: Math.random() * 300 + 50,
                height: Math.random() * 300 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Floating Icons */}
        <motion.div
          variants={floatingIconsVariants}
          animate="animate"
          className="absolute top-20 left-20 text-white/20 text-6xl hidden lg:block"
        >
          <FaRocket />
        </motion.div>
        <motion.div
          variants={floatingIconsVariants}
          animate="animate"
          className="absolute bottom-20 right-20 text-white/20 text-6xl hidden lg:block"
        >
          <FaShieldAlt />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl relative z-10"
        >
          {/* Left Side - Welcome Text */}
          <motion.div
            variants={itemVariants}
            className="mb-10 lg:mb-0 lg:w-1/2 text-white px-4 lg:px-8"
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-5xl lg:text-6xl font-bold leading-tight"
            >
              Welcome to{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300">
                OneAttendance
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-xl text-white/90"
            >
              Streamline your attendance management with our secure,
              modern platform. Experience the future of workforce tracking.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 space-y-4"
            >
              {[
                "🔒 End-to-end encryption",
                "⚡ Real-time updates",
                "📱 Multi-device sync",
                "🎯 Intuitive interface"
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <FaCheckCircle className="text-green-300 text-xl" />
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login/Company Selection Card */}
          <motion.div
            variants={itemVariants}
            className="w-full lg:w-96"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl"
            >
              <AnimatePresence mode="wait">
                {!showCompanySelection ? (
                  /* Login Form */
                  <motion.div
                    key="login"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                  >
                    {/* Header */}
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center mb-8"
                    >
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl text-white text-3xl shadow-lg"
                      >
                        <FaUserShield />
                      </motion.div>
                      <motion.h2
                        variants={itemVariants}
                        className="text-2xl font-bold text-gray-800 mt-4"
                      >
                        {otpSent ? 'Verify OTP' : 'Secure Login'}
                      </motion.h2>
                      <motion.p
                        variants={itemVariants}
                        className="text-sm text-gray-500 text-center"
                      >
                        {otpSent
                          ? 'Enter the 6-digit code sent to your email'
                          : 'Access your account securely'}
                      </motion.p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                      {!otpSent ? (
                        /* Login Form Inputs */
                        <motion.div
                          key="login-form"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 50, opacity: 0 }}
                          className="space-y-5"
                        >
                          {/* Email Input */}
                          <div className="relative">
                            <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                              type="email"
                              placeholder="Email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                            />
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: focusedField === 'email' ? 1 : 0 }}
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ originX: 0 }}
                            />
                          </div>

                          {/* Password Input */}
                          <div className="relative">
                            <HiOutlineLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: focusedField === 'password' ? 1 : 0 }}
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ originX: 0 }}
                            />
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRequestOtp}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
                          >
                            <motion.span
                              initial={{ x: '-100%' }}
                              whileHover={{ x: '100%' }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                            {loading ? (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <span>Request OTP</span>
                                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                              </div>
                            )}
                          </motion.button>
                        </motion.div>
                      ) : (
                        /* OTP Verification Form */
                        <motion.div
                          key="otp-form"
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -50, opacity: 0 }}
                          className="space-y-6"
                        >
                          {/* OTP Input Grid */}
                          <div className="flex justify-center gap-2">
                            {otp.map((digit, index) => (
                              <motion.input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                onFocus={() => setFocusedField(`otp-${index}`)}
                                onBlur={() => setFocusedField(null)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                                whileFocus={{ scale: 1.05 }}
                              />
                            ))}
                          </div>

                          {/* Timer and Resend */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <FaRegClock />
                              <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'OTP expired?'}</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleResendOtp}
                              disabled={resendTimer > 0 || loading}
                              className={`text-blue-600 font-semibold ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-800'
                                }`}
                            >
                              <div className="flex items-center space-x-1">
                                <BiReset />
                                <span>Resend OTP</span>
                              </div>
                            </motion.button>
                          </div>

                          {/* Verify Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVerifyOtp}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                          >
                            {loading ? (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : (
                              'Verify OTP'
                            )}
                          </motion.button>

                          {/* Back to Login */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              setOtpSent(false);
                              setOtp(["", "", "", "", "", ""]);
                            }}
                            className="w-full text-gray-600 hover:text-gray-800 text-sm"
                          >
                            ← Back to login
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sign Up Link */}
                    <motion.div
                      variants={itemVariants}
                      className="mt-6 text-center text-sm text-gray-600"
                    >
                      Don't have an account?{' '}
                      <Link to="/signup">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer inline-block"
                        >
                          Create Account
                        </motion.span>
                      </Link>
                    </motion.div>
                  </motion.div>
                ) : (
                  /* Company Selection Form */
                  <motion.div
                    key="company-selection"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    className="max-h-[500px] overflow-y-auto"
                  >
                    {/* Header - Ultra Compact */}
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-col items-center mb-3"
                    >
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl text-white text-xl shadow-lg"
                      >
                        <FaBuilding size={20} />
                      </motion.div>
                      <motion.h2
                        variants={itemVariants}
                        className="text-lg font-bold text-gray-800 mt-1.5"
                      >
                        Select Company
                      </motion.h2>
                      <motion.p
                        variants={itemVariants}
                        className="text-xs text-gray-500 text-center"
                      >
                        {userCompanies.length} companies available
                      </motion.p>
                    </motion.div>

                    {/* Companies List - Ultra Compact */}
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto mb-3 custom-scrollbar">
                      {userCompanies.map((company, index) => (
                        <motion.button
                          key={company.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleCompanySelect(company)}
                          className={`w-full text-left p-2.5 border rounded-lg transition-all duration-300 group ${
                            selectedCompany?.id === company.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs">
                                  {company.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                                  {company.name}
                                </p>
                                {company.legal_name && (
                                  <p className="text-xs text-gray-500 truncate">{company.legal_name}</p>
                                )}
                                {company.email && (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">{company.email}</p>
                                )}
                              </div>
                            </div>
                            
                            {selectedCompany?.id === company.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"
                              >
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Continue Button - Ultra Compact */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmCompany}
                      disabled={!selectedCompany}
                      className={`w-full py-2 rounded-lg font-semibold shadow-md transition-all duration-300 text-sm ${
                        selectedCompany
                          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Continue To Dashboard
                    </motion.button>

                    {/* Info Message - Ultra Compact */}
                    <motion.div
                      variants={itemVariants}
                      className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-blue-800">
                        <FaCheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <p>Switch companies anytime from profile settings</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500"
              >
                <FaShieldAlt className="text-green-500" />
                <span>256-bit encrypted connection</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
};

export default Login;