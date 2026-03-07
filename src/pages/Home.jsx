import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Select from "react-select";
import { FaFingerprint } from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect";


function HomePage() {

  const [openModal, setOpenModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [designation, setDesignation] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
  try {
    // Dummy users data
    const data = [
      {
        id: 1,
        full_name: "Rahul Sharma",
        email: "rahul.sharma@gmail.com"
      },
      {
        id: 2,
        full_name: "Priya Singh",
        email: "priya.singh@gmail.com"
      },
      {
        id: 3,
        full_name: "Amit Das",
        email: "amit.das@gmail.com"
      },
      {
        id: 4,
        full_name: "Sneha Roy",
        email: "sneha.roy@gmail.com"
      }
    ];

    setUsers(data);
  } catch (err) {
    console.error(err);
  }
};

const fetchPermissions = async () => {
  try {
    // Dummy permissions data
    const data = [
      { id: 1, name: "View Attendance" },
      { id: 2, name: "Mark Attendance" },
      { id: 3, name: "Edit Attendance" },
      { id: 4, name: "Manage Staff" },
      { id: 5, name: "View Reports" }
    ];

    setPermissions(data);
  } catch (err) {
    console.error(err);
  }
};

  const designationOptions = [
    { value: "manager", label: "Manager" },
    { value: "supervisor", label: "Supervisor" },
    { value: "staff", label: "Staff" }
  ];

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.full_name || u.name} (${u.email})`,
    user: u
  }));

  const permissionOptions = permissions.map((p) => ({
    value: p.id,
    label: p.name
  }));

  const handleCreate = () => {
    console.log({
      user: selectedUser,
      designation,
      permissions: selectedPermissions
    });

    setOpenModal(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to OneAttendance
          </h1>
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
              <h2 className="text-2xl font-bold text-gray-900 text-left">Add Staff</h2>
              <p className="text-gray-600 mt-1">
                • Regular Staff and Contract Staff (Monthly, Weekly, Hourly and Work Basis)
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl text-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02]"
          >
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


      {/* MODAL */}
      <AnimatePresence>
        {openModal && (

          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8"
            >

              <h2 className="text-2xl font-bold mb-6">Add Staff</h2>

              {/* Search User */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">
                  Select User
                </label>

                <SearchableSelect
                  users={users}
                  onSelect={(user) => setSelectedUser(user)}
                />

              </div>

              {/* Designation */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2">
                  Designation
                </label>

                <Select
                  options={designationOptions}
                  value={designation}
                  onChange={setDesignation}
                />
              </div>

              {/* Permissions */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Permissions
                </label>

                <Select
                  isMulti
                  options={permissionOptions}
                  onChange={setSelectedPermissions}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">

                <button
                  onClick={() => setOpenModal(false)}
                  className="px-5 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreate}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Create
                </button>

              </div>

            </motion.div>

          </motion.div>

        )}
      </AnimatePresence>

    </div>
  );
}

export default HomePage;
