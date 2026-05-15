import React from "react";
import { motion } from "framer-motion";
import { FaShieldAlt, FaLock, FaUserShield } from "react-icons/fa";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <FaShieldAlt size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500">Last updated: May 15, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaUserShield className="text-indigo-500" />
              1. Information We Collect
            </h2>
            <p>
              When you use OneAttendance, we collect information that you provide directly to us, such as your name, email address, and profile information when you register through Facebook or Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaLock className="text-indigo-500" />
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to develop new ones, and to protect OneAttendance and our users. This includes using your email for authentication and account security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Data Sharing</h2>
            <p>
              We do not share your personal information with companies, organizations, or individuals outside of OneAttendance except in the following cases: with your consent, for external processing, or for legal reasons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Security</h2>
            <p>
              We work hard to protect OneAttendance and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We use 256-bit encryption and secure authentication protocols.
            </p>
          </section>

          <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm">
              If you have any questions about this Privacy Policy, please contact us at modaksubham69@gmail.com.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
