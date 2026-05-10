import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from "../context/AuthContext";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebarCollapsed');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
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
    const sidebarOffset = isMobile ? '0px' : (desktopSidebarCollapsed ? '64px' : '256px');
    document.documentElement.style.setProperty('--sidebar-offset', sidebarOffset);
    window.dispatchEvent(new Event('sidebar-offset-change'));
  }, [isMobile, desktopSidebarCollapsed]);

  // Desktop sidebar is pinned open/closed only via the navbar toggle button.
  // Clicking outside does NOT auto-collapse it so users can navigate freely.

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const nextCollapsed = !desktopSidebarCollapsed;
      setDesktopSidebarCollapsed(nextCollapsed);
      setSidebarHovered(false);
      try { localStorage.setItem('sidebarCollapsed', String(nextCollapsed)); } catch {}
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
    return desktopSidebarCollapsed ? 'ml-16' : 'ml-64';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        isDesktopSidebarExpanded={!desktopSidebarCollapsed}
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
