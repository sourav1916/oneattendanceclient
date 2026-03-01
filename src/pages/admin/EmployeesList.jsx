// pages/admin/employees/EmployeesList.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaEye,
  FaChevronLeft, FaChevronRight, FaUserTie, FaEnvelope,
  FaPhone, FaBuilding, FaBriefcase, FaEllipsisV,
  FaDownload, FaUpload, FaUserPlus, FaTimes, FaCamera,
  FaCalendarAlt, FaVenusMars, FaMapMarkerAlt, FaIdCard,
  FaCheckCircle, FaTimesCircle, FaClock, FaUserCircle,
  FaBirthdayCake, FaHeart, FaPhoneAlt, FaEnvelopeOpen,
  FaIdBadge, FaCalendarCheck, FaUserTag, FaInfoCircle,
  FaUsers, FaUserCheck, FaUserClock, FaUserSlash,
  FaUserGraduate, FaChartLine, FaAward
} from "react-icons/fa";

export default function EmployeesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const itemsPerPage = 10;
  const isAnyModalOpen = showAddModal || showEditModal || showViewModal || showDeleteModal;

  // Use the hook
  useBodyScrollLock(isAnyModalOpen);

  // Form state for new employee
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    department: "",
    designation: "",
    joinDate: "",
    status: "active",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
    avatar: null,
    dateOfBirth: "",
    nationality: "",
    maritalStatus: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: ""
  });

  // Sample employees data with more details
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "John Smith",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      phone: "+1 234-567-8901",
      department: "Engineering",
      designation: "Senior Developer",
      joinDate: "2023-01-15",
      status: "active",
      avatar: null,
      employeeId: "EMP001",
      gender: "Male",
      dateOfBirth: "1990-05-15",
      nationality: "American",
      maritalStatus: "Married",
      address: "123 Tech Street, San Francisco, CA 94105",
      emergencyName: "Jane Smith",
      emergencyRelationship: "Wife",
      emergencyPhone: "+1 234-567-8999",
      bloodGroup: "O+",
      emergencyContact: "Jane Smith (Wife): +1 234-567-8999"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@company.com",
      phone: "+1 234-567-8902",
      department: "Marketing",
      designation: "Marketing Manager",
      joinDate: "2023-02-20",
      status: "active",
      avatar: null,
      employeeId: "EMP002",
      gender: "Female",
      dateOfBirth: "1988-08-22",
      nationality: "American",
      maritalStatus: "Single",
      address: "456 Market Street, San Francisco, CA 94105",
      emergencyName: "Robert Johnson",
      emergencyRelationship: "Brother",
      emergencyPhone: "+1 234-567-8888",
      bloodGroup: "A+",
      emergencyContact: "Robert Johnson (Brother): +1 234-567-8888"
    },
    {
      id: 3,
      name: "Michael Brown",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.b@company.com",
      phone: "+1 234-567-8903",
      department: "Sales",
      designation: "Sales Representative",
      joinDate: "2023-03-10",
      status: "inactive",
      avatar: null,
      employeeId: "EMP003",
      gender: "Male",
      dateOfBirth: "1992-11-30",
      nationality: "American",
      maritalStatus: "Single",
      address: "789 Sales Ave, San Francisco, CA 94105",
      emergencyName: "Mary Brown",
      emergencyRelationship: "Mother",
      emergencyPhone: "+1 234-567-8777",
      bloodGroup: "B+",
      emergencyContact: "Mary Brown (Mother): +1 234-567-8777"
    },
    {
      id: 4,
      name: "Emily Davis",
      firstName: "Emily",
      lastName: "Davis",
      email: "emily.d@company.com",
      phone: "+1 234-567-8904",
      department: "HR",
      designation: "HR Manager",
      joinDate: "2023-04-05",
      status: "active",
      avatar: null,
      employeeId: "EMP004",
      gender: "Female",
      dateOfBirth: "1985-03-18",
      nationality: "American",
      maritalStatus: "Married",
      address: "321 HR Blvd, San Francisco, CA 94105",
      emergencyName: "Tom Davis",
      emergencyRelationship: "Husband",
      emergencyPhone: "+1 234-567-8666",
      bloodGroup: "AB+",
      emergencyContact: "Tom Davis (Husband): +1 234-567-8666"
    },
    {
      id: 5,
      name: "David Wilson",
      firstName: "David",
      lastName: "Wilson",
      email: "david.w@company.com",
      phone: "+1 234-567-8905",
      department: "Finance",
      designation: "Financial Analyst",
      joinDate: "2023-05-12",
      status: "active",
      avatar: null,
      employeeId: "EMP005",
      gender: "Male",
      dateOfBirth: "1991-07-25",
      nationality: "American",
      maritalStatus: "Single",
      address: "654 Finance St, San Francisco, CA 94105",
      emergencyName: "Lisa Wilson",
      emergencyRelationship: "Sister",
      emergencyPhone: "+1 234-567-8555",
      bloodGroup: "A-",
      emergencyContact: "Lisa Wilson (Sister): +1 234-567-8555"
    },
  ]);

  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "IT Support"];
  const designations = {
    Engineering: ["Senior Developer", "Junior Developer", "Tech Lead", "Software Architect", "QA Engineer"],
    Marketing: ["Marketing Manager", "SEO Specialist", "Content Writer", "Social Media Manager"],
    Sales: ["Sales Representative", "Sales Manager", "Account Executive"],
    HR: ["HR Manager", "Recruiter", "HR Assistant"],
    Finance: ["Financial Analyst", "Accountant", "Finance Manager"],
    Operations: ["Operations Manager", "Logistics Coordinator"],
    "IT Support": ["IT Support Specialist", "System Administrator"]
  };
  const statuses = ["Active", "Inactive"];
  const genders = ["Male", "Female", "Other"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];

  // Calculate summary statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const inactiveEmployees = employees.filter(emp => emp.status === 'inactive').length;
  const newThisMonth = employees.filter(emp => {
    const joinDate = new Date(emp.joinDate);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length;

  // Department distribution
  const departmentCount = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  const topDepartment = Object.entries(departmentCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Calculate average tenure (in months)
  const averageTenure = employees.reduce((acc, emp) => {
    const joinDate = new Date(emp.joinDate);
    const now = new Date();
    const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    return acc + months;
  }, 0) / (employees.length || 1);

  const formatTenure = (months) => {
    if (months < 12) {
      return `${Math.round(months)} months`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal && selectedEmployee) {
      setSelectedEmployee(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewEmployee(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submit for add
  const handleAddEmployee = () => {
    // Generate employee ID if not provided
    const empId = newEmployee.employeeId || `EMP${String(employees.length + 1).padStart(3, '0')}`;

    // Create new employee object
    const employee = {
      id: employees.length + 1,
      name: `${newEmployee.firstName} ${newEmployee.lastName}`,
      firstName: newEmployee.firstName,
      lastName: newEmployee.lastName,
      email: newEmployee.email,
      phone: newEmployee.phone,
      department: newEmployee.department,
      designation: newEmployee.designation,
      joinDate: newEmployee.joinDate,
      status: newEmployee.status.toLowerCase(),
      avatar: newEmployee.avatar,
      employeeId: empId,
      gender: newEmployee.gender,
      dateOfBirth: newEmployee.dateOfBirth,
      nationality: newEmployee.nationality,
      maritalStatus: newEmployee.maritalStatus,
      address: newEmployee.address,
      emergencyName: newEmployee.emergencyName,
      emergencyRelationship: newEmployee.emergencyRelationship,
      emergencyPhone: newEmployee.emergencyPhone,
      bloodGroup: newEmployee.bloodGroup,
      emergencyContact: `${newEmployee.emergencyName} (${newEmployee.emergencyRelationship}): ${newEmployee.emergencyPhone}`
    };

    // Add to employees list
    setEmployees([...employees, employee]);

    // Reset form
    setNewEmployee({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      employeeId: "",
      department: "",
      designation: "",
      joinDate: "",
      status: "active",
      gender: "",
      address: "",
      emergencyContact: "",
      bloodGroup: "",
      avatar: null,
      dateOfBirth: "",
      nationality: "",
      maritalStatus: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: ""
    });

    // Close modal and show success message
    setShowAddModal(false);
    setSuccessMessage("Employee added successfully!");
    setShowSuccessMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Handle form submit for edit
  const handleEditEmployee = () => {
    if (selectedEmployee) {
      // Update the employee in the list
      const updatedEmployees = employees.map(emp =>
        emp.id === selectedEmployee.id
          ? {
            ...selectedEmployee,
            name: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
            emergencyContact: `${selectedEmployee.emergencyName} (${selectedEmployee.emergencyRelationship}): ${selectedEmployee.emergencyPhone}`
          }
          : emp
      );

      setEmployees(updatedEmployees);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setSuccessMessage("Employee updated successfully!");
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = () => {
    if (selectedEmployee) {
      setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id));
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      setSuccessMessage("Employee deleted successfully!");
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  // Open view modal
  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  // Open edit modal
  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === "all" ||
      emp.department.toLowerCase() === selectedDepartment.toLowerCase();
    const matchesStatus = selectedStatus === "all" ||
      emp.status === selectedStatus.toLowerCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Summary card data
  const summaryCards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: FaUsers,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+12%",
      changeType: "increase"
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: FaUserCheck,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      subtext: `${((activeEmployees / totalEmployees) * 100).toFixed(1)}% of total`,
      change: "+5%",
      changeType: "increase"
    },
    {
      title: "Inactive Employees",
      value: inactiveEmployees,
      icon: FaUserSlash,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      subtext: `${((inactiveEmployees / totalEmployees) * 100).toFixed(1)}% of total`,
      change: "-2%",
      changeType: "decrease"
    },
    {
      title: "New This Month",
      value: newThisMonth,
      icon: FaUserClock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      change: "+3",
      changeType: "increase"
    },
    {
      title: "Departments",
      value: Object.keys(departmentCount).length,
      icon: FaBuilding,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      subtext: `${topDepartment} leads`
    },
    {
      title: "Avg. Tenure",
      value: formatTenure(averageTenure),
      icon: FaClock,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 sm:space-y-6 relative"
    >
      {/* Success Message Toast */}
      <AnimatePresence mode="wait">
        {showSuccessMessage && (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <FaCheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
              {card.change && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${card.changeType === 'increase'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                  {card.change}
                </span>
              )}
            </div>

            <h3 className="text-xs font-medium text-slate-500 mb-0.5">{card.title}</h3>
            <p className="text-lg sm:text-xl font-bold text-slate-800">{card.value}</p>

            {card.subtext && (
              <p className="text-xs text-slate-400 mt-1">{card.subtext}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <motion.h1
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-xl sm:text-2xl font-bold text-slate-800"
        >
          Employees Directory
        </motion.h1>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
          >
            <FaFilter className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline"></span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
          >
            <FaDownload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline"></span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            <FaUserPlus className="w-4 h-4" />
            <span className="hidden sm:inline"></span>
            <span className="sm:hidden"></span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
          />
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept.toLowerCase()}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Employees Grid/Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase">
          <div className="col-span-2">Employee</div>
          <div>Department</div>
          <div>Designation</div>
          <div>Employee ID</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Employee Rows */}
        <div className="divide-y divide-slate-200">
          <AnimatePresence mode="popLayout">
            {paginatedEmployees.map((employee, index) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium">
                          {employee.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">{employee.name}</h3>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {employee.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Department</p>
                      <p className="text-slate-700">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Designation</p>
                      <p className="text-slate-700">{employee.designation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Employee ID</p>
                      <p className="text-slate-700">{employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="text-slate-700">{employee.phone}</p>
                    </div>
                  </div>

                  {/* Mobile Actions - Three-dot menu */}
                  <div className="flex items-center justify-end">
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActionMenuOpen(actionMenuOpen === employee.id ? null : employee.id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <FaEllipsisV className="w-3 h-3" />
                      </motion.button>

                      {/* Dropdown menu for mobile */}
                      <AnimatePresence>
                        {actionMenuOpen === employee.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10"
                          >
                            <button
                              onClick={() => {
                                handleViewEmployee(employee);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <FaEye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleEditClick(employee);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2 transition-colors border-t border-slate-100"
                            >
                              <FaEdit className="w-4 h-4" />
                              Edit Employee
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDeleteModal(true);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors border-t border-slate-100"
                            >
                              <FaTrash className="w-4 h-4" />
                              Delete Employee
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {employee.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{employee.name}</p>
                      <p className="text-xs text-slate-500">{employee.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">{employee.department}</div>
                  <div className="text-sm text-slate-600">{employee.designation}</div>
                  <div className="text-sm text-slate-600">{employee.employeeId}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${employee.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {employee.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    {/* Three-dot menu for desktop */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActionMenuOpen(actionMenuOpen === employee.id ? null : employee.id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <FaEllipsisV className="w-3 h-3" />
                      </motion.button>

                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {actionMenuOpen === employee.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10"
                          >
                            <button
                              onClick={() => {
                                handleViewEmployee(employee);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <FaEye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleEditClick(employee);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2 transition-colors border-t border-slate-100"
                            >
                              <FaEdit className="w-4 h-4" />
                              Edit Employee
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDeleteModal(true);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors border-t border-slate-100"
                            >
                              <FaTrash className="w-4 h-4" />
                              Delete Employee
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
          </p>

          <div className="flex items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${currentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              <FaChevronLeft className="w-4 h-4" />
            </motion.button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              <FaChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* View Employee Modal */}
      <AnimatePresence mode="wait">
        {showViewModal && selectedEmployee && (
          <motion.div
            key="view-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <FaUserCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Employee Profile</h2>
                    <p className="text-sm text-white/80">Detailed information about the employee</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-4xl font-bold">
                        {selectedEmployee.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">{selectedEmployee.name}</h1>
                    <p className="text-slate-500 mb-3">{selectedEmployee.designation}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedEmployee.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {selectedEmployee.status}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-700">
                        {selectedEmployee.employeeId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FaUserTie className="w-4 h-4 text-purple-500" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaEnvelope className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Email</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaPhone className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Phone</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaVenusMars className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Gender</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.gender || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaBirthdayCake className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Date of Birth</p>
                          <p className="text-sm text-slate-700">
                            {selectedEmployee.dateOfBirth
                              ? new Date(selectedEmployee.dateOfBirth).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                              : 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaHeart className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Blood Group</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.bloodGroup || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Marital Status</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.maritalStatus || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FaBriefcase className="w-4 h-4 text-purple-500" />
                      Employment Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FaBuilding className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Department</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.department}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaUserTag className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Designation</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.designation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaIdBadge className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Employee ID</p>
                          <p className="text-sm text-slate-700">{selectedEmployee.employeeId}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCalendarCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-400">Join Date</p>
                          <p className="text-sm text-slate-700">
                            {new Date(selectedEmployee.joinDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-purple-500" />
                      Address
                    </h3>
                    <p className="text-sm text-slate-700">
                      {selectedEmployee.address || 'No address provided'}
                    </p>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FaPhoneAlt className="w-4 h-4 text-purple-500" />
                      Emergency Contact
                    </h3>
                    {selectedEmployee.emergencyName ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">{selectedEmployee.emergencyName}</p>
                        <p className="text-xs text-slate-500">{selectedEmployee.emergencyRelationship}</p>
                        <p className="text-sm text-slate-600">{selectedEmployee.emergencyPhone}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No emergency contact provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Employee Modal */}
      <AnimatePresence mode="wait">
        {showEditModal && selectedEmployee && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FaEdit className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Edit Employee</h2>
                    <p className="text-sm text-slate-500">Update employee information</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-slate-500" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-3xl font-medium">
                        {selectedEmployee.firstName?.charAt(0) || selectedEmployee.name?.charAt(0)}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50"
                    >
                      <FaCamera className="w-4 h-4 text-slate-600" />
                    </motion.button>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-slate-500 mb-1">Profile Picture</p>
                    <p className="text-xs text-slate-400">Click the camera icon to update</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaUserTie className="w-4 h-4 text-amber-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={selectedEmployee.firstName || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={selectedEmployee.lastName || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={selectedEmployee.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={selectedEmployee.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={selectedEmployee.gender || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Gender</option>
                        {genders.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={selectedEmployee.dateOfBirth || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={selectedEmployee.bloodGroup || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroups.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Marital Status
                      </label>
                      <select
                        name="maritalStatus"
                        value={selectedEmployee.maritalStatus || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Status</option>
                        {maritalStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaBriefcase className="w-4 h-4 text-amber-500" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={selectedEmployee.employeeId || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={selectedEmployee.department || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="designation"
                        value={selectedEmployee.designation || ''}
                        onChange={handleInputChange}
                        disabled={!selectedEmployee.department}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
                      >
                        <option value="">Select Designation</option>
                        {selectedEmployee.department && designations[selectedEmployee.department]?.map(des => (
                          <option key={des} value={des}>{des}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Join Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="joinDate"
                        value={selectedEmployee.joinDate || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={selectedEmployee.status || 'active'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status.toLowerCase()}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-amber-500" />
                    Address
                  </h3>
                  <textarea
                    name="address"
                    value={selectedEmployee.address || ''}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter full address"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaPhoneAlt className="w-4 h-4 text-amber-500" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyName"
                        value={selectedEmployee.emergencyName || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        name="emergencyRelationship"
                        value={selectedEmployee.emergencyRelationship || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={selectedEmployee.emergencyPhone || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Emergency phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditEmployee}
                  disabled={!selectedEmployee.firstName || !selectedEmployee.lastName || !selectedEmployee.email || !selectedEmployee.phone || !selectedEmployee.department || !selectedEmployee.designation || !selectedEmployee.joinDate}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                >
                  Update Employee
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Employee Modal */}
      <AnimatePresence mode="wait">
        {showAddModal && (
          <motion.div
            key="add-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important] overflow-y-scroll"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaUserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Add New Employee</h2>
                    <p className="text-sm text-slate-500">Fill in the employee details below</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-slate-500" />
                </motion.button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-3xl font-medium">
                        {newEmployee.firstName?.charAt(0) || newEmployee.lastName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50"
                    >
                      <FaCamera className="w-4 h-4 text-slate-600" />
                    </motion.button>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-slate-500 mb-1">Profile Picture</p>
                    <p className="text-xs text-slate-400">Upload a profile picture (optional)</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaUserTie className="w-4 h-4 text-purple-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={newEmployee.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={newEmployee.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newEmployee.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="john.smith@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newEmployee.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="+1 234-567-8901"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={newEmployee.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Gender</option>
                        {genders.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={newEmployee.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={newEmployee.bloodGroup}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroups.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Marital Status
                      </label>
                      <select
                        name="maritalStatus"
                        value={newEmployee.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Status</option>
                        {maritalStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaBriefcase className="w-4 h-4 text-purple-500" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={newEmployee.employeeId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="EMP006"
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave empty for auto-generated ID</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={newEmployee.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="designation"
                        value={newEmployee.designation}
                        onChange={handleInputChange}
                        disabled={!newEmployee.department}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">Select Designation</option>
                        {newEmployee.department && designations[newEmployee.department]?.map(des => (
                          <option key={des} value={des}>{des}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Join Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="joinDate"
                        value={newEmployee.joinDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={newEmployee.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status.toLowerCase()}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-purple-500" />
                    Address
                  </h3>
                  <textarea
                    name="address"
                    value={newEmployee.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter full address"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaPhoneAlt className="w-4 h-4 text-purple-500" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyName"
                        value={newEmployee.emergencyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        name="emergencyRelationship"
                        value={newEmployee.emergencyRelationship}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={newEmployee.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Emergency phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddEmployee}
                  disabled={!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.phone || !newEmployee.department || !newEmployee.designation || !newEmployee.joinDate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  Add Employee
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence mode="wait">
        {showDeleteModal && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 mt-[0px!important]"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
                Delete Employee
              </h3>

              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete {selectedEmployee?.name}? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteEmployee}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}