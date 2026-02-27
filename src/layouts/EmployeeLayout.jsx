// layouts/EmployeeLayout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CustomScrollbar from "../components/CustomScrollbar"; // Add this import
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto close mobile menu when resizing to desktop
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobile || !isMobileMenuOpen) return;
    
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const hamburgerBtn = document.getElementById('hamburger-btn');
      
      if (sidebar && !sidebar.contains(e.target) && 
          hamburgerBtn && !hamburgerBtn.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  return (
    <>
      {/* Add CustomScrollbar here - it will inject styles globally */}
      <CustomScrollbar />
      
      <div className="h-screen bg-gradient-to-br from-slate-50 to-white overflow-hidden flex flex-col">
        {/* Navbar with mobile menu toggle */}
        <Navbar 
          isCollapsed={isCollapsed} 
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <Sidebar 
              isCollapsed={isCollapsed} 
              setIsCollapsed={setIsCollapsed}
              isMobile={false}
            />
          )}
          
          {/* Mobile Sidebar - Overlay (initially hidden) */}
          <AnimatePresence>
            {isMobile && isMobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black z-40"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Sidebar */}
                <motion.div
                  id="mobile-sidebar"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="fixed left-0 top-0 h-full z-50"
                  style={{ marginTop: '4rem' }} // Height of navbar
                >
                  <Sidebar 
                    isCollapsed={false} 
                    setIsCollapsed={setIsCollapsed}
                    isMobile={true}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Main Content */}
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto bg-slate-50 w-full"
          >
            <div className="p-4 md:p-6 sm:p-2">
              <AnimatePresence mode="wait">
                <Outlet />
              </AnimatePresence>
            </div>
          </motion.main>
        </div>
      </div>
    </>
  );
}