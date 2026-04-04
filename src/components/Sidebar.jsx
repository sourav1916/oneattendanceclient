import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaLifeRing,
  FaChevronRight,
  FaUsers,
  FaChevronDown,
  FaCommentDots,
  FaCog,
  FaUserShield,
  FaUmbrellaBeach,
  FaFileInvoiceDollar,
  FaChartLine,
  FaEnvelope,
  FaBuilding,
  FaBriefcase,
  FaCalculator,
  FaProjectDiagram,
  FaTasks,
  FaClock,
  FaCalendarAlt,
  FaClipboardList,
} from 'react-icons/fa';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isMobile, sidebarOpen, toggleSidebar, onHover, isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const location = useLocation();
  const currentPath = location.pathname;

  const { hasPermission, activeRole, company } = useAuth();

  // Toggle section
  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const menuItems = [
    {
      icon: FaHome,
      label: 'Home',
      path: '/home',
      permission: null
    },
    {
      icon: FaClock,
      label: 'Attendance',
      path: '/attendance',
      permission: ['att_punch', 'att_view_own']
    },
    {
      icon: FaUmbrellaBeach,
      label: 'My Leaves',
      path: '/my-leaves',
      permission: ['leave_apply', 'leave_view_own', 'leave_cancel_own']
    },
    {
      icon: FaFileInvoiceDollar,
      label: 'My Salary',
      path: '/my-salary',
      permission: ['salary_view_own', 'salary_advance_view']
    },
    {
      icon: FaEnvelope,
      label: 'My Invites',
      path: '/my-invites',
      permission: null
    },
    {
      icon: FaCalendarAlt,
      label: 'Holidays',
      path: '/holidays',
      permission: null
    },
    {
      icon: FaBriefcase,
      label: 'Management',
      isSection: true,
      children: [
        {
          icon: FaBuilding,
          label: 'Invites Management',
          path: '/company-invites',
          permission: ['emp_invite', 'emp_invite_cancel_admin']
        },
        {
          icon: FaUsers,
          label: 'Employee Management',
          path: '/employee-management',
          permission: ['emp_create', 'emp_view', 'emp_update', 'emp_delete', 'report_emp', 'export_emp']
        },
        {
          icon: FaUserShield,
          label: 'Permissions',
          path: '/permission-management',
          permission: ['pkg_create', 'pkg_view', 'pkg_update', 'pkg_delete', 'pkg_assign']
        },
        {
          icon: FaClock,
          label: 'Attendance Management',
          path: '/attendance-management',
          permission: ['att_view_all', 'att_review', 'att_edit', 'att_delete', 'att_method_assign', 'att_method_update', 'att_method_remove', 'report_att', 'export_att']
        },
        {
          icon: FaUmbrellaBeach,
          label: 'Leave Management',
          path: '/leave-management',
          permission: ['leave_view_all', 'leave_review', 'leave_cancel_admin', 'leave_type_create', 'leave_type_update', 'leave_type_delete']
        },
        {
          icon: FaClipboardList,
          label: 'Leave Config',
          path: '/leave-config',
          permission: ['leave_type_create', 'leave_type_update', 'leave_type_delete']
        },
        {
          icon: FaChartLine,
          label: 'Leave Balance',
          path: '/leave-balance',
          permission: ['leave_view_all', 'leave_review']
        },
        {
          icon: FaCog,
          label: 'Company Settings',
          path: '/company-settings',
          permission: ['cmp_update_own', 'cmp_delete', 'shift_create', 'shift_view', 'shift_update', 'shift_delete']
        },
        {
          icon: FaCalendarAlt,
          label: 'Holiday Management',
          path: '/holiday-management',
          permission: ['hd_create', 'hd_view_company', 'hd_update', 'hd_delete']
        }
      ]
    },
    {
      icon: FaCommentDots,
      label: 'Help',
      path: '/help',
      permission: null
    }
  ];

  const isActiveRoute = (itemPath) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  const isCompanyOwnerForCurrentCompany =
    activeRole === 'company_owner' || company?.role === 'company_owner';

  const isItemDisabled = (item) =>
    ['/attendance', '/my-leaves', '/my-salary', '/my-invites'].includes(item.path) && isCompanyOwnerForCurrentCompany;

  useEffect(() => {
    if (onHover && !isMobile) {
      onHover(isHovered);
    }
  }, [isHovered, onHover, isMobile]);

  // ================= MOBILE SIDEBAR =================
  if (isMobile) {
    return (
      <>
        {/* Mobile Sidebar */}
        <div className={`
          fixed left-0 top-16 z-30 w-72 h-[calc(100vh-4rem)]
          bg-white transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto overflow-x-hidden
        `}>
          <div className="p-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                if (item.isSection) {
                  const isOpen = openSections[item.label];
                  // SHOW ALL CHILDREN BUT WITH AUTHORIZATION DATA
                  const authorizedChildren = item.children;

                  // Disable section itself if NO child is authorized
                  const hasAnyChildAuthorized = authorizedChildren.some(child => hasPermission(child.permission));

                  if (!hasAnyChildAuthorized) {
                    return (
                      <div key={item.label} className="mb-2">
                        <div className="w-full flex items-center justify-between px-3 py-3 rounded-xl opacity-50 cursor-not-allowed">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                              <item.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">{item.label}</span>
                          </div>
                          <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.label} className="mb-2">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(item.label)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        {isOpen ? (
                          <FaChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>

                      {/* Section Children */}
                      {isOpen && (
                        <div className="ml-8 mt-1 space-y-1">
                          {authorizedChildren.map((child) => {
                            const isActive = isActiveRoute(child.path);
                            const authorized = hasPermission(child.permission);

                            if (!authorized) {
                              return (
                                <div
                                  key={child.label}
                                  className="flex items-center px-3 py-2 rounded-xl opacity-50 cursor-not-allowed"
                                >
                                  <div className="p-2 rounded-lg bg-gray-100 text-gray-400 mr-3">
                                    <child.icon className="w-3 h-3" />
                                  </div>
                                  <span className="text-xs text-gray-400">{child.label}</span>
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={child.label}
                                to={child.path}
                                onClick={() => toggleSidebar()}
                                className={`
                                  flex items-center px-3 py-2 rounded-xl transition-all duration-200
                                  ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                  }
                                `}
                              >
                                <div className={`
                                  p-2 rounded-lg mr-3
                                  ${isActive
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                  }
                                `}>
                                  <child.icon className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-medium">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular menu item
                const isActive = isActiveRoute(item.path);
                const authorized = hasPermission(item.permission);
                const disabled = isItemDisabled(item);
                const Icon = item.icon;

                if (!authorized || disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center px-3 py-3 rounded-xl opacity-50 cursor-not-allowed mb-1"
                    >
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-400 mr-3">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => toggleSidebar()}
                    className={`
                      flex items-center px-3 py-3 rounded-xl transition-all duration-200 mb-1
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg mr-3
                      ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <FaLifeRing className="text-blue-600 mb-2" size={20} />
                <p className="text-xs font-semibold text-gray-700 mb-1">Need Help?</p>
                <p className="text-xs text-gray-500">Contact our support team</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ================= DESKTOP SIDEBAR =================
  const isSidebarExpanded = isExpanded;

  const renderMenuItem = (item, isExpandedState) => {
    const isActive = isActiveRoute(item.path);
    const authorized = hasPermission(item.permission);
    const disabled = isItemDisabled(item);
    const Icon = item.icon;

    if (!authorized || disabled) {
      return (
        <div
          key={item.label}
          className={`
            flex items-center rounded-xl transition-all duration-200
            ${isExpandedState ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
            cursor-not-allowed opacity-50
          `}
          title={
            !isExpandedState
              ? `${item.label} (${disabled ? 'Disabled for company owner' : 'Access Denied'})`
              : disabled
                ? 'Disabled for company owner'
                : 'Access Denied - You don\'t have permission'
          }
        >
          <div className={`
            p-2 rounded-lg transition-all duration-200
            ${isExpandedState ? '' : 'mx-auto'}
            bg-gray-100 text-gray-400
          `}>
            <Icon className="w-4 h-4" />
          </div>
          {isExpandedState && (
            <span className="flex-1 text-sm font-medium text-gray-400">
              {item.label}
            </span>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        to={item.path}
        className={`
          flex items-center rounded-xl transition-all duration-200 group
          ${isExpandedState ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
          ${isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }
        `}
        title={!isExpandedState ? item.label : ''}
      >
        <div className={`
          p-2 rounded-lg transition-all duration-200
          ${isExpandedState ? '' : 'mx-auto'}
          ${isActive
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
          }
        `}>
          <Icon className="w-4 h-4" />
        </div>
        {isExpandedState && (
          <>
            <span className={`flex-1 text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            )}
          </>
        )}
        {!isExpandedState && isActive && (
          <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></span>
        )}
      </Link>
    );
  };

  const renderSection = (item, isExpandedState) => {
    const isOpen = openSections[item.label];
    const Icon = item.icon;
    const authorizedChildren = item.children;

    // Disable section itself if NO child is authorized
    const hasAnyChildAuthorized = authorizedChildren.some(child => hasPermission(child.permission));

    if (!hasAnyChildAuthorized) {
      return (
        <div key={item.label} className="mb-1">
          <div
            className={`
              w-full flex items-center rounded-xl transition-all duration-200
              ${isExpandedState ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
              cursor-not-allowed opacity-50
            `}
            title={!isExpandedState ? `${item.label} (Access Denied)` : 'Access Denied - You don\'t have permission'}
          >
            <div className={`
              p-2 rounded-lg transition-all duration-200
              ${isExpandedState ? '' : 'mx-auto'}
              bg-gray-100 text-gray-400
            `}>
              <Icon className="w-4 h-4" />
            </div>
            {isExpandedState && (
              <>
                <span className="flex-1 text-sm font-medium text-left text-gray-400">
                  {item.label}
                </span>
                <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={item.label} className="mb-1">
        {/* Section Header */}
        <button
          onClick={() => toggleSection(item.label)}
          className={`
            w-full flex items-center rounded-xl transition-all duration-200
            ${isExpandedState ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
            text-gray-700 hover:bg-gray-50 hover:text-blue-600
          `}
          title={!isExpandedState ? item.label : ''}
        >
          <div className={`
            p-2 rounded-lg transition-all duration-200
            ${isExpandedState ? '' : 'mx-auto'}
            bg-gray-100 text-gray-600
          `}>
            <Icon className="w-4 h-4" />
          </div>
          {isExpandedState && (
            <>
              <span className="flex-1 text-sm font-medium text-left">
                {item.label}
              </span>
              {isOpen ? (
                <FaChevronDown className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}
            </>
          )}
        </button>

        {/* Section Children */}
        {isExpandedState && isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {authorizedChildren.map((child) => {
              const isActive = isActiveRoute(child.path);
              const ChildIcon = child.icon;
              const authorized = hasPermission(child.permission);

              if (!authorized) {
                return (
                  <div
                    key={child.label}
                    className={`
                      flex items-center rounded-xl transition-all duration-200
                      px-3 py-2 gap-3
                      cursor-not-allowed opacity-50
                      text-gray-400
                    `}
                    title="Access Denied"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                      <ChildIcon className="w-3 h-3" />
                    </div>
                    <span className="flex-1 text-xs font-medium">
                      {child.label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={child.label}
                  to={child.path}
                  className={`
                    flex items-center rounded-xl transition-all duration-200 group
                    px-3 py-2 gap-3
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                    }
                  `}>
                    <ChildIcon className="w-3 h-3" />
                  </div>
                  <span className={`flex-1 text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {child.label}
                  </span>
                  {isActive && (
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // FIXED: Proper hover handling for desktop sidebar
  const handleMouseEnter = () => {
    // Only trigger hover if sidebar is NOT already expanded by toggle
    if (!isSidebarExpanded) {
      setIsHovered(true);
      if (onHover) onHover(true);
    }
  };

  const handleMouseLeave = () => {
    // Always reset hover state on mouse leave
    setIsHovered(false);
    if (onHover) onHover(false);
  };

  return (
    <div
      className={`
        fixed left-0 top-16 z-20 bg-white
        transition-all duration-300 ease-out
        ${isSidebarExpanded ? 'w-64' : 'w-20'}
        h-[calc(100vh-4rem)]
        shadow-lg border-r border-gray-200
        overflow-y-auto overflow-x-hidden
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 py-6 px-2">
          {menuItems.map((item) => {
            if (item.isSection) {
              return renderSection(item, isSidebarExpanded);
            }
            return renderMenuItem(item, isSidebarExpanded);
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
