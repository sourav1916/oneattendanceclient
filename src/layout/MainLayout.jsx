import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true); // Start collapsed

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On desktop, always close mobile sidebar state
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle sidebar - works on both mobile and desktop
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      // On desktop, toggle between collapsed and expanded states
      setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
      // Reset hover state when toggling
      setSidebarHovered(false);
    }
  };

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle sidebar hover state from child (desktop only)
  const handleSidebarHover = (hovered) => {
    if (!isMobile) {
      // Only set hover state (the Sidebar component will handle expansion)
      setSidebarHovered(hovered);
    }
  };

  // Determine if sidebar should be expanded
  const isSidebarExpanded = () => {
    if (isMobile) return false;
    // If sidebar is hovered, always expand (even if collapsed)
    if (sidebarHovered) return true;
    // Otherwise, use the collapsed state
    return !desktopSidebarCollapsed;
  };

  // Get the actual sidebar state for the icon
  const getSidebarState = () => {
    if (isMobile) return sidebarOpen;
    // For desktop: expanded if not collapsed OR hovered
    return !desktopSidebarCollapsed || sidebarHovered;
  };

  // FIXED: Content margin based on actual sidebar state
  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    // When sidebar is expanded (either by toggle or hover), content should shift
    if (isSidebarExpanded()) return 'ml-64'; // 64 is the expanded width (w-64)
    return 'ml-20'; // 20 is the collapsed width (w-20)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar - always at top */}
      <Navbar 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        isDesktopSidebarExpanded={!desktopSidebarCollapsed || sidebarHovered} // Pass desktop sidebar state
      />
      
      <div className="flex relative">
        {/* Sidebar - fixed position */}
        <Sidebar 
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          onHover={handleSidebarHover}
          isExpanded={isSidebarExpanded()} // Pass the expanded state to Sidebar
        />

        {/* Overlay for mobile when sidebar is open */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-20 transition-opacity duration-300"
            onClick={handleOverlayClick}
            style={{ top: '64px' }}
          />
        )}

        {/* Main Content */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-out
            ${getContentMargin()}
            min-h-[calc(100vh-64px)]
          `}
          style={{
            padding: '1.5rem',
            transition: 'margin-left 0.3s ease-out'
          }}
        >
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;