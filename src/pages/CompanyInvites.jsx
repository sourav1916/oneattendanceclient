import { useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaUserTie,
  FaClock,
  FaExclamationCircle
} from "react-icons/fa";

const dummyInvites = [
  {
    id: 1,
    user: { email: "comp1@gmail.com" },
    employment_type: "full_time",
    salary_type: "monthly",
    designation: "Manager",
    permissions_invited: [{ id: 6, name: "Approve Leave" }],
    expires_at: "2026-03-11T16:16:13.371Z"
  },
  {
    id: 2,
    user: { email: "staff@gmail.com" },
    employment_type: "part_time",
    salary_type: "hourly",
    designation: "Assistant",
    permissions_invited: [
      { id: 2, name: "View Attendance" },
      { id: 4, name: "Edit Profile" }
    ],
    expires_at: "2026-03-09T10:00:00.000Z"
  },
  {
    id: 3,
    user: { email: "developer@gmail.com" },
    employment_type: "full_time",
    salary_type: "monthly",
    designation: "Senior Developer",
    permissions_invited: [
      { id: 1, name: "Manage Projects" },
      { id: 3, name: "Approve Timesheets" },
      { id: 5, name: "Analytics Access" }
    ],
    expires_at: "2026-04-15T10:00:00.000Z"
  }
];

export default function CompanyInvites() {

  const [invites] = useState(dummyInvites);

  const handleAccept = (id) => {
    alert(`Accept invite ${id}`);
  };

  const handleRemove = (id) => {
    if (window.confirm("Remove invitation?")) {
      alert(`Removed ${id}`);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (

    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-semibold text-gray-800">
            Company Invitations
          </h1>

          <p className="text-gray-500 mt-1 text-sm">
            Manage pending staff invitations
          </p>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {invites.map((invite) => {

            const expired = isExpired(invite.expires_at);

            return (

              <div
                key={invite.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
              >

                {/* Top */}

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <FaUserTie size={16} />
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-gray-800">
                        {invite.user.email}
                      </p>

                      <p className="text-xs text-gray-500">
                        {invite.designation}
                      </p>

                    </div>

                  </div>

                  {/* Status */}

                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${expired
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-600"
                      }`}
                  >

                    {expired ? "Expired" : "Active"}

                  </span>

                </div>

                {/* Employment */}

                <div className="mt-4 flex flex-wrap gap-2">

                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                    {invite.employment_type.replace("_", " ")}
                  </span>

                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
                    {invite.salary_type}
                  </span>

                </div>

                {/* Permissions */}

                <div className="mt-4">

                  <p className="text-xs text-gray-500 mb-2">
                    Permissions
                  </p>

                  <div className="flex flex-wrap gap-2">

                    {invite.permissions_invited.map((perm) => (

                      <span
                        key={perm.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                      >

                        {perm.name}

                      </span>

                    ))}

                  </div>

                </div>

                {/* Expiry */}

                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">

                  <FaClock />

                  <span>

                    {expired
                      ? `Expired ${new Date(invite.expires_at).toLocaleDateString()}`
                      : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`}

                  </span>

                </div>

                {/* Actions */}

                <div className="flex gap-2 mt-5">

                  <button
                    onClick={() => handleAccept(invite.id)}
                    className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg"
                  >

                    Accept

                  </button>

                  <button
                    onClick={() => handleRemove(invite.id)}
                    className="flex-1 text-sm border border-gray-300 hover:bg-gray-100 py-2 rounded-lg"
                  >

                    Remove

                  </button>

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </div>

  );

}
