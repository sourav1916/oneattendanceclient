import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserShield } from "react-icons/fa";

const Login = () => {
    const navigate = useNavigate();

    // ---------------- STATES ----------------
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    // ---------------- HANDLERS ----------------

    const handleRequestOtp = () => {
        if (!email) {
            alert("Please enter email first");
            return;
        }

        console.log("OTP requested for:", email);
        setOtpSent(true);
        alert("OTP sent successfully");
    };

    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            alert("Enter valid 6-digit OTP");
            return;
        }

        console.log("OTP verified:", otp);

        alert("OTP Verified Successfully");

        // 🔥 Direct Redirect After Verify
        navigate("/dashboard");
    };

    const handleResendOtp = () => {
        console.log("OTP Resent");
        alert("OTP Resent Successfully");
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-6xl">

                {/* Left Section */}
                <div className="mb-10 md:mb-0 md:w-1/2">
                    <h1 className="text-5xl font-bold text-blue-600">
                        OneAttendanceClient
                    </h1>
                    <p className="mt-4 text-lg text-gray-700">
                        Manage client attendance, employees, and performance tracking in one place.
                    </p>
                </div>

                {/* Right Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg w-full md:w-96">

                    {/* Header */}
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

                        {/* Email (Always Visible, but disabled after OTP sent) */}
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={otpSent}
                            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 
        ${otpSent
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : "focus:ring-blue-400"}`}
                            required
                        />

                        {/* Show Password + Request OTP ONLY before OTP is sent */}
                        {!otpSent && (
                            <>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    className="w-full bg-indigo-500 text-white py-2 rounded-md font-medium hover:bg-indigo-600 transition"
                                >
                                    Request OTP
                                </button>
                            </>
                        )}

                        {/* OTP Section */}
                        {otpSent && (
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
                        <div className="text-center text-sm text-blue-600 cursor-pointer">
                            Forgot password?
                        </div>

                        <hr />

                        <div className="text-center text-sm">
                            Don’t have an account?{" "}
                            <Link to="/signup" className="text-blue-600 font-semibold">
                                Create Account
                            </Link>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default Login;
