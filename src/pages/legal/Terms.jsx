import React from "react";
import { motion } from "framer-motion";
import { FaFileContract, FaHandshake, FaUserCheck } from "react-icons/fa";

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <FaFileContract size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-slate-500">Last updated: May 15, 2026</p>
          </div>
        </div>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaHandshake className="text-blue-500" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using OneAttendance, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaUserCheck className="text-blue-500" />
              2. User Accounts
            </h2>
            <p>
              To use OneAttendance, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">3. Use of Service</h2>
            <p>
              OneAttendance is designed for workforce management and attendance tracking. You agree to use the service only for lawful purposes and in accordance with these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">4. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are and will remain the exclusive property of OneAttendance and its licensors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-3">5. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever.
            </p>
          </section>

          <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm">
              OneAttendance reserves the right to modify or replace these Terms at any time. Your continued use of the service after any changes constitutes acceptance of the new Terms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;
