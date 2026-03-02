// pages/admin/roles/CompanyRoles.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  FaShieldAlt, FaUserTag, FaPlus, FaEdit, FaTrash, FaEye,
  FaChevronLeft, FaChevronRight, FaSearch, FaFilter,
  FaTimes, FaCheck,FaCopy,  FaCog,
  FaUsers,  FaUserCheck, 
  FaBuilding,  FaKey,
  FaMoneyBill, FaFileAlt, FaDownload,
  FaUserCog, 
  FaInfoCircle, FaCheckCircle,
  FaArrowRight,FaEllipsisV,
  FaSort, FaSortUp, FaSortDown
} from "react-icons/fa";

export default function CompanyRoles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoleItem, setSelectedRoleItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAssignUsersModal, setShowAssignUsersModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const itemsPerPage = 10;
  const isAnyModalOpen = showAddModal || showEditModal || showViewModal || showDeleteModal || showPermissionsModal || showAssignUsersModal;

  useBodyScrollLock(isAnyModalOpen);

  // Companies data
  const companies = [
    { id: 1, name: "TechCorp Solutions", industry: "Technology", users: 245, roles: 8 },
    { id: 2, name: "Global Healthcare Inc", industry: "Healthcare", users: 189, roles: 6 },
    { id: 3, name: "EduWorld International", industry: "Education", users: 312, roles: 9 },
    { id: 4, name: "FinTrust Bank", industry: "Finance", users: 567, roles: 12 },
    { id: 5, name: "RetailMax Group", industry: "Retail", users: 423, roles: 7 },
    { id: 6, name: "ManufacturePro", industry: "Manufacturing", users: 156, roles: 5 }
  ];

  // Permission categories and permissions
  const permissionCategories = [
    {
      id: 'users',
      name: 'User Management',
      icon: FaUsers,
      permissions: [
        { id: 'view_users', name: 'View Users', description: 'Can view user list and details' },
        { id: 'create_users', name: 'Create Users', description: 'Can create new users' },
        { id: 'edit_users', name: 'Edit Users', description: 'Can edit user information' },
        { id: 'delete_users', name: 'Delete Users', description: 'Can delete users' },
        { id: 'manage_user_roles', name: 'Manage User Roles', description: 'Can assign/remove user roles' }
      ]
    },
    {
      id: 'roles',
      name: 'Role Management',
      icon: FaUserTag,
      permissions: [
        { id: 'view_roles', name: 'View Roles', description: 'Can view roles list' },
        { id: 'create_roles', name: 'Create Roles', description: 'Can create new roles' },
        { id: 'edit_roles', name: 'Edit Roles', description: 'Can edit role details' },
        { id: 'delete_roles', name: 'Delete Roles', description: 'Can delete roles' },
        { id: 'manage_permissions', name: 'Manage Permissions', description: 'Can modify role permissions' }
      ]
    },
    {
      id: 'content',
      name: 'Content Management',
      icon: FaFileAlt,
      permissions: [
        { id: 'view_content', name: 'View Content', description: 'Can view all content' },
        { id: 'create_content', name: 'Create Content', description: 'Can create new content' },
        { id: 'edit_content', name: 'Edit Content', description: 'Can edit existing content' },
        { id: 'delete_content', name: 'Delete Content', description: 'Can delete content' },
        { id: 'publish_content', name: 'Publish Content', description: 'Can publish/unpublish content' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: FaMoneyBill,
      permissions: [
        { id: 'view_finance', name: 'View Finance', description: 'Can view financial data' },
        { id: 'manage_invoices', name: 'Manage Invoices', description: 'Can create/edit invoices' },
        { id: 'process_payments', name: 'Process Payments', description: 'Can process payments' },
        { id: 'view_reports', name: 'View Reports', description: 'Can view financial reports' },
        { id: 'manage_budget', name: 'Manage Budget', description: 'Can manage budget allocations' }
      ]
    },
    {
      id: 'settings',
      name: 'System Settings',
      icon: FaCog,
      permissions: [
        { id: 'view_settings', name: 'View Settings', description: 'Can view system settings' },
        { id: 'edit_settings', name: 'Edit Settings', description: 'Can modify system settings' },
        { id: 'manage_integrations', name: 'Manage Integrations', description: 'Can manage API integrations' },
        { id: 'view_logs', name: 'View Logs', description: 'Can view system logs' },
        { id: 'manage_backup', name: 'Manage Backup', description: 'Can manage system backups' }
      ]
    },
    {
      id: 'security',
      name: 'Security',
      icon: FaShieldAlt,
      permissions: [
        { id: 'view_security', name: 'View Security', description: 'Can view security settings' },
        { id: 'manage_2fa', name: 'Manage 2FA', description: 'Can manage 2FA settings' },
        { id: 'manage_api_keys', name: 'Manage API Keys', description: 'Can create/revoke API keys' },
        { id: 'view_audit_logs', name: 'View Audit Logs', description: 'Can view audit trails' },
        { id: 'manage_ip_whitelist', name: 'Manage IP Whitelist', description: 'Can manage IP restrictions' }
      ]
    }
  ];

  // Flatten all permissions for easier access
  const allPermissions = permissionCategories.flatMap(cat => cat.permissions);

  // Sample roles data with company assignment
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Super Admin",
      description: "Full system access with all permissions",
      company: "TechCorp Solutions",
      companyId: 1,
      usersCount: 3,
      permissions: allPermissions.map(p => p.id), // All permissions
      type: "system",
      createdAt: "2023-01-01",
      updatedAt: "2024-01-15",
      status: "active"
    },
    {
      id: 2,
      name: "Admin",
      description: "Administrative access with most permissions",
      company: "TechCorp Solutions",
      companyId: 1,
      usersCount: 5,
      permissions: [
        'view_users', 'create_users', 'edit_users', 'delete_users',
        'view_roles', 'view_content', 'create_content', 'edit_content',
        'view_finance', 'view_reports', 'view_settings'
      ],
      type: "system",
      createdAt: "2023-01-01",
      updatedAt: "2024-01-15",
      status: "active"
    },
    {
      id: 3,
      name: "HR Manager",
      description: "Manage HR-related functions and employee data",
      company: "Global Healthcare Inc",
      companyId: 2,
      usersCount: 2,
      permissions: [
        'view_users', 'create_users', 'edit_users',
        'view_content', 'create_content',
        'view_reports'
      ],
      type: "custom",
      createdAt: "2023-03-10",
      updatedAt: "2024-02-01",
      status: "active"
    },
    {
      id: 4,
      name: "Finance Manager",
      description: "Manage financial operations and reports",
      company: "FinTrust Bank",
      companyId: 4,
      usersCount: 4,
      permissions: [
        'view_users',
        'view_content',
        'view_finance', 'manage_invoices', 'process_payments', 'view_reports', 'manage_budget',
        'view_settings'
      ],
      type: "custom",
      createdAt: "2023-02-15",
      updatedAt: "2024-01-20",
      status: "active"
    },
    {
      id: 5,
      name: "Content Editor",
      description: "Create and edit content across the platform",
      company: "EduWorld International",
      companyId: 3,
      usersCount: 8,
      permissions: [
        'view_content', 'create_content', 'edit_content',
        'view_users'
      ],
      type: "custom",
      createdAt: "2023-04-22",
      updatedAt: "2024-01-30",
      status: "active"
    },
    {
      id: 6,
      name: "Viewer",
      description: "Read-only access to most modules",
      company: "RetailMax Group",
      companyId: 5,
      usersCount: 15,
      permissions: [
        'view_users', 'view_roles', 'view_content', 'view_finance', 'view_reports', 'view_settings'
      ],
      type: "system",
      createdAt: "2023-01-01",
      updatedAt: "2024-01-15",
      status: "active"
    },
    {
      id: 7,
      name: "Sales Representative",
      description: "Access to sales and customer data",
      company: "ManufacturePro",
      companyId: 6,
      usersCount: 12,
      permissions: [
        'view_users', 'view_content', 'create_content', 'edit_content',
        'view_reports'
      ],
      type: "custom",
      createdAt: "2023-05-18",
      updatedAt: "2024-02-10",
      status: "inactive"
    },
    {
      id: 8,
      name: "IT Support",
      description: "Technical support and system maintenance",
      company: "TechCorp Solutions",
      companyId: 1,
      usersCount: 6,
      permissions: [
        'view_users', 'view_roles',
        'view_settings', 'edit_settings', 'view_logs', 'manage_backup',
        'view_security', 'view_audit_logs'
      ],
      type: "custom",
      createdAt: "2023-06-05",
      updatedAt: "2024-02-15",
      status: "active"
    }
  ]);

  // Sample users for assignment
  const availableUsers = [
    { id: 1, name: "John Smith", email: "john@techcorp.com", company: "TechCorp Solutions", role: "Super Admin" },
    { id: 2, name: "Sarah Johnson", email: "sarah@techcorp.com", company: "TechCorp Solutions", role: "Admin" },
    { id: 3, name: "Michael Brown", email: "michael@globalhealth.com", company: "Global Healthcare Inc", role: "HR Manager" },
    { id: 4, name: "Emily Davis", email: "emily@fintrust.com", company: "FinTrust Bank", role: "Finance Manager" },
    { id: 5, name: "David Wilson", email: "david@eduworld.edu", company: "EduWorld International", role: "Content Editor" },
    { id: 6, name: "Jennifer Lee", email: "jennifer@retailmax.com", company: "RetailMax Group", role: "Viewer" },
    { id: 7, name: "Robert Martinez", email: "robert@manufacturepro.com", company: "ManufacturePro", role: "Sales Representative" },
    { id: 8, name: "Lisa Anderson", email: "lisa@techcorp.com", company: "TechCorp Solutions", role: "IT Support" }
  ];

  // Form state for new role
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    company: "",
    companyId: "",
    type: "custom",
    permissions: [],
    status: "active"
  });

  // Temporary permissions selection for add/edit
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Users assigned to current role (for assignment modal)
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [availableForAssignment, setAvailableForAssignment] = useState([]);

  // Statistics
  const totalRoles = roles.length;
  const activeRoles = roles.filter(r => r.status === 'active').length;
  const systemRoles = roles.filter(r => r.type === 'system').length;
  const customRoles = roles.filter(r => r.type === 'custom').length;
  const totalPermissions = allPermissions.length;

  const rolesByCompany = roles.reduce((acc, role) => {
    acc[role.company] = (acc[role.company] || 0) + 1;
    return acc;
  }, {});

  const topCompany = Object.entries(rolesByCompany).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="w-3 h-3 text-slate-400" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="w-3 h-3 text-purple-600" />
      : <FaSortDown className="w-3 h-3 text-purple-600" />;
  };

  // Sort roles
  const sortedRoles = [...roles].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Filter roles
  const filteredRoles = sortedRoles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = selectedCompany === "all" || 
      role.companyId?.toString() === selectedCompany;
    
    const matchesRoleType = selectedRole === "all" || 
      role.type === selectedRole;

    return matchesSearch && matchesCompany && matchesRoleType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'company') {
      const selectedCompanyObj = companies.find(c => c.id.toString() === value);
      if (showEditModal && selectedRoleItem) {
        setSelectedRoleItem(prev => ({
          ...prev,
          company: selectedCompanyObj?.name || '',
          companyId: value
        }));
      } else {
        setNewRole(prev => ({
          ...prev,
          company: selectedCompanyObj?.name || '',
          companyId: value
        }));
      }
    } else {
      if (showEditModal && selectedRoleItem) {
        setSelectedRoleItem(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        setNewRole(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  // Handle permission toggle
  const togglePermission = (permissionId) => {
    if (showEditModal) {
      setSelectedRoleItem(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permissionId)
          ? prev.permissions.filter(p => p !== permissionId)
          : [...prev.permissions, permissionId]
      }));
    } else {
      setSelectedPermissions(prev => 
        prev.includes(permissionId)
          ? prev.filter(p => p !== permissionId)
          : [...prev, permissionId]
      );
    }
  };

  // Select all permissions in a category
  const toggleCategoryPermissions = (category) => {
    const categoryPermissionIds = category.permissions.map(p => p.id);
    
    if (showEditModal) {
      const allSelected = categoryPermissionIds.every(id => 
        selectedRoleItem.permissions.includes(id)
      );
      
      setSelectedRoleItem(prev => ({
        ...prev,
        permissions: allSelected
          ? prev.permissions.filter(id => !categoryPermissionIds.includes(id))
          : [...new Set([...prev.permissions, ...categoryPermissionIds])]
      }));
    } else {
      const allSelected = categoryPermissionIds.every(id => 
        selectedPermissions.includes(id)
      );
      
      setSelectedPermissions(prev => 
        allSelected
          ? prev.filter(id => !categoryPermissionIds.includes(id))
          : [...new Set([...prev, ...categoryPermissionIds])]
      );
    }
  };

  // Check if category is fully selected
  const isCategoryFullySelected = (category) => {
    const categoryPermissionIds = category.permissions.map(p => p.id);
    
    if (showEditModal) {
      return categoryPermissionIds.every(id => 
        selectedRoleItem?.permissions.includes(id)
      );
    }
    return categoryPermissionIds.every(id => selectedPermissions.includes(id));
  };

  // Check if category has any selected permissions
  const isCategoryPartiallySelected = (category) => {
    const categoryPermissionIds = category.permissions.map(p => p.id);
    
    if (showEditModal) {
      const selected = categoryPermissionIds.filter(id => 
        selectedRoleItem?.permissions.includes(id)
      );
      return selected.length > 0 && selected.length < category.permissions.length;
    }
    
    const selected = categoryPermissionIds.filter(id => selectedPermissions.includes(id));
    return selected.length > 0 && selected.length < category.permissions.length;
  };

  // Handle add role
  const handleAddRole = () => {
    const selectedCompanyObj = companies.find(c => c.id.toString() === newRole.companyId);

    const role = {
      id: roles.length + 1,
      name: newRole.name,
      description: newRole.description,
      company: selectedCompanyObj?.name || newRole.company,
      companyId: newRole.companyId,
      usersCount: 0,
      permissions: selectedPermissions,
      type: newRole.type,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status: newRole.status
    };

    setRoles([...roles, role]);
    
    // Reset form
    setNewRole({
      name: "",
      description: "",
      company: "",
      companyId: "",
      type: "custom",
      permissions: [],
      status: "active"
    });
    setSelectedPermissions([]);

    setShowAddModal(false);
    setSuccessMessage("Role added successfully!");
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Handle edit role
  const handleEditRole = () => {
    if (selectedRoleItem) {
      const updatedRoles = roles.map(role =>
        role.id === selectedRoleItem.id ? {
          ...selectedRoleItem,
          updatedAt: new Date().toISOString().split('T')[0]
        } : role
      );

      setRoles(updatedRoles);
      setShowEditModal(false);
      setSelectedRoleItem(null);
      setSuccessMessage("Role updated successfully!");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  // Handle delete role
  const handleDeleteRole = () => {
    if (selectedRoleItem) {
      setRoles(roles.filter(role => role.id !== selectedRoleItem.id));
      setShowDeleteModal(false);
      setSelectedRoleItem(null);
      setSuccessMessage("Role deleted successfully!");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  // Handle duplicate role
  const handleDuplicateRole = (role) => {
    const newRole = {
      ...role,
      id: roles.length + 1,
      name: `${role.name} (Copy)`,
      usersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    
    setRoles([...roles, newRole]);
    setSuccessMessage("Role duplicated successfully!");
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Open permissions modal
  const handleManagePermissions = (role) => {
    setSelectedRoleItem(role);
    setShowPermissionsModal(true);
  };

  // Open assign users modal
  const handleAssignUsers = (role) => {
    setSelectedRoleItem(role);
    
    // Mock assigned users (in real app, fetch from API)
    const assigned = availableUsers.filter(u => u.role === role.name).slice(0, role.usersCount);
    setAssignedUsers(assigned);
    
    const available = availableUsers.filter(u => 
      u.company === role.company && !assigned.some(a => a.id === u.id)
    );
    setAvailableForAssignment(available);
    
    setShowAssignUsersModal(true);
  };

  // Toggle user assignment
  const toggleUserAssignment = (user, assign) => {
    if (assign) {
      setAssignedUsers([...assignedUsers, user]);
      setAvailableForAssignment(availableForAssignment.filter(u => u.id !== user.id));
    } else {
      setAvailableForAssignment([...availableForAssignment, user]);
      setAssignedUsers(assignedUsers.filter(u => u.id !== user.id));
    }
  };

  // Save user assignments
  const handleSaveAssignments = () => {
    if (selectedRoleItem) {
      const updatedRoles = roles.map(role =>
        role.id === selectedRoleItem.id
          ? { ...role, usersCount: assignedUsers.length }
          : role
      );
      
      setRoles(updatedRoles);
      setShowAssignUsersModal(false);
      setSelectedRoleItem(null);
      setSuccessMessage("User assignments updated successfully!");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  // Open view modal
  const handleViewRole = (role) => {
    setSelectedRoleItem(role);
    setShowViewModal(true);
  };

  // Open edit modal
  const handleEditClick = (role) => {
    setSelectedRoleItem(role);
    setShowEditModal(true);
  };

  // Get role icon based on type
  const getRoleIcon = (type) => {
    switch(type) {
      case 'system': return FaShieldAlt;
      case 'custom': return FaUserTag;
      default: return FaUserTag;
    }
  };

  // Summary cards data
  const summaryCards = [
    {
      title: "Total Roles",
      value: totalRoles,
      icon: FaUserTag,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+3",
      changeType: "increase"
    },
    {
      title: "Active Roles",
      value: activeRoles,
      icon: FaUserCheck,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      subtext: `${((activeRoles / totalRoles) * 100).toFixed(1)}% of total`
    },
    {
      title: "System Roles",
      value: systemRoles,
      icon: FaShieldAlt,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Custom Roles",
      value: customRoles,
      icon: FaUserCog,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600"
    },
    {
      title: "Companies",
      value: companies.length,
      icon: FaBuilding,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      subtext: `${topCompany} leads`
    },
    {
      title: "Permissions",
      value: totalPermissions,
      icon: FaKey,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600"
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
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
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
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
              {card.change && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  card.changeType === 'increase'
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
          Company Roles & Permissions
        </motion.h1>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
          >
            <FaFilter className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Filters</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 bg-white"
          >
            <FaDownload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedPermissions([]);
              setShowAddModal(true);
            }}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            <FaPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Role</span>
            <span className="sm:hidden">Create</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search roles by name, description, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Company
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="all">All Companies</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Role Type
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="system">System Roles</option>
                    <option value="custom">Custom Roles</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid md:grid-cols-8 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase">
          <div className="col-span-2 flex items-center gap-1 cursor-pointer" onClick={() => requestSort('name')}>
            Role {getSortIcon('name')}
          </div>
          <div className="cursor-pointer" onClick={() => requestSort('company')}>
            Company {getSortIcon('company')}
          </div>
          <div>Type</div>
          <div className="cursor-pointer" onClick={() => requestSort('usersCount')}>
            Users {getSortIcon('usersCount')}
          </div>
          <div>Permissions</div>
          <div className="cursor-pointer" onClick={() => requestSort('status')}>
            Status {getSortIcon('status')}
          </div>
          <div>Actions</div>
        </div>

        {/* Role Rows */}
        <div className="divide-y divide-slate-200">
          <AnimatePresence mode="popLayout">
            {paginatedRoles.map((role, index) => {
              const RoleIcon = getRoleIcon(role.type);
              const CompanyIcon = companies.find(c => c.id === role.companyId)?.icon || FaBuilding;

              return (
                <motion.div
                  key={role.id}
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
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          role.type === 'system' 
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{role.name}</h3>
                          <p className="text-xs text-slate-500">{role.description.substring(0, 50)}...</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        role.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {role.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">Company</p>
                        <p className="text-slate-700 flex items-center gap-1">
                          <CompanyIcon className="w-3 h-3 text-slate-500" />
                          {role.company}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Type</p>
                        <p className="text-slate-700 capitalize">{role.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Users</p>
                        <p className="text-slate-700">{role.usersCount} assigned</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Permissions</p>
                        <p className="text-slate-700">{role.permissions.length} / {totalPermissions}</p>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center justify-end">
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setActionMenuOpen(actionMenuOpen === role.id ? null : role.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FaEllipsisV className="w-3 h-3" />
                        </motion.button>

                        <AnimatePresence>
                          {actionMenuOpen === role.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10"
                            >
                              <button
                                onClick={() => {
                                  handleViewRole(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <FaEye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleManagePermissions(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaKey className="w-4 h-4" />
                                Manage Permissions
                              </button>
                              <button
                                onClick={() => {
                                  handleAssignUsers(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaUsers className="w-4 h-4" />
                                Assign Users
                              </button>
                              <button
                                onClick={() => {
                                  handleDuplicateRole(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaCopy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  handleEditClick(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaEdit className="w-4 h-4" />
                                Edit Role
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRoleItem(role);
                                  setShowDeleteModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaTrash className="w-4 h-4" />
                                Delete Role
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-8 gap-4 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        role.type === 'system' 
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{role.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]" title={role.description}>
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CompanyIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-600">{role.company}</span>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        role.type === 'system'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {role.type}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">{role.usersCount}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${(role.permissions.length / totalPermissions) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{role.permissions.length}</span>
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        role.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {role.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setActionMenuOpen(actionMenuOpen === role.id ? null : role.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <FaEllipsisV className="w-3 h-3" />
                        </motion.button>

                        <AnimatePresence>
                          {actionMenuOpen === role.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-10"
                            >
                              <button
                                onClick={() => {
                                  handleViewRole(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <FaEye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  handleManagePermissions(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaKey className="w-4 h-4" />
                                Manage Permissions
                              </button>
                              <button
                                onClick={() => {
                                  handleAssignUsers(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaUsers className="w-4 h-4" />
                                Assign Users
                              </button>
                              <button
                                onClick={() => {
                                  handleDuplicateRole(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaCopy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  handleEditClick(role);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaEdit className="w-4 h-4" />
                                Edit Role
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRoleItem(role);
                                  setShowDeleteModal(true);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                              >
                                <FaTrash className="w-4 h-4" />
                                Delete Role
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRoles.length)} of {filteredRoles.length} roles
          </p>

          <div className="flex items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${
                currentPage === 1
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
              className={`p-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FaChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* View Role Modal */}
      <AnimatePresence>
        {showViewModal && selectedRoleItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-scroll"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <FaShieldAlt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Role Details</h2>
                      <p className="text-sm text-white/80">Complete information about this role</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Role Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    selectedRoleItem.type === 'system' 
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <FaShieldAlt className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">{selectedRoleItem.name}</h1>
                    <p className="text-slate-500">{selectedRoleItem.description}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Company</p>
                    <p className="font-medium text-slate-700">{selectedRoleItem.company}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Type</p>
                    <p className="font-medium text-slate-700 capitalize">{selectedRoleItem.type}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Users Assigned</p>
                    <p className="font-medium text-slate-700">{selectedRoleItem.usersCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedRoleItem.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedRoleItem.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Created</p>
                    <p className="font-medium text-slate-700">
                      {new Date(selectedRoleItem.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                    <p className="font-medium text-slate-700">
                      {new Date(selectedRoleItem.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FaKey className="w-4 h-4 text-purple-500" />
                    Assigned Permissions ({selectedRoleItem.permissions.length} / {totalPermissions})
                  </h3>
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto p-2">
                    {permissionCategories.map(category => {
                      const categoryPermissions = category.permissions.filter(p => 
                        selectedRoleItem.permissions.includes(p.id)
                      );
                      
                      if (categoryPermissions.length === 0) return null;
                      
                      return (
                        <div key={category.id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <category.icon className="w-4 h-4 text-purple-500" />
                            <h4 className="text-sm font-medium text-slate-700">{category.name}</h4>
                            <span className="text-xs text-slate-400 ml-auto">
                              {categoryPermissions.length}/{category.permissions.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {categoryPermissions.map(permission => (
                              <div key={permission.id} className="flex items-start gap-2 text-sm">
                                <FaCheck className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-slate-700">{permission.name}</p>
                                  <p className="text-xs text-slate-400">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedRoleItem);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Edit Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Role Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-scroll"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaPlus className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Create New Role</h2>
                      <p className="text-sm text-slate-500">Define a new role and its permissions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaInfoCircle className="w-4 h-4 text-purple-500" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newRole.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., HR Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="company"
                        value={newRole.companyId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={newRole.description}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe the purpose of this role..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Role Type
                      </label>
                      <select
                        name="type"
                        value={newRole.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="custom">Custom Role</option>
                        <option value="system">System Role</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={newRole.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaKey className="w-4 h-4 text-purple-500" />
                    Permissions <span className="text-xs text-slate-400 ml-1">({selectedPermissions.length} selected)</span>
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                    {permissionCategories.map(category => {
                      const fullySelected = isCategoryFullySelected(category);
                      const partiallySelected = isCategoryPartiallySelected(category);
                      
                      return (
                        <div key={category.id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={fullySelected}
                              ref={input => {
                                if (input) {
                                  input.indeterminate = partiallySelected && !fullySelected;
                                }
                              }}
                              onChange={() => toggleCategoryPermissions(category)}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />
                            <category.icon className="w-4 h-4 text-purple-500" />
                            <h4 className="text-sm font-medium text-slate-700">{category.name}</h4>
                            <span className="text-xs text-slate-400 ml-auto">
                              {category.permissions.filter(p => selectedPermissions.includes(p.id)).length}/{category.permissions.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                            {category.permissions.map(permission => (
                              <label key={permission.id} className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1"
                                />
                                <div>
                                  <p className="text-sm text-slate-700">{permission.name}</p>
                                  <p className="text-xs text-slate-400">{permission.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={!newRole.name || !newRole.description || !newRole.companyId || selectedPermissions.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  Create Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Permissions Modal */}
      <AnimatePresence>
        {showPermissionsModal && selectedRoleItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-scroll"
            onClick={() => setShowPermissionsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaKey className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Manage Permissions</h2>
                      <p className="text-sm text-slate-500">
                        Configure permissions for {selectedRoleItem.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                  {permissionCategories.map(category => {
                    const categoryPermissionIds = category.permissions.map(p => p.id);
                    const fullySelected = categoryPermissionIds.every(id => 
                      selectedRoleItem.permissions.includes(id)
                    );
                    const partiallySelected = categoryPermissionIds.some(id => 
                      selectedRoleItem.permissions.includes(id)
                    ) && !fullySelected;

                    return (
                      <div key={category.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={fullySelected}
                            ref={input => {
                              if (input) {
                                input.indeterminate = partiallySelected;
                              }
                            }}
                            onChange={() => toggleCategoryPermissions(category)}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          />
                          <category.icon className="w-4 h-4 text-purple-500" />
                          <h4 className="text-sm font-medium text-slate-700">{category.name}</h4>
                          <span className="text-xs text-slate-400 ml-auto">
                            {category.permissions.filter(p => selectedRoleItem.permissions.includes(p.id)).length}/{category.permissions.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                          {category.permissions.map(permission => (
                            <label key={permission.id} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedRoleItem.permissions.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1"
                              />
                              <div>
                                <p className="text-sm text-slate-700">{permission.name}</p>
                                <p className="text-xs text-slate-400">{permission.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleEditRole();
                    setShowPermissionsModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Users Modal */}
      <AnimatePresence>
        {showAssignUsersModal && selectedRoleItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-scroll"
            onClick={() => setShowAssignUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FaUsers className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Assign Users</h2>
                      <p className="text-sm text-slate-500">
                        Manage users assigned to {selectedRoleItem.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignUsersModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Available Users */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <FaUsers className="w-4 h-4 text-slate-400" />
                      Available Users ({availableForAssignment.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableForAssignment.map(user => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleUserAssignment(user, true)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Assign to role"
                          >
                            <FaArrowRight className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                      {availableForAssignment.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No available users
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assigned Users */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <FaUserCheck className="w-4 h-4 text-green-500" />
                      Assigned Users ({assignedUsers.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {assignedUsers.map(user => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleUserAssignment(user, false)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove from role"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                      {assignedUsers.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No users assigned
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowAssignUsersModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Assignments
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal - Similar to Add Modal but with populated data */}
      <AnimatePresence>
        {showEditModal && selectedRoleItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-scroll"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FaEdit className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Edit Role</h2>
                      <p className="text-sm text-slate-500">Update role information and permissions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Same as Add Modal but with selectedRoleItem values */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaInfoCircle className="w-4 h-4 text-amber-500" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Role Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={selectedRoleItem.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="company"
                        value={selectedRoleItem.companyId || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={selectedRoleItem.description || ''}
                        onChange={handleInputChange}
                        rows="2"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Role Type
                      </label>
                      <select
                        name="type"
                        value={selectedRoleItem.type || 'custom'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="custom">Custom Role</option>
                        <option value="system">System Role</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={selectedRoleItem.status || 'active'}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                    <FaKey className="w-4 h-4 text-amber-500" />
                    Permissions <span className="text-xs text-slate-400 ml-1">({selectedRoleItem.permissions?.length || 0} selected)</span>
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                    {permissionCategories.map(category => {
                      const categoryPermissionIds = category.permissions.map(p => p.id);
                      const fullySelected = categoryPermissionIds.every(id => 
                        selectedRoleItem.permissions.includes(id)
                      );
                      const partiallySelected = categoryPermissionIds.some(id => 
                        selectedRoleItem.permissions.includes(id)
                      ) && !fullySelected;

                      return (
                        <div key={category.id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              checked={fullySelected}
                              ref={input => {
                                if (input) {
                                  input.indeterminate = partiallySelected;
                                }
                              }}
                              onChange={() => toggleCategoryPermissions(category)}
                              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                            />
                            <category.icon className="w-4 h-4 text-amber-500" />
                            <h4 className="text-sm font-medium text-slate-700">{category.name}</h4>
                            <span className="text-xs text-slate-400 ml-auto">
                              {category.permissions.filter(p => selectedRoleItem.permissions.includes(p.id)).length}/{category.permissions.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-6">
                            {category.permissions.map(permission => (
                              <label key={permission.id} className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRoleItem.permissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mt-1"
                                />
                                <div>
                                  <p className="text-sm text-slate-700">{permission.name}</p>
                                  <p className="text-xs text-slate-400">{permission.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRole}
                  disabled={!selectedRoleItem.name || !selectedRoleItem.description || !selectedRoleItem.companyId}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed"
                >
                  Update Role
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedRoleItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
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
                Delete Role
              </h3>

              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete the role "{selectedRoleItem.name}"? 
                This action cannot be undone and will affect {selectedRoleItem.usersCount} assigned users.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}