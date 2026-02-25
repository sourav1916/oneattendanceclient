// pages/Admin/Home.js
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    todayAttendance: 0,
    lateEntries: 0,
    pendingLeaves: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // ✅ DUMMY DATA FETCH
  const fetchStats = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Realistic dummy admin stats
    const dummyStats = {
      totalEmployees: 127,
      totalDepartments: 8,
      todayAttendance: 89,  // 89%
      lateEntries: 12,
      pendingLeaves: 5
    };
    
    setStats(dummyStats);
    setLoading(false);
  };

  // ✅ LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Logout */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, System Admin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayAttendance}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lateEntries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDepartments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Management</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/employees" className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">👥</div>
              <span className="font-medium text-gray-900 block">All Employees</span>
            </Link>
            <Link to="/admin/add-employee" className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center hover:bg-emerald-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">➕</div>
              <span className="font-medium text-gray-900 block">Add Employee</span>
            </Link>
            <Link to="/admin/departments" className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center hover:bg-purple-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏢</div>
              <span className="font-medium text-gray-900 block">Departments</span>
            </Link>
            <Link to="/admin/leaves" className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center hover:bg-orange-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</div>
              <span className="font-medium text-gray-900 block">Leave Requests</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Attendance</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/attendance" className="p-4 bg-green-50 border border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</div>
              <span className="font-medium text-gray-900 block">Today Attendance</span>
            </Link>
            <Link to="/admin/reports" className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center hover:bg-indigo-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📈</div>
              <span className="font-medium text-gray-900 block">Reports</span>
            </Link>
            <Link to="/admin/late-entries" className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center hover:bg-yellow-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚠️</div>
              <span className="font-medium text-gray-900 block">Late Markings</span>
            </Link>
            <Link to="/admin/export" className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center hover:bg-gray-100 transition-colors group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📥</div>
              <span className="font-medium text-gray-900 block">Export Data</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
