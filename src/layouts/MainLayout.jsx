import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const navbarRef = useRef(null);
  const mainContentRef = useRef(null); // ← FIXED: Missing ref

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
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Measure navbar height
  useEffect(() => {
    const measureNavbar = () => {
      if (navbarRef.current) {
        const height = navbarRef.current.offsetHeight;
        setNavbarHeight(height);
      }
    };

    measureNavbar();
    window.addEventListener('resize', measureNavbar);
    window.addEventListener('orientationchange', measureNavbar);
    
    return () => {
      window.removeEventListener('resize', measureNavbar);
      window.removeEventListener('orientationchange', measureNavbar);
    };
  }, []);

  // Set main content height - FIXED
  useEffect(() => {
    if (mainContentRef.current && navbarRef.current) {
      const updateHeight = () => {
        const navbarHeight = navbarRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - navbarHeight;
        
        if (mainContentRef.current) {
          mainContentRef.current.style.height = `${availableHeight}px`;
          mainContentRef.current.style.maxHeight = `${availableHeight}px`;
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);
      window.addEventListener('orientationchange', updateHeight);
      
      return () => {
        window.removeEventListener('resize', updateHeight);
        window.removeEventListener('orientationchange', updateHeight);
      };
    }
  }, [navbarHeight]);

  // Handle mobile menu click outside
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
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100vh';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
    };
  }, [isMobile, isMobileMenuOpen]);

  return (
    <>
      <div 
        className="h-screen w-screen flex flex-col bg-gradient-to-br from-slate-50 to-white overflow-hidden"
      >
        {/* Navbar */}
        <div ref={navbarRef} className="flex-shrink-0 z-50">
          <Navbar 
            isCollapsed={isCollapsed} 
            isMobile={isMobile}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>
        
        <div className="flex flex-1 min-h-0 relative">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="flex-shrink-0 border-r border-slate-200 bg-white shadow-xl">
              <Sidebar 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed}
                isMobile={false}
              />
            </div>
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
                  id="mobile-sidebar"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="fixed top-[64px] left-0 z-50 bg-white shadow-2xl border-r border-slate-200"
                  style={{ 
                    height: `calc(100vh - 64px)`,
                    width: '280px'
                  }}
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
          <main
            ref={mainContentRef}
            className="flex-1 min-h-0 overflow-y-auto bg-slate-50 lg:scroll-smooth"
          >
            <div className="p-4 md:p-6 sm:p-2 max-w-7xl mx-auto min-h-full">
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
