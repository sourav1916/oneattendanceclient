import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaLock,
  FaRocket,
  FaShieldAlt,
  FaSpinner,
  FaUserShield,
  FaRegClock,
} from "react-icons/fa";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { BiReset } from "react-icons/bi";
import apiCall from "../../utils/api";
import { toast } from "react-toastify";

const OTP_LENGTH = 6;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("request");
  const [loadingAction, setLoadingAction] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = loadingAction !== null;

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
  }, [location.state]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
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
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`reset-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`reset-otp-${index - 1}`)?.focus();
    }
  };

  const handleRequestOtp = async () => {
    if (isLoading) return;
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoadingAction("request");
      const res = await apiCall("/auth/forgot-password/request-otp", "POST", { email });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      toast.success(data.message || "OTP sent to your email");
      setStep("verify");
      setResendTimer(60);
      setOtp(Array(OTP_LENGTH).fill(""));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading) return;
    const otpString = otp.join("");
    if (otpString.length !== OTP_LENGTH) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoadingAction("verify");
      const res = await apiCall("/auth/forgot-password/verify-otp", "POST", {
        email,
        otp: otpString,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      toast.success(data.message || "OTP verified");
      setStep("reset");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (isLoading) return;
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoadingAction("reset");
      const res = await apiCall("/auth/forgot-password/reset", "POST", {
        email,
        new_password: newPassword,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      toast.success(data.message || "Password reset successfully");
      navigate("/login", { replace: true, state: { email } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.12; }
          50% { transform: translateY(-18px) translateX(8px) scale(1.04); opacity: 0.2; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-5 relative overflow-hidden">
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
                animation: `floatSoft ${6 + (i % 5)}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        <motion.div variants={floatingIconsVariants} animate="animate" className="absolute top-20 left-20 text-white/20 text-6xl hidden lg:block">
          <FaRocket />
        </motion.div>
        <motion.div variants={floatingIconsVariants} animate="animate" className="absolute bottom-20 right-20 text-white/20 text-6xl hidden lg:block">
          <FaShieldAlt />
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="flex flex-col lg:flex-row items-center justify-between w-full lg:max-w-6xl max-w-xl relative z-10">
          <motion.div variants={itemVariants} className="mb-10 lg:mb-0 lg:w-1/2 text-white px-4 lg:px-8">
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-5xl lg:text-6xl font-bold leading-tight"
            >
              Recover access to <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300">OneAttendance</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-6 text-xl text-white/90">
              Verify your identity and set a new password using the same secure experience as login.
            </motion.p>
            <div className="mt-8 space-y-4">
              {["OTP verification", "Fast password reset", "Email-based recovery", "Same secure interface"].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <FaCheckCircle className="text-green-300 text-xl" />
                  <span className="text-white/90">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full lg:w-96">
            <div className="bg-white/95 backdrop-blur-lg p-8 rounded-xl shadow-2xl">
              <div className="flex flex-col items-center mb-8">
                <motion.div whileHover={{ rotate: 360, scale: 1.1 }} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl text-white text-3xl shadow-lg">
                  <FaUserShield />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                  {step === "request" ? "Forgot Password" : step === "verify" ? "Verify OTP" : "Reset Password"}
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  {step === "request"
                    ? "Enter your email to receive an OTP"
                    : step === "verify"
                    ? "Enter the OTP sent to your email"
                    : "Create your new password"}
                </p>
              </div>

              {step === "request" && (
                <div className="space-y-5">
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60"
                  >
                    {loadingAction === "request" ? <FaSpinner className="mx-auto h-5 w-5 animate-spin" /> : "Request OTP"}
                  </motion.button>
                </div>
              )}

              {step === "verify" && (
                <div className="space-y-5">
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                    />
                  </div>

                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`reset-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        disabled={isLoading}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FaRegClock />
                      <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : "OTP expired?"}</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    onClick={handleRequestOtp}
                    disabled={resendTimer > 0 || isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60"
                  >
                    {loadingAction === "request" ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <FaSpinner className="h-4 w-4 animate-spin" />
                        Sending OTP
                      </span>
                    ) : (
                      "Resend OTP"
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60"
                  >
                    {loadingAction === "verify" ? <FaSpinner className="mx-auto h-5 w-5 animate-spin" /> : "Verify OTP"}
                  </motion.button>
                </div>
              )}

              {step === "reset" && (
                <div className="space-y-5">
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                    />
                  </div>

                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-gray-50 disabled:opacity-60"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg disabled:opacity-60"
                  >
                    {loadingAction === "reset" ? <FaSpinner className="mx-auto h-5 w-5 animate-spin" /> : "Reset Password"}
                  </motion.button>
                </div>
              )}

              <div className="mt-6 text-center text-sm text-gray-600">
                Remembered it? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Back to Login</Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPassword;
