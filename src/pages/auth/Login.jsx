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
  FaBuilding,
  FaSpinner
} from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { BiReset } from "react-icons/bi";
import { useAuth } from "../../context/AuthContext";
import apiCall from "../../utils/api";
import { toast } from "react-toastify";
import { getPreciseLocation } from "../../utils/geolocation";

const Login = () => {
  const { user, login, selectCompany, companies, mustSelectCompany, showCompanySelection, setShowCompanySelection } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userCompanies, setUserCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const isLoading = loadingAction !== null;

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
      window.history.pushState(null, "", window.location.href);
      
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, "", window.location.href);
        toast.warning("Please select a company to continue");
      };
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  const floatingIconsVariants = {
    animate: {
      y: [0, -15, 0],
      transition: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
    },
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleRequestOtp = async () => {
    if (isLoading) return;

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setLoadingAction("request-otp");
      const res = await apiCall('/auth/login/request-otp', 'POST', { email, password });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setOtpSent(true);
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP sent to your email 📧");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading) return;

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    try {
      setLoadingAction("verify-otp");

      // Fetch precise location if possible
      toast.info("Capturing precise location...", { autoClose: 1500 });
      
      let locationData = null;
      try {
        locationData = await getPreciseLocation();
      } catch (err) {
        console.warn("Precise location unavailable, continuing login without coordinates:", err);
      }

      const payload = {
        email,
        otp: otpString
      };

      if (locationData) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
        payload.location_accuracy = locationData.accuracy; // Pass accuracy for record-keeping
      }

      const res = await apiCall('/auth/login/verify-otp', 'POST', payload);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      
      await login(data.token);
      toast.success("Login successful 🎉");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    try {
      setLoadingAction("resend-otp");
      const res = await apiCall('/auth/login/request-otp', 'POST', { email, password });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP resent to your email ðŸ“§");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
  };

  const handleConfirmCompany = () => {
    if (selectedCompany) {
      selectCompany(selectedCompany);
      setShowCompanySelection(false);
      navigate("/home", { replace: true });
    } else {
      toast.error("Please select a company to continue");
    }
  };

  const animationStyles = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slideIn { animation: slideIn 0.3s ease-out; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-5 relative overflow-hidden">
        
        {/* Animated Background */}
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
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Floating Icons */}
        <motion.div variants={floatingIconsVariants} animate="animate" className="absolute top-20 left-20 text-white/20 text-6xl hidden lg:block">
          <FaRocket />
        </motion.div>
        <motion.div variants={floatingIconsVariants} animate="animate" className="absolute bottom-20 right-20 text-white/20 text-6xl hidden lg:block">
          <FaShieldAlt />
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl relative z-10">
          
          {/* Left Content */}
          <motion.div variants={itemVariants} className="mb-10 lg:mb-0 lg:w-1/2 text-white px-4 lg:px-8">
            <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: "spring" }} className="text-5xl lg:text-6xl font-bold leading-tight">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300">OneAttendance</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-6 text-xl text-white/90">
              Streamline your attendance management with our secure, modern platform. Experience the future of workforce tracking.
            </motion.p>
            <div className="mt-8 space-y-4">
              {["🔒 End-to-end encryption", "⚡ Real-time updates", "📱 Multi-device sync", "🎯 Intuitive interface"].map((f, i) => (
                <motion.div key={i} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-center space-x-3">
                  <FaCheckCircle className="text-green-300 text-xl" />
                  <span className="text-white/90">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Card */}
          <motion.div variants={itemVariants} className="w-full lg:w-96">
            <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
              <AnimatePresence mode="wait">
                {!showCompanySelection ? (
                  <motion.div key="login" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }}>
                    <div className="flex flex-col items-center mb-8">
                      <motion.div whileHover={{ rotate: 360, scale: 1.1 }} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl text-white text-3xl shadow-lg">
                        <FaUserShield />
                      </motion.div>
                      <h2 className="text-2xl font-bold text-gray-800 mt-4">{otpSent ? 'Verify OTP' : 'Secure Login'}</h2>
                      <p className="text-sm text-gray-500 text-center">{otpSent ? 'Enter the 6-digit code sent to your email' : 'Access your account securely'}</p>
                    </div>

                    {!otpSent ? (
                      <div className="space-y-5">
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} disabled={isLoading} className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
                        </div>
                        <div className="relative">
                          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                          <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} disabled={isLoading} className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 disabled:opacity-50">{showPassword ? "👁️" : "👁️‍🗨️"}</button>
                        </div>
                        <motion.button whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }} onClick={handleRequestOtp} disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60">
                          {loadingAction === "request-otp" ? <FaSpinner className="mx-auto h-5 w-5 animate-spin" /> : "Request OTP"}
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-center gap-2">
                          {otp.map((digit, index) => (
                            <input key={index} id={`otp-${index}`} type="text" maxLength="1" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} disabled={isLoading} className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60" />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 text-gray-600"><FaRegClock /><span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'OTP expired?'}</span></div>
                          <button
                            onClick={handleResendOtp}
                            disabled={resendTimer > 0 || isLoading}
                            className="inline-flex items-center gap-2 text-blue-600 font-semibold disabled:opacity-50"
                          >
                            {loadingAction === "resend-otp" ? (
                              <>
                                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              "Resend OTP"
                            )}
                          </button>
                        </div>
                        <motion.button whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }} onClick={handleVerifyOtp} disabled={isLoading} className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60">
                          {loadingAction === "verify-otp" ? <FaSpinner className="mx-auto h-5 w-5 animate-spin" /> : "Verify OTP"}
                        </motion.button>
                        <button onClick={() => setOtpSent(false)} disabled={isLoading} className="w-full text-gray-600 text-sm disabled:opacity-50">← Back to login</button>
                      </div>
                    )}
                    <div className="mt-6 text-center text-sm text-gray-600">
                      Don't have an account? <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Create Account</Link>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="company-selection" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl text-white mb-2"><FaBuilding size={20} /></div>
                      <h2 className="text-lg font-bold text-gray-800">Select Company</h2>
                      <p className="text-xs text-gray-500">{userCompanies.length} available</p>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-4">
                      {userCompanies.map((c) => (
                        <button key={c.id} onClick={() => handleCompanySelect(c)} className={`w-full text-left p-3 border rounded-xl transition-all ${selectedCompany?.id === c.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">{c.name.charAt(0)}</div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                                <p className="text-xs text-gray-500">{c.email}</p>
                              </div>
                            </div>
                            {selectedCompany?.id === c.id && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"><FaCheckCircle className="text-white text-[10px]" /></div>}
                          </div>
                        </button>
                      ))}
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConfirmCompany} disabled={!selectedCompany} className={`w-full py-3 rounded-xl font-semibold shadow-md ${selectedCompany ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                      Continue to Dashboard
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <FaShieldAlt className="text-green-500" />
                <span>256-bit encrypted connection</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
