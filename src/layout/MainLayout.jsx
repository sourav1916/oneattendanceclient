import React from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - handles its own hover state */}
      <Sidebar />
      
      {/* Main Content - dynamically adjusts to sidebar width */}
      <div className="flex-1 transition-all duration-300 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
