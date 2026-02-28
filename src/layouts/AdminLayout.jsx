// layouts/AdminLayout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";
import CustomScrollbar from "../components/CustomScrollbar";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <CustomScrollbar />
      
      {/* Use CSS grid/flex for layout - NO manual height calculations */}
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-white">
        {/* Navbar - fixed at top */}
        <AdminNavbar 
          isCollapsed={isCollapsed} 
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        
        {/* Main content area - takes remaining height */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <AdminSidebar 
              isCollapsed={isCollapsed} 
              setIsCollapsed={setIsCollapsed}
              isMobile={false}
            />
          )}
          
          {/* Mobile Sidebar */}
          <AnimatePresence>
            {isMobile && isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black z-40"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-0 top-[64px] bottom-0 z-50 bg-white shadow-xl w-64"
                >
                  <AdminSidebar 
                    isCollapsed={false} 
                    setIsCollapsed={setIsCollapsed}
                    isMobile={true}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Main Content - Let CSS handle scrolling naturally */}
          <main 
            className="flex-1 overflow-y-auto bg-slate-50"
            style={{
              // These are the ONLY styles needed for smooth mobile scrolling
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain', // Prevents pull-to-refresh
            }}
          >
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <Outlet />
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}