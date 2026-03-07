import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaBook,
  FaCommentDots,
  FaCog,
  FaChevronRight,
} from 'react-icons/fa';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = ({ isMobile, sidebarOpen, toggleSidebar, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  // Call onHover when isHovered changes
  useEffect(() => {
    if (onHover && !isMobile) {
      onHover(isHovered);
    }
  }, [isHovered, onHover, isMobile]);

  const menuItems = [
    { icon: FaHome, label: 'Home', path: '/home' },
    { icon: FaBook, label: 'Cash Book', path: '/cashbook' },
    { icon: FaCommentDots, label: 'Help', path: '/help' },
    { icon: FaCog, label: 'Settings', path: '/settings' },
  ];

  const isActiveRoute = (itemPath) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  // Mobile Sidebar
  if (isMobile) {
    return (
      <div className={`
        fixed left-0 z-30 w-72 bg-white
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        top-16 h-[calc(100vh-4rem)]
        shadow-xl border-r border-gray-200
      `}>
        <nav className="p-3 overflow-y-auto h-full">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={() => isMobile && toggleSidebar()}
                    className={`
                      flex items-center justify-between px-3 py-2.5 rounded-xl
                      transition-all duration-200 group
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                        }
                      `}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                        {item.label}
                      </span>
                    </div>
                    
                    {isActive && (
                      <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    )}
                    
                    {!isActive && (
                      <FaChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div
      className={`
        fixed left-0 z-20 bg-white
        transition-all duration-300 ease-out
        ${isHovered ? 'w-64' : 'w-20'}
        top-16 h-[calc(100vh-4rem)]
        shadow-lg border-r border-gray-200
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 py-6 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center rounded-xl transition-all duration-200 group
                      ${isHovered ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }
                    `}
                    title={!isHovered ? item.label : ''}
                  >
                    <div className={`
                      p-2 rounded-lg transition-all duration-200
                      ${isHovered ? '' : 'mx-auto'}
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }
                    `}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    
                    {isHovered && (
                      <>
                        <span className={`flex-1 text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        )}
                        {!isActive && (
                          <FaChevronRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 transition-all" />
                        )}
                      </>
                    )}

                    {!isHovered && isActive && (
                      <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;