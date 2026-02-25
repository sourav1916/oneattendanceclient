// pages/Enduser/Home.js
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [todayStatus, setTodayStatus] = useState('pending');
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalPresent: 0,
    consecutiveDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDashboard();
  }, []);

//   **// ✅ DUMMY DATA FETCH**
  const fetchUserDashboard = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dummy data
    const dummyData = {
      today_status: 'pending', // or 'present'
      stats: {
        totalPresent: 18,
        consecutiveDays: 5
      },
      recent_attendance: [
        {
          date: '2026-02-24',
          check_in: '09:15 AM',
          check_out: '06:30 PM',
          status: 'present'
        },
        {
          date: '2026-02-23', 
          check_in: '09:30 AM',
          check_out: '05:45 PM',
          status: 'present'
        },
        {
          date: '2026-02-22',
          check_in: '10:00 AM',
          status: 'half-day'
        },
        {
          date: '2026-02-21',
          check_in: '09:10 AM',
          check_out: '06:20 PM',
          status: 'present'
        },
        {
          date: '2026-02-20',
          check_in: '09:25 AM',
          check_out: '06:15 PM', 
          status: 'present'
        }
      ]
    };
    
    setTodayStatus(dummyData.today_status);
    setRecentAttendance(dummyData.recent_attendance);
    setStats(dummyData.stats);
    setLoading(false);
  };

//   **// ✅ MARK ATTENDANCE (Dummy)**
  const markAttendance = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setTodayStatus('present');
    
    // Update recent attendance
    setRecentAttendance(prev => [{
      date: '2026-02-25',
      check_in: new Date().toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      status: 'present'
    }, ...prev.slice(0, 4)]);
    
    // Update stats
    setStats(prev => ({
      totalPresent: prev.totalPresent + 1,
      consecutiveDays: prev.consecutiveDays + 1
    }));
  };

//   **// ✅ LOGOUT**
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header + Logout */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Dashboard</h1>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            todayStatus === 'present' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {todayStatus === 'present' ? '✅ Present Today' : '⏰ Mark Attendance'}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {/* Mark Attendance */}
      {todayStatus === 'pending' && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
          <p className="text-emerald-100 mb-6">Click to mark your attendance for today</p>
          <button
            onClick={markAttendance}
            className="px-8 py-3 bg-white text-emerald-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Mark Present Now
          </button>
        </div>
      )}

      {todayStatus === 'present' && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Attendance Marked!</h2>
          <p className="text-green-100 mb-2">Time: {new Date().toLocaleTimeString()}</p>
          <p className="text-green-100">Have a productive day!</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalPresent}</div>
          <p className="text-gray-600 font-medium">Total Present Days</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.consecutiveDays}</div>
          <p className="text-gray-600 font-medium">Streak</p>
          <p className="text-sm text-gray-500">Consecutive days</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/my-attendance" className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
          <h3 className="font-semibold text-gray-900 mb-1">My Attendance</h3>
          <p className="text-sm text-gray-500">Monthly view & history</p>
        </Link>
        <Link to="/leaves" className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📅</div>
          <h3 className="font-semibold text-gray-900 mb-1">Apply Leave</h3>
          <p className="text-sm text-gray-500">Request time off</p>
        </Link>
        <Link to="/profile" className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
          <h3 className="font-semibold text-gray-900 mb-1">My Profile</h3>
          <p className="text-sm text-gray-500">Update details</p>
        </Link>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentAttendance.slice(0, 5).map((record) => (
            <div key={record.date} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</p>
                  <p className="text-sm text-gray-500">
                    {record.check_in ? `In: ${record.check_in}` : 'No check-in'}
                    {record.check_out && ` | Out: ${record.check_out}`}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                  record.status === 'half-day' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
