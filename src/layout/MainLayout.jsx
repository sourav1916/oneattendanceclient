import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Reset mobile sidebar state on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Handle sidebar hover state from child
  const handleSidebarHover = (hovered) => {
    setSidebarHovered(hovered);
  };

  // Calculate margin based on sidebar state
  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return sidebarHovered ? 'ml-64' : 'ml-20'; // 64 = expanded, 20 = collapsed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar - always at top */}
      <Navbar 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex">
        {/* Sidebar - fixed position but we push content with margin */}
        <Sidebar 
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          onHover={handleSidebarHover}
        />

        {/* Overlay for mobile when sidebar is open */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity duration-300"
            onClick={handleOverlayClick}
          />
        )}

        {/* Main Content - with margin to account for fixed sidebar */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-out overflow-auto
            ${getContentMargin()}
            p-4 sm:p-6 lg:p-8
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;