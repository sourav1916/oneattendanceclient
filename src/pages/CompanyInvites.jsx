import { useState,Fragment } from "react";
import { 
  FaCheckCircle, 
  FaTimesCircle,
  FaUserTie, 
  FaClock, 
  FaEnvelope,
  FaBriefcase,
  FaExclamationCircle
} from "react-icons/fa";

const dummyInvites = [
{
  id: 1, // Added unique ID
  success: true,
  message: "Invitation sent successfully",
  invite_link: "https://oneattendanceclient.vercel.app/invite/df0dbfccf43b6a1d7b3862f1a90bd7598620043c0ea2ef9ff5a51f5c3475f627",
  user: {
    id: 9,
    name: null,
    email: "comp1@gmail.com"
  },
  employment_type: "full_time",
  salary_type: "monthly",
  designation: "Manager",
  permissions_invited: [
    {
      id: 6,
      name: "Can approve leave requests"
    }
  ],
  expires_at: "2026-03-11T16:16:13.371Z"
},
{
  id: 2, // Added unique ID
  success: true,
  invite_link: "https://oneattendanceclient.vercel.app/invite/samplelink123",
  user: {
    id: 11,
    name: null,
    email: "staff@gmail.com"
  },
  employment_type: "part_time",
  salary_type: "hourly",
  designation: "Assistant",
  permissions_invited: [
    {
      id: 2,
      name: "Can view attendance"
    },
    {
      id: 4,
      name: "Can edit profile"
    }
  ],
  expires_at: "2026-03-09T10:00:00.000Z"
},
{
  id: 3, // Added unique ID
  success: true,
  invite_link: "https://oneattendanceclient.vercel.app/invite/samplelink456",
  user: {
    id: 12,
    name: null,
    email: "developer@gmail.com"
  },
  employment_type: "full_time",
  salary_type: "monthly",
  designation: "Senior Developer",
  permissions_invited: [
    {
      id: 1,
      name: "Can manage projects"
    },
    {
      id: 3,
      name: "Can approve timesheets"
    },
    {
      id: 5,
      name: "Can access analytics"
    }
  ],
  expires_at: "2026-04-15T10:00:00.000Z"
}
];

export default function CompanyInvites() {
  const [invites, setInvites] = useState(dummyInvites);
  const [expandedRows, setExpandedRows] = useState([]);

  const handleAccept = (inviteId) => {
    // Add your accept logic here
    alert(`Accepting invitation for ID: ${inviteId}`);
    // Example: Remove from list after accept
    // setInvites(prev => prev.filter(invite => invite.id !== inviteId));
  };

  const handleRemove = (inviteId) => {
    // Add your remove logic here
    if (window.confirm('Are you sure you want to remove this invitation?')) {
      alert(`Removing invitation for ID: ${inviteId}`);
      // Example: Remove from list
      // setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (expiryDate) => {
    const expired = new Date(expiryDate) < new Date();
    return expired ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        <FaExclamationCircle className="text-xs" />
        Expired
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <FaCheckCircle className="text-xs" />
        Active
      </span>
    );
  };

  const getEmploymentBadge = (type) => {
    const styles = {
      full_time: "bg-blue-100 text-blue-700",
      part_time: "bg-amber-100 text-amber-700"
    };
    return styles[type] || "bg-gray-100 text-gray-700";
  };

  const getSalaryBadge = (type) => {
    const styles = {
      monthly: "bg-purple-100 text-purple-700",
      hourly: "bg-indigo-100 text-indigo-700"
    };
    return styles[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Company Invitations
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage and track all your pending invitations
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-800">{invites.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600">Active</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600">
              {invites.filter(i => new Date(i.expires_at) > new Date()).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600">Expired</p>
            <p className="text-lg sm:text-xl font-bold text-rose-600">
              {invites.filter(i => new Date(i.expires_at) < new Date()).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600">Full Time</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              {invites.filter(i => i.employment_type === "full_time").length}
            </p>
          </div>
        </div>

        {/* Mobile View (Cards) - visible on small screens */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 gap-4">
            {invites.map((invite) => {
              const expiry = new Date(invite.expires_at);
              const expired = expiry < new Date();

              return (
                <div
                  key={invite.id} // Fixed: Using unique ID as key
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  <div className={`h-1.5 w-full ${expired ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  
                  <div className="p-4">
                    {/* Header with email and status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${expired ? 'bg-rose-50' : 'bg-blue-50'}`}>
                          <FaUserTie className={`text-sm ${expired ? 'text-rose-500' : 'text-blue-500'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{invite.user.email}</p>
                          <p className="text-xs text-gray-500">{invite.designation}</p>
                        </div>
                      </div>
                      {getStatusBadge(invite.expires_at)}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getEmploymentBadge(invite.employment_type)}`}>
                        {invite.employment_type.replace("_", " ")}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSalaryBadge(invite.salary_type)}`}>
                        {invite.salary_type}
                      </span>
                    </div>

                    {/* Permissions */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {invite.permissions_invited.map(perm => (
                          <span key={perm.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {perm.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center gap-1.5 mb-4 text-xs">
                      <FaClock className={expired ? 'text-rose-400' : 'text-gray-400'} />
                      <span className={expired ? 'text-rose-600' : 'text-gray-600'}>
                        {expired ? `Expired on ${expiry.toLocaleDateString()}` : `Expires ${expiry.toLocaleDateString()}`}
                      </span>
                    </div>

                    {/* Action Buttons - Accept and Remove */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(invite.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition"
                      >
                        <FaCheckCircle className="text-xs" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRemove(invite.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white transition"
                      >
                        <FaTimesCircle className="text-xs" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop View (Table) - visible on large screens */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employment</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Permissions</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Expires</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invites.map((invite) => {
                  const expiry = new Date(invite.expires_at);
                  const expired = expiry < new Date();
                  const isExpanded = expandedRows.includes(invite.id);

                  return (
                    <Fragment key={invite.id}> {/* Fixed: Using Fragment with key */}
                      <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${expired ? 'bg-rose-50' : 'bg-blue-50'}`}>
                              <FaUserTie className={`text-sm ${expired ? 'text-rose-500' : 'text-blue-500'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{invite.user.email}</p>
                              <p className="text-xs text-gray-500">{invite.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${getEmploymentBadge(invite.employment_type)}`}>
                              {invite.employment_type.replace("_", " ")}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${getSalaryBadge(invite.salary_type)}`}>
                              {invite.salary_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {invite.permissions_invited.slice(0, 2).map(perm => (
                                <span key={perm.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full truncate">
                                  {perm.name}
                                </span>
                              ))}
                            </div>
                            {invite.permissions_invited.length > 2 && (
                              <button
                                onClick={() => toggleRow(invite.id)}
                                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                              >
                                +{invite.permissions_invited.length - 2} more
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(invite.expires_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <FaClock className={expired ? 'text-rose-400' : 'text-gray-400'} />
                            <span className={expired ? 'text-rose-600' : 'text-gray-600'}>
                              {expiry.toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAccept(invite.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            >
                              <FaCheckCircle className="text-xs" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRemove(invite.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            >
                              <FaTimesCircle className="text-xs" />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row for more permissions */}
                      {isExpanded && invite.permissions_invited.length > 2 && (
                        <tr key={`expanded-${invite.id}`} className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-500 mt-0.5">All permissions:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {invite.permissions_invited.map(perm => (
                                  <span key={perm.id} className="text-xs bg-white text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                                    {perm.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {invites.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <FaEnvelope className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No invitations yet</h3>
              <p className="text-sm text-gray-500">
                When you create invitations, they'll appear here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}