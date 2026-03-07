import { FaFingerprint } from 'react-icons/fa';

function HomePage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to OneAttendance</h1>
        </div>

        {/* Main Add Staff Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Staff</h2>
              <p className="text-gray-600 mt-1">
                • Regular Staff and Contract Staff (Monthly, Weekly, Hourly and Work Basis)
              </p>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl text-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]">
            + Add Staff
          </button>
        </div>

        {/* Help Footer */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not sure where to start?</p>
          <a 
            href="#" 
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Get Help
          </a>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
