// components/AdminSidebar.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTachometerAlt,
  FaUsers,
  FaClock,
  FaCalendarAlt,
  FaFileAlt,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaBuilding,
  FaUserTie,
  FaClipboardList,
  FaExclamationTriangle,
  FaHistory,
  FaChartPie,
  FaRocket,
  FaUserCheck,
  FaUserClock,
  FaMoneyCheckAlt,
  FaChevronDown  // ✅ Added missing import
} from "react-icons/fa";

export default function AdminSidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(['dashboard']);
  const isExpanded = isHovered || !isCollapsed;

  // ✅ Admin Sidebar items config with nested structure
  const menuItems = [
    {
      id: 'dashboard',
      name: "Dashboard",
      icon: FaTachometerAlt,
      children: [
        { name: "Main Dashboard", path: "/admin", icon: FaTachometerAlt },
        { name: "Analytics", path: "/admin/analytics", icon: FaChartPie },
        { name: "Reports", path: "/admin/reports", icon: FaFileAlt },
      ]
    },
    {
      id: 'employee',
      name: "Employee Management",
      icon: FaUsers,
      children: [
        { name: "All Employees", path: "/admin/employees", icon: FaUsers, badge: 234 },
        { name: "Departments", path: "/admin/departments", icon: FaBuilding },
        { name: "Designations", path: "/admin/designations", icon: FaUserTie },
        { name: "Pending Approvals", path: "/admin/employee-approvals", icon: FaClipboardList, badge: 12 },
      ]
    },
    {
      id: 'attendance',
      name: "Attendance",
      icon: FaClock,
      children: [
        { name: "Live Monitor", path: "/admin/attendance/live", icon: FaUserCheck },
        { name: "Attendance Log", path: "/admin/attendance/log", icon: FaHistory },
        { name: "Late Arrivals", path: "/admin/attendance/late", icon: FaUserClock, badge: 8 },
        { name: "Exceptions", path: "/admin/attendance/exceptions", icon: FaExclamationTriangle, badge: 3 },
        { name: "Shift Management", path: "/admin/shifts", icon: FaCalendarAlt },
      ]
    },
    {
      id: 'leave',
      name: "Leave Management",
      icon: FaCalendarAlt,
      children: [
        { name: "Leave Requests", path: "/admin/leave/requests", icon: FaFileAlt, badge: 15 },
        { name: "Leave Calendar", path: "/admin/leave/calendar", icon: FaCalendarAlt },
        { name: "Leave Policies", path: "/admin/leave/policies", icon: FaCog },
        { name: "Leave Balance", path: "/admin/leave/balance", icon: FaChartBar },
      ]
    },
    {
      id: 'payroll',
      name: "Payroll",
      icon: FaMoneyBillWave,
      children: [
        { name: "Salary Processing", path: "/admin/payroll/process", icon: FaMoneyCheckAlt, badge: 45 },
        { name: "Salary History", path: "/admin/payroll/history", icon: FaHistory },
        { name: "Tax Management", path: "/admin/payroll/taxes", icon: FaFileAlt },
        { name: "Advances & Deductions", path: "/admin/payroll/advances", icon: FaMoneyBillWave },
      ]
    },
    {
      id: 'reports',
      name: "Reports & Analytics",
      icon: FaChartBar,
      children: [
        { name: "Attendance Reports", path: "/admin/reports/attendance", icon: FaClock },
        { name: "Leave Reports", path: "/admin/reports/leave", icon: FaCalendarAlt },
        { name: "Payroll Reports", path: "/admin/reports/payroll", icon: FaMoneyBillWave },
        { name: "Custom Reports", path: "/admin/reports/custom", icon: FaChartPie },
      ]
    },
    {
      id: 'system',
      name: "System Settings",
      icon: FaCog,
      children: [
        { name: "Company Settings", path: "/admin/settings/company", icon: FaBuilding },
        { name: "Role Management", path: "/admin/settings/roles", icon: FaShieldAlt },
        { name: "Notifications", path: "/admin/settings/notifications", icon: FaBell },
        { name: "Audit Logs", path: "/admin/settings/audit", icon: FaHistory },
        { name: "Backup & Restore", path: "/admin/settings/backup", icon: FaRocket },
      ]
    }
  ];

  const toggleMenu = (menuId) => {
    if (!isExpanded) {
      setIsCollapsed(false);
    }
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuActive = (children) => {
    return children.some(child => location.pathname === child.path);
  };

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full bg-white shadow-xl border-r border-slate-200 overflow-hidden flex flex-col"
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.2 }}
    >
      {/* Sidebar Header - Admin Badge */}
      {isExpanded && (
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <FaShieldAlt className="text-white text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Admin Panel</p>
              <p className="text-xs text-purple-600">Super Admin</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {menuItems.map((menu, index) => {
          const Icon = menu.icon;
          const isActive = isMenuActive(menu.children);
          const isExpandedMenu = expandedMenus.includes(menu.id);

          return (
            <div key={menu.id} className="space-y-1">
              {/* Main Menu Button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => toggleMenu(menu.id)}
                className={`
                  w-full flex items-center p-2 rounded-lg cursor-pointer
                  transition-all duration-200 relative group
                  ${isActive 
                    ? 'text-purple-600 bg-purple-50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                  ${!isExpanded ? 'justify-center' : 'justify-between'}
                `}
              >
                <div className={`flex items-center ${isExpanded ? 'space-x-3' : ''}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {menu.name}
                    </span>
                  )}
                </div>
                
                {isExpanded && (
                  <motion.div
                    animate={{ rotate: isExpandedMenu ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaChevronDown className="w-3 h-3 text-slate-400" />
                  </motion.div>
                )}
              </motion.button>

              {/* Child Menu Items */}
              <AnimatePresence>
                {isExpanded && isExpandedMenu && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 space-y-1 overflow-hidden"
                  >
                    {menu.children.map((child, childIndex) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path;

                      return (
                        <motion.div
                          key={child.path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: childIndex * 0.03 }}
                          onClick={() => navigate(child.path)}
                          className={`
                            flex items-center justify-between p-2 rounded-lg cursor-pointer
                            transition-all duration-200
                            ${isChildActive
                              ? 'bg-purple-50 text-purple-600'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }
                            ${!isExpanded ? 'justify-center' : 'space-x-3'}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <ChildIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs whitespace-nowrap">
                              {child.name}
                            </span>
                          </div>
                          
                          {child.badge && (
                            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer - System Status */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-3 border-t border-slate-100 bg-slate-50"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">System Status</span>
                <span className="flex items-center text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Active Users</span>
                <span className="font-medium text-slate-700">1,234</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="bg-purple-600 h-1 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-400">Storage: 78% used</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}