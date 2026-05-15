import React from "react";
import { motion } from "framer-motion";
import { FaTrashAlt, FaUserSlash, FaInfoCircle } from "react-icons/fa";

const DataDeletion = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <FaTrashAlt size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Data Deletion Instructions</h1>
            <p className="text-slate-500">How to request removal of your data</p>
          </div>
        </div>

        <div className="space-y-6 text-slate-600 leading-relaxed">
          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
            <p className="text-blue-800 flex items-start gap-3">
              <FaInfoCircle className="mt-1 shrink-0" />
              <span>
                OneAttendance is a Facebook-connected app. According to Facebook policy, we provide this page to help you delete your activities and data associated with our platform.
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaUserSlash className="text-red-500" />
              How to delete your data:
            </h2>
            <ol className="space-y-4 list-decimal pl-5">
              <li>
                Go to your Facebook Account's <strong>Settings & Privacy</strong>. Click <strong>Settings</strong>.
              </li>
              <li>
                Look for <strong>Apps and Websites</strong> and you will see all of the apps and websites you linked with your Facebook.
              </li>
              <li>
                Search and Click <strong>OneAttendance</strong> in the search bar.
              </li>
              <li>
                Scroll and click <strong>Remove</strong>.
              </li>
              <li>
                Congratulations, you have successfully removed your app activities and data.
              </li>
            </ol>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Direct Deletion Request</h2>
            <p>
              If you wish to delete your entire account and all associated attendance records from our servers, please send an email to:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg font-mono text-center border border-slate-200">
              modaksubham69@gmail.com
            </div>
            <p className="mt-4 text-sm italic">
              Please include your registered email address. We will process your request within 48 hours and send you a confirmation.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default DataDeletion;
