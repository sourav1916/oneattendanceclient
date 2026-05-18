import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserShield,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaShieldAlt,
  FaRocket,
  FaRegClock,
  FaUserPlus,
  FaSpinner
} from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlinePhone } from "react-icons/hi";
import { BiReset } from "react-icons/bi";
import countryCodes from "../../utils/countryCodes.json";
import { CountryCodeModal, getFlagEmoji } from "../../components/common";
import apiCall from "../../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import FacebookAuthButton from "../../components/FacebookAuthButton";

const Signup = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("phone"); // default to "phone"
  const [isTabLocked, setIsTabLocked] = useState(false);
  const [countryCode, setCountryCode] = useState("91");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [otpSent, setOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { login } = useAuth();
  const firstOtpInputRef = useRef(null);
  const isLoading = loadingAction !== null;

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

  useEffect(() => {
    if (!otpSent || currentStep !== 2 || isLoading) return;

    const focusTimer = window.setTimeout(() => {
      firstOtpInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [otpSent, currentStep, isLoading]);

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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleRequestOtp = async () => {
    if (isLoading) return;

    if (!fullName) {
      toast.error("Please enter your name");
      return;
    }

    if (activeTab === "phone" && !phone) {
      toast.error("Please enter your phone number");
      return;
    }

    if (activeTab === "email" && !email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoadingAction("request-otp");
      const res = await apiCall('/auth/signup/request-otp', 'POST', {
        email: activeTab === "email" ? email : "",
        phone: activeTab === "phone" ? (countryCode + phone) : "",
        signup_type: activeTab,
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setIsTabLocked(true);
        setResendTimer(60);
        setOtp(["", "", "", "", "", ""]);
        setCurrentStep(2);
        toast.success(
          activeTab === "phone"
            ? "OTP sent to your phone number 📱"
            : "OTP sent to your email 📧"
        );
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
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
      toast.error("Please enter 6-digit OTP");
      return;
    }

    try {
      setLoadingAction("verify-otp");

      const verifyRes = await apiCall('/auth/signup/verify-otp', 'POST', {
        signup_type: activeTab,
        email: activeTab === "email" ? email : "",
        phone: activeTab === "phone" ? (countryCode + phone) : "",
        otp: Number(otpString),
        password: "", // Will be configured in Step 3
        name: fullName,
        platform: "web"
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Invalid OTP");
      }

      toast.success("OTP verified successfully ✅");
      setCurrentStep(3);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateAccount = async () => {
    if (isLoading) return;

    if (activeTab === "phone" && !email) {
      toast.error("Please enter your email address");
      return;
    }

    if (activeTab === "email" && !phone) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!password) {
      toast.error("Please set a password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoadingAction("create-account");

      const fullPhone = countryCode + phone;
      const payload = {
        signup_type: activeTab,
        email: email,
        password: password,
        name: fullName,
        phone: isNaN(fullPhone) || fullPhone === "" ? fullPhone : Number(fullPhone),
        platform: "web"
      };

      const res = await apiCall('/auth/signup/complete', 'POST', payload);
      const json = await res.json();

      if (res.ok) {
        toast.success("Account created successfully 🎉");
        const token = json.data?.token || json.token;
        if (!token) throw new Error("Signup did not return a session token.");
        setTimeout(() => {
          login(token);
        }, 1500);
      } else {
        throw new Error(json.message || "Signup failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;

    try {
      setLoadingAction("resend-otp");
      const res = await apiCall('/auth/signup/request-otp', 'POST', {
        email: activeTab === "email" ? email : "",
        phone: activeTab === "phone" ? phone : "",
        signup_type: activeTab,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success(
        activeTab === "phone"
          ? "OTP resent to your phone number 📱"
          : "OTP resent to your email 📧"
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Create Account";
      case 2: return "Verify OTP";
      case 3: return "Account Details";
      default: return "Sign Up";
    }
  };

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

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col lg:flex-row items-center justify-between w-full lg:max-w-6xl max-w-xl relative z-10 my-auto"
        >
          {/* Left Side - Welcome Text */}
          <motion.div
            variants={itemVariants}
            className="hidden lg:block lg:w-1/2 text-white px-4 lg:px-8"
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
            className="w-full max-w-[400px] lg:w-96"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="bg-white/95 backdrop-blur-lg p-6 rounded-xl shadow-2xl"
            >
              {/* Header */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center mb-3"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 p-2.5 rounded-xl text-white text-xl shadow-md"
                >
                  <FaUserShield />
                </motion.div>
                <motion.h2
                  variants={itemVariants}
                  className="text-lg font-bold text-gray-800 mt-1.5"
                >
                  {getStepTitle()}
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-xs text-gray-500 text-center"
                >
                  {currentStep === 1 && "Fill in details using chosen tab below"}
                  {currentStep === 2 && (activeTab === "phone" ? "Enter the code sent to your phone" : "Enter the code sent to your email")}
                  {currentStep === 3 && "Secure your account with password and secondary email/phone"}
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
                  className="space-y-3.5"
                >
                  {currentStep === 1 && (
                    /* Step 1: Basic Info */
                    <>
                      <GoogleAuthButton
                        mode="signup"
                        disabled={isLoading}
                        onAuthenticated={login}
                      />

                      <FacebookAuthButton
                        mode="signup"
                        disabled={isLoading}
                        onAuthenticated={login}
                      />

                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[10px] font-bold uppercase text-gray-400">or</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>

                      {/* Tabs for choosing Phone vs Email Signup type */}
                      <div className="flex bg-gray-100 p-0.5 rounded-lg mb-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab("phone")}
                          disabled={isLoading || isTabLocked}
                          className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === "phone"
                              ? "bg-white text-gray-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                            } ${isTabLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          Phone
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("email")}
                          disabled={isLoading || isTabLocked}
                          className={`flex-1 py-1.5 text-center text-sm font-semibold rounded-md transition-all duration-200 ${activeTab === "email"
                              ? "bg-white text-gray-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                            } ${isTabLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          Email
                        </button>
                      </div>

                      <div className="relative">
                        <HiOutlineUser className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                          type="text"
                          placeholder="Full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => setFocusedField(null)}
                          disabled={isLoading}
                          className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm disabled:opacity-60"
                        />
                      </div>

                      {activeTab === "phone" ? (
                        <div className="flex gap-2">
                          <div className="relative w-20 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(true)}
                              disabled={isLoading || isTabLocked}
                              className="w-full flex items-center justify-between px-3 py-2.5 border-2 border-purple-300 focus:border-purple-500 focus:outline-none bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors rounded-xl"
                            >
                              <span>
                                {getFlagEmoji(countryCodes.find(c => c.dial_code === countryCode)?.code || "IN")} +{countryCode}
                              </span>
                              <span className="text-gray-400 text-xs">▼</span>
                            </button>
                          </div>
                          <div className="relative flex-grow">
                            <HiOutlinePhone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                              type="tel"
                              placeholder="Phone Number (primary)"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              onFocus={() => setFocusedField('phone')}
                              onBlur={() => setFocusedField(null)}
                              disabled={isLoading}
                              className="w-full pl-11 pr-4 py-2.5 border-2 border-purple-300 focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm rounded-xl disabled:opacity-60"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                          <input
                            type="email"
                            placeholder="Email Address (primary)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            disabled={isLoading}
                            className="w-full pl-11 pr-4 py-2.5 border-2 border-purple-300 focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm rounded-xl disabled:opacity-60"
                          />
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        onClick={handleRequestOtp}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group text-sm"
                      >
                        {loadingAction === "request-otp" ? (
                          <div className="flex items-center justify-center">
                            <FaSpinner className="h-5 w-5 animate-spin" />
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
                      {/* Read-only verification target */}
                      <div className="relative">
                        {activeTab === "phone" ? (
                          <>
                            <HiOutlineUser className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                              type="tel"
                              value={phone}
                              disabled
                              className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 text-sm"
                            />
                          </>
                        ) : (
                          <>
                            <HiOutlineMail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                              type="email"
                              value={email}
                              disabled
                              className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500 text-sm"
                            />
                          </>
                        )}
                      </div>

                      <div className="flex justify-center gap-2">
                        {otp.map((digit, index) => (
                          <motion.input
                            key={index}
                            ref={index === 0 ? firstOtpInputRef : null}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            disabled={isLoading}
                            className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white disabled:opacity-60"
                            whileFocus={{ scale: 1.05 }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-gray-600">
                          <FaRegClock />
                          <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Code expired?'}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: isLoading ? 1 : 1.05 }}
                          whileTap={{ scale: isLoading ? 1 : 0.95 }}
                          onClick={handleResendOtp}
                          disabled={resendTimer > 0 || isLoading}
                          className={`text-purple-600 font-semibold ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-purple-800'
                            }`}
                        >
                          <div className="flex items-center space-x-1">
                            {loadingAction === "resend-otp" ? <FaSpinner className="h-3 w-3 animate-spin" /> : <BiReset />}
                            <span>{loadingAction === "resend-otp" ? "Sending..." : "Resend"}</span>
                          </div>
                        </motion.button>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: isLoading ? 1 : 1.02 }}
                          whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          onClick={() => setCurrentStep(1)}
                          disabled={isLoading}
                          className="flex-1 bg-gray-500 text-white py-2.5 rounded-xl font-semibold hover:bg-gray-600 transition-colors text-sm"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <FaArrowLeft />
                            <span>Back</span>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: isLoading ? 1 : 1.02 }}
                          whileTap={{ scale: isLoading ? 1 : 0.98 }}
                          onClick={handleVerifyOtp}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm"
                        >
                          {loadingAction === "verify-otp" ? (
                            <div className="flex items-center justify-center">
                              <FaSpinner className="h-5 w-5 animate-spin" />
                            </div>
                          ) : (
                            'Verify'
                          )}
                        </motion.button>
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    /* Step 3: Secondary Info & Password Setup */
                    <>
                      {activeTab === "phone" ? (
                        <div className="relative">
                          <HiOutlineMail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                          <input
                            type="email"
                            placeholder="Email Address (secondary)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm disabled:opacity-60"
                          />
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative w-20 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(true)}
                              disabled={isLoading}
                              className="w-full flex items-center justify-between px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                            >
                              <span>
                                {getFlagEmoji(countryCodes.find(c => c.dial_code === countryCode)?.code || "IN")} +{countryCode}
                              </span>
                              <span className="text-gray-400 text-xs">▼</span>
                            </button>
                          </div>
                          <div className="relative flex-grow">
                            <HiOutlinePhone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                              type="tel"
                              placeholder="Phone Number (secondary)"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              disabled={isLoading}
                              className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm disabled:opacity-60"
                            />
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <HiOutlineLockClosed className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Choose password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          className="w-full pl-11 pr-11 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 bg-gray-50 focus:bg-white text-sm disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>

                      <div className="text-xs text-gray-600">
                        <p className="mb-1">Password must contain:</p>
                        <ul className="space-y-1">
                          <li className={`flex items-center space-x-2 ${password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                            <span className={password.length >= 6 ? 'text-green-600' : ''}>✓</span>
                            <span>At least 6 characters</span>
                          </li>
                        </ul>
                      </div>

                      <motion.button
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        onClick={handleCreateAccount}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 text-sm"
                      >
                        {loadingAction === "create-account" ? (
                          <div className="flex items-center justify-center">
                            <FaSpinner className="h-5 w-5 animate-spin" />
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
                className="mt-3.5 text-center text-xs text-gray-600"
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
                className="mt-2.5 flex items-center justify-center space-x-2 text-xs text-gray-500"
              >
                <FaShieldAlt className="text-green-500" />
                <span>Your data is protected with 256-bit encryption</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
        <CountryCodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={(code) => setCountryCode(code)}
          selectedCode={countryCode}
        />
      </div>
    </>
  );
};

export default Signup;
