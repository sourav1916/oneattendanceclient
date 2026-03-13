import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserShield,
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaShieldAlt,
  FaRocket,
  FaRegClock,
  FaUserPlus
} from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import { BiReset } from "react-icons/bi";

const API_BASE = "https://api-attendance.onesaas.in";

const Signup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
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
    toast.className = `fixed top-4 right-4 ${type === "success" ? "bg-gradient-to-r from-green-500 to-blue-500" : "bg-red-500"
      } text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn`;
    toast.innerHTML = type === "success" ? `✓ ${message}` : `✗ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };


  const handleRequestOtp = async () => {
    if (!email) return showToast("Please enter email", "error");
    if (!fullName)
      return showToast("Please enter your full name", "error");

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/otp/signup/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOtpSent(true);
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setCurrentStep(2);

      showToast("OTP sent to your email 📧");
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6)
      return showToast("Enter 6-digit OTP", "error");

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/otp/signup/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otpString
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEmailVerified(true);
      setCurrentStep(3);

      showToast("Email verified successfully ✅");
    } catch (err) {
      showToast(err.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!password)
      return showToast("Please set a password", "error");

    if (password.length < 6)
      return showToast("Password must be at least 6 characters", "error");

    try {
      setLoading(true);
      const name = fullName;
      const res = await fetch(`${API_BASE}/otp/signup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Account created successfully 🎉");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      showToast(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    await handleRequestOtp();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Create Account";
      case 2: return "Verify Email";
      case 3: return "Set Password";
      default: return "Sign Up";
    }
  };

  // Add animation styles to a separate CSS file or use style tag in index.html
  // For now, we'll add them inline in a style tag without the jsx prop
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
          <FaUserPlus />
        </motion.div>

        {/* Progress Steps */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-20">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: currentStep >= step ? 1 : 0.8,
                  backgroundColor: currentStep >= step ? "#10B981" : "#9CA3AF"
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              >
                {currentStep > step ? "✓" : step}
              </motion.div>
              {step < 3 && (
                <motion.div
                  animate={{
                    backgroundColor: currentStep > step ? "#10B981" : "#9CA3AF"
                  }}
                  className="w-16 h-1 mx-2 rounded"
                  style={{ backgroundColor: currentStep > step ? "#10B981" : "#9CA3AF" }}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl relative z-10 mt-16"
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
              Join{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                OneAttendance
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-xl text-white/90"
            >
              Start managing your workforce efficiently with our comprehensive attendance tracking system.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 space-y-4"
            >
              {[
                "🚀 Quick & easy registration",
                "🔐 Secure email verification",
                "📊 Real-time attendance tracking",
                "💼 Client management tools"
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

          {/* Right Side - Signup Card */}
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
              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center mb-6"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl text-white text-3xl shadow-lg"
                >
                  <FaUserShield />
                </motion.div>
                <motion.h2
                  variants={itemVariants}
                  className="text-2xl font-bold text-gray-800 mt-4"
                >
                  {getStepTitle()}
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-sm text-gray-500 text-center"
                >
                  {currentStep === 1 && "Fill in your details to get started"}
                  {currentStep === 2 && "Enter the verification code sent to your email"}
                  {currentStep === 3 && "Create a strong password for your account"}
                </motion.p>
              </motion.div>

              <AnimatePresence mode="wait" custom={currentStep}>
                <motion.div
                  key={currentStep}
                  custom={currentStep}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.3 }}
                  className="space-y-4"
                >
                  {currentStep === 1 && (
                    /* Step 1: Basic Info */
                    <>
                      <div className="relative">
                        <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <div className="relative">
                        <HiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRequestOtp}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>Send Verification Code</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </motion.button>
                    </>
                  )}

                  {currentStep === 2 && (
                    /* Step 2: OTP Verification */
                    <>
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
                            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                            whileFocus={{ scale: 1.05 }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <FaRegClock />
                          <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Code expired?'}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleResendOtp}
                          disabled={resendTimer > 0 || loading}
                          className={`text-purple-600 font-semibold ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-purple-800'
                            }`}
                        >
                          <div className="flex items-center space-x-1">
                            <BiReset />
                            <span>Resend</span>
                          </div>
                        </motion.button>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrentStep(1)}
                          className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <FaArrowLeft />
                            <span>Back</span>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleVerifyOtp}
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            'Verify'
                          )}
                        </motion.button>
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    /* Step 3: Set Password */
                    <>
                      <div className="relative">
                        <HiOutlineUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type="tel"
                          placeholder="Phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Password must contain:</p>
                        <ul className="space-y-1">
                          <li className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={password.length >= 6 ? 'text-green-600' : ''}>✓</span>
                            <span>At least 6 characters</span>
                          </li>
                        </ul>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateAccount}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          'Create Account'
                        )}
                      </motion.button>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Login Link */}
              <motion.div
                variants={itemVariants}
                className="mt-6 text-center text-sm text-gray-600"
              >
                Already have an account?{' '}
                <Link to="/login">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="text-purple-600 font-semibold hover:text-purple-800 cursor-pointer inline-block"
                  >
                    Sign In
                  </motion.span>
                </Link>
              </motion.div>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500"
              >
                <FaShieldAlt className="text-green-500" />
                <span>Your data is protected with 256-bit encryption</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Signup;