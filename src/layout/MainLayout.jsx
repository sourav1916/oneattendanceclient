import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from "../context/AuthContext";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);
  const sidebarRef = useRef(null);

  // ── Pull company data from your auth context ──
  // Adjust these destructured names to match what your AuthContext actually exposes
  const { company, companies, selectCompany, refreshKey } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobile && !desktopSidebarCollapsed) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
          const isToggleButton = event.target.closest('button[data-sidebar-toggle="true"]');
          if (!isToggleButton) {
            setDesktopSidebarCollapsed(true);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, desktopSidebarCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
      setSidebarHovered(false);
    }
  };

  const handleOverlayClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const handleSidebarHover = (hovered) => {
    if (!isMobile) setSidebarHovered(hovered);
  };

  const isSidebarExpanded = () => {
    if (isMobile) return false;
    if (sidebarHovered) return true;
    return !desktopSidebarCollapsed;
  };

  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return 'ml-20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        isDesktopSidebarExpanded={!desktopSidebarCollapsed || sidebarHovered}
        company={company}
        companies={companies}
        onCompanySwitch={selectCompany}
      />

      <div className="flex relative">
        <div ref={sidebarRef} className="z-30">
          <Sidebar
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            onHover={handleSidebarHover}
            isExpanded={isSidebarExpanded()}
          />
        </div>

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-20 transition-opacity duration-300"
            onClick={handleOverlayClick}
            style={{ top: '64px' }}
          />
        )}

        <main
          className={`
            flex-1 transition-all duration-300 ease-out
            ${getContentMargin()}
            min-h-[calc(100vh-64px)]
            max-w-full
          `}
          style={{
            padding: isMobile ? '0px' : '1rem',
            transition: 'margin-left 0.3s ease-out'
          }}
        >
          <div className="max-w-full" key={refreshKey}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;