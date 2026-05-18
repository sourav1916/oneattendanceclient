import React from "react";
import { motion } from "framer-motion";
import { FaWifi, FaSyncAlt, FaExclamationTriangle } from "react-icons/fa";

const ServerUnavailable = ({ onReload, isRetrying }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5 relative overflow-hidden font-sans">
      
      {/* Decorative Glowing Background Gradients (Soft Light Theme) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
      </div>

      {/* Main Glassmorphic Card (Light Theme) */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md bg-white/80 border border-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] text-center relative z-10"
      >
        {/* Glowing offline indicator */}
        <div className="flex justify-center mb-6 relative">
          <motion.div
            className="absolute inset-0 bg-red-500/10 rounded-full blur-xl w-24 h-24 mx-auto"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative bg-gradient-to-br from-red-500 to-amber-500 p-6 rounded-full text-white shadow-lg shadow-red-500/25">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <FaWifi size={40} className="opacity-90" />
            </motion.div>
            
            {/* Warning tag */}
            <span className="absolute -bottom-1 -right-1 bg-white text-red-500 p-1.5 rounded-full border border-red-100 shadow-sm">
              <FaExclamationTriangle size={14} />
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700">
            Server Unreachable
          </span>
        </h1>

        {/* Description */}
        <p className="text-slate-600 text-sm leading-relaxed mb-8 px-2">
          We are currently unable to establish a secure connection to the <strong>OneAttendance</strong> server. 
          This might be due to a temporary network issue or backend server maintenance.
        </p>

        {/* Interactive Action Area */}
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: isRetrying ? 1 : 1.02 }}
            whileTap={{ scale: isRetrying ? 1 : 0.98 }}
            onClick={onReload}
            disabled={isRetrying}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 ${
              isRetrying
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
            }`}
          >
            <FaSyncAlt 
              className={`text-sm ${isRetrying ? "animate-spin text-slate-400" : ""}`} 
            />
            {isRetrying ? "Retrying Connection..." : "Retry Connection"}
          </motion.button>
          
          {/* Subtle diagnostics details */}
          <div className="pt-2 text-[10px] text-slate-400 flex justify-center items-center gap-1.5 font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Connection Offline</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServerUnavailable;
