import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";

const Signup = () => {
  const navigate = useNavigate();

  // ---------------- STATES ----------------
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // ---------------- HANDLERS ----------------

  const handleRequestOtp = () => {
    if (!email) {
      alert("Please enter email first");
      return;
    }

    console.log("Signup OTP requested for:", email);
    setOtpSent(true);
    alert("OTP sent successfully");
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      alert("Enter valid 6-digit OTP");
      return;
    }

    console.log("Email Verified:", email);
    setEmailVerified(true);
    alert("Email Verified Successfully ✅");
  };

  const handleCreateAccount = () => {
    if (!password) {
      alert("Please set a password");
      return;
    }

    console.log("Signup Data:", {
      firstName,
      lastName,
      email,
      password,
    });

    alert("Account Created Successfully 🎉");

    navigate("/");
  };

  const handleResendOtp = () => {
    console.log("OTP Resent");
    alert("OTP Resent Successfully");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl">

        {/* Left Branding */}
        <div className="mb-10 md:mb-0 md:w-1/2">
          <h1 className="text-5xl font-bold text-blue-600">
            OneAttendanceClient
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Create an account to manage your clients and attendance records efficiently.
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg w-full md:w-[450px]">

          {/* 🔥 Header Added */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full text-white text-2xl">
              <FaUserShield />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mt-3">
              OneAttendanceClient
            </h2>
            <p className="text-sm text-gray-500">
              Secure Client Attendance Management
            </p>
          </div>

          <div className="space-y-4">

            {/* Name Fields */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />

            {/* Request OTP */}
            {!emailVerified && (
              <button
                type="button"
                onClick={handleRequestOtp}
                className="w-full bg-indigo-500 text-white py-2 rounded-md font-medium hover:bg-indigo-600 transition"
              >
                Request OTP
              </button>
            )}

            {/* OTP Section */}
            {otpSent && !emailVerified && (
              <>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                  >
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            {/* 🔥 Password appears only after verification */}
            {emailVerified && (
              <>
                <input
                  type="password"
                  placeholder="Set your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />

                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="w-full bg-green-500 text-white py-3 rounded-md font-semibold hover:bg-green-600 transition"
                >
                  Create Account
                </button>
              </>
            )}

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-semibold">
                Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
