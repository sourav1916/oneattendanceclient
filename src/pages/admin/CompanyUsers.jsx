// pages/admin/users/CompanyUsersMinimal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaEye,
  FaChevronLeft, FaChevronRight, FaEllipsisV,
  FaUserCheck, FaUserClock, FaUsers, FaBuilding,
  FaEnvelope, FaPhone, FaUserTag, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaSave
} from "react-icons/fa";

export default function CompanyUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const itemsPerPage = 10;

  // Companies data
  const companies = [
    { id: 1, name: "TechCorp Solutions" },
    { id: 2, name: "Global Healthcare" },
    { id: 3, name: "EduWorld International" },
    { id: 4, name: "FinTrust Bank" },
    { id: 5, name: "RetailMax Group" },
    { id: 6, name: "ManufacturePro" }
  ];

  // Sample users data
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@techcorp.com",
      phone: "+1 (415) 555-0123",
      company: "TechCorp Solutions",
      companyId: 1,
      role: "Admin",
      status: "active",
      joinDate: "2023-01-15"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@globalhealth.com",
      phone: "+1 (617) 555-0456",
      company: "Global Healthcare",
      companyId: 2,
      role: "HR Manager",
      status: "active",
      joinDate: "2023-02-20"
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.b@eduworld.edu",
      phone: "+1 (312) 555-0789",
      company: "EduWorld International",
      companyId: 3,
      role: "Editor",
      status: "active",
      joinDate: "2023-03-10"
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.d@fintrust.com",
      phone: "+1 (212) 555-0234",
      company: "FinTrust Bank",
      companyId: 4,
      role: "Finance Manager",
      status: "active",
      joinDate: "2023-04-05"
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david.w@retailmax.com",
      phone: "+1 (206) 555-0567",
      company: "RetailMax Group",
      companyId: 5,
      role: "Viewer",
      status: "inactive",
      joinDate: "2023-05-12"
    }
  ]);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    companyId: "",
    role: "",
    status: "active"
  });

  // Edit user form state
  const [editUser, setEditUser] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    companyId: "",
    role: "",
    status: "",
    joinDate: ""
  });

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = selectedCompany === "all" || 
      user.companyId?.toString() === selectedCompany;
    
    const matchesStatus = selectedStatus === "all" || 
      user.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Handle add user
  const handleAddUser = () => {
    const company = companies.find(c => c.id.toString() === newUser.companyId);
    
    const user = {
      id: users.length + 1,
      ...newUser,
      company: company?.name || "",
      joinDate: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({ name: "", email: "", phone: "", companyId: "", role: "", status: "active" });
    setShowAddModal(false);
    showSuccess("User added successfully!");
  };

  // Handle edit click - populate form
  const handleEditClick = (user) => {
    setEditUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId.toString(),
      role: user.role,
      status: user.status,
      joinDate: user.joinDate
    });
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  // Handle update user
  const handleUpdateUser = () => {
    const company = companies.find(c => c.id.toString() === editUser.companyId);
    
    const updatedUsers = users.map(user => 
      user.id === editUser.id 
        ? {
            ...user,
            name: editUser.name,
            email: editUser.email,
            phone: editUser.phone,
            companyId: editUser.companyId,
            company: company?.name || user.company,
            role: editUser.role,
            status: editUser.status,
            joinDate: editUser.joinDate
          }
        : user
    );

    setUsers(updatedUsers);
    setShowEditModal(false);
    setEditUser({ id: "", name: "", email: "", phone: "", companyId: "", role: "", status: "", joinDate: "" });
    showSuccess("User updated successfully!");
  };

  // Handle view click
  const handleViewClick = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    setActionMenuOpen(null);
  };

  // Handle delete click
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setActionMenuOpen(null);
  };

  // Handle delete user
  const handleDeleteUser = () => {
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    showSuccess("User deleted successfully!");
  };

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Close action menu when clicking outside
  const handleClickOutside = () => {
    if (actionMenuOpen) {
      setActionMenuOpen(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative" onClick={handleClickOutside}>
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <FaCheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaUsers className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-xs text-slate-500">Total Users</h3>
          <p className="text-xl font-bold text-slate-800">{totalUsers}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FaUserCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-xs text-slate-500">Active Users</h3>
          <p className="text-xl font-bold text-slate-800">{activeUsers}</p>
          <p className="text-xs text-slate-400">{((activeUsers/totalUsers)*100).toFixed(1)}% of total</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Company Users</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white"
          >
            <FaFilter className="w-4 h-4 text-slate-500" />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">All Companies</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-slate-50 border-b text-xs font-medium text-slate-500">
          <div className="col-span-2">User</div>
          <div>Company</div>
          <div>Role</div>
          <div>Status</div>
          <div>Joined</div>
          <div className="text-center">Actions</div>
        </div>

        {/* User Rows */}
        <div className="divide-y">
          {paginatedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-slate-50"
            >
              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{user.name}</h3>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Company</p>
                    <p className="text-slate-700">{user.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Role</p>
                    <p className="text-slate-700">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-slate-700">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="text-slate-700">{new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Mobile Actions - Three Dot Menu */}
                <div className="relative flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <FaEllipsisV className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {actionMenuOpen === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-8 w-36 bg-white rounded-lg shadow-lg border z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-t-lg"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 border-t"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop View */}
              <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-600">{user.company}</div>
                <div className="text-sm text-slate-600">{user.role}</div>
                <div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{new Date(user.joinDate).toLocaleDateString()}</div>
                
                {/* Desktop Actions - Three Dot Menu */}
                <div className="flex items-center justify-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                    }}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <FaEllipsisV className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {actionMenuOpen === user.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-8 w-36 bg-white rounded-lg shadow-lg border z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-t-lg"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 border-t"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg border-t"
                        >
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p-1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${
                currentPage === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${
                currentPage === totalPages ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">User Details</h2>
                <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <FaTimes className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl font-medium">{selectedUser.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{selectedUser.name}</h3>
                    <p className="text-sm text-slate-500">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm text-slate-700">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="text-sm text-slate-700">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Company</p>
                    <p className="text-sm text-slate-700">{selectedUser.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Status</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400">Join Date</p>
                    <p className="text-sm text-slate-700">
                      {new Date(selectedUser.joinDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add New User</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <FaTimes className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={newUser.companyId}
                  onChange={(e) => setNewUser({...newUser, companyId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select Company *</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Role *"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email || !newUser.phone || !newUser.companyId || !newUser.role}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
                >
                  Add User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Edit User</h2>
                <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <FaTimes className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={editUser.companyId}
                  onChange={(e) => setEditUser({...editUser, companyId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select Company *</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Role *"
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={editUser.status}
                  onChange={(e) => setEditUser({...editUser, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Join Date</label>
                  <input
                    type="date"
                    value={editUser.joinDate}
                    onChange={(e) => setEditUser({...editUser, joinDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={!editUser.name || !editUser.email || !editUser.phone || !editUser.companyId || !editUser.role || !editUser.joinDate}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 flex items-center justify-center gap-2"
                >
                  <FaSave className="w-4 h-4" />
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete User</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete {selectedUser.name}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}