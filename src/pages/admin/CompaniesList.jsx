// pages/admin/companies/CompaniesList.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
    FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaEye,
    FaChevronLeft, FaChevronRight, FaBuilding, FaEnvelope,
    FaPhone, FaGlobe, FaMapMarkerAlt, FaUsers, FaBriefcase,
    FaDownload, FaUpload, FaTimes, FaCamera, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle, FaClock, FaUserCircle,
    FaIdCard, FaInfoCircle, FaChartLine, FaDollarSign,
    FaIndustry, FaRegBuilding, FaUserTie, FaLink,
    FaFileAlt, FaStar, FaBan, FaCheck, FaExclamationTriangle
} from "react-icons/fa";

export default function CompaniesList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndustry, setSelectedIndustry] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const itemsPerPage = 10;
    const isAnyModalOpen = showAddModal || showEditModal || showViewModal || showDeleteModal;

    // Use the hook
    useBodyScrollLock(isAnyModalOpen);
    // Form state for new company
    const [newCompany, setNewCompany] = useState({
        name: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        employeeCount: "",
        foundedYear: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
        status: "active",
        description: "",
        logo: null,
        taxId: "",
        registrationNumber: "",
        contactPerson: "",
        contactPersonEmail: "",
        contactPersonPhone: "",
        socialMedia: {
            linkedin: "",
            twitter: "",
            facebook: ""
        },
        subscription: "basic",
        subscriptionStart: "",
        subscriptionEnd: ""
    });

    // Sample companies data
    const [companies, setCompanies] = useState([
        {
            id: 1,
            name: "TechCorp Solutions",
            email: "info@techcorp.com",
            phone: "+1 234-567-8901",
            website: "www.techcorp.com",
            industry: "Technology",
            employeeCount: 250,
            foundedYear: 2010,
            address: "123 Innovation Drive",
            city: "San Francisco",
            state: "CA",
            country: "USA",
            zipCode: "94105",
            status: "active",
            description: "Leading provider of innovative software solutions for enterprise clients.",
            logo: null,
            taxId: "TAX-123456",
            registrationNumber: "REG-789012",
            contactPerson: "John Smith",
            contactPersonEmail: "john.smith@techcorp.com",
            contactPersonPhone: "+1 234-567-8999",
            socialMedia: {
                linkedin: "linkedin.com/company/techcorp",
                twitter: "@techcorp",
                facebook: "facebook.com/techcorp"
            },
            subscription: "enterprise",
            subscriptionStart: "2024-01-01",
            subscriptionEnd: "2024-12-31",
            createdAt: "2024-01-01",
            employees: 25,
            projects: 12,
            revenue: "$2.5M"
        },
        {
            id: 2,
            name: "Global Marketing Agency",
            email: "contact@globalmarketing.com",
            phone: "+1 234-567-8902",
            website: "www.globalmarketing.com",
            industry: "Marketing",
            employeeCount: 120,
            foundedYear: 2015,
            address: "456 Market Street",
            city: "New York",
            state: "NY",
            country: "USA",
            zipCode: "10001",
            status: "active",
            description: "Full-service marketing agency helping brands grow their online presence.",
            logo: null,
            taxId: "TAX-234567",
            registrationNumber: "REG-890123",
            contactPerson: "Sarah Johnson",
            contactPersonEmail: "sarah.j@globalmarketing.com",
            contactPersonPhone: "+1 234-567-8888",
            socialMedia: {
                linkedin: "linkedin.com/company/globalmarketing",
                twitter: "@globalmarketing",
                facebook: "facebook.com/globalmarketing"
            },
            subscription: "professional",
            subscriptionStart: "2024-02-01",
            subscriptionEnd: "2025-01-31",
            createdAt: "2024-02-01",
            employees: 15,
            projects: 8,
            revenue: "$1.2M"
        },
        {
            id: 3,
            name: "Finance Plus Ltd",
            email: "info@financeplus.com",
            phone: "+1 234-567-8903",
            website: "www.financeplus.com",
            industry: "Finance",
            employeeCount: 75,
            foundedYear: 2018,
            address: "789 Wall Street",
            city: "Boston",
            state: "MA",
            country: "USA",
            zipCode: "02108",
            status: "inactive",
            description: "Financial consulting and investment management services.",
            logo: null,
            taxId: "TAX-345678",
            registrationNumber: "REG-901234",
            contactPerson: "Michael Brown",
            contactPersonEmail: "michael.b@financeplus.com",
            contactPersonPhone: "+1 234-567-8777",
            socialMedia: {
                linkedin: "linkedin.com/company/financeplus",
                twitter: "@financeplus",
                facebook: "facebook.com/financeplus"
            },
            subscription: "basic",
            subscriptionStart: "2024-01-15",
            subscriptionEnd: "2024-07-15",
            createdAt: "2024-01-15",
            employees: 8,
            projects: 4,
            revenue: "$500K"
        },
        {
            id: 4,
            name: "Healthcare Innovations",
            email: "contact@healthcareinnovations.com",
            phone: "+1 234-567-8904",
            website: "www.healthcareinnovations.com",
            industry: "Healthcare",
            employeeCount: 180,
            foundedYear: 2012,
            address: "321 Medical Drive",
            city: "Chicago",
            state: "IL",
            country: "USA",
            zipCode: "60601",
            status: "active",
            description: "Revolutionizing healthcare through technology and innovation.",
            logo: null,
            taxId: "TAX-456789",
            registrationNumber: "REG-012345",
            contactPerson: "Emily Davis",
            contactPersonEmail: "emily.d@healthcareinnovations.com",
            contactPersonPhone: "+1 234-567-8666",
            socialMedia: {
                linkedin: "linkedin.com/company/healthcareinnovations",
                twitter: "@healthcareinnov",
                facebook: "facebook.com/healthcareinnovations"
            },
            subscription: "enterprise",
            subscriptionStart: "2024-03-01",
            subscriptionEnd: "2025-02-28",
            createdAt: "2024-03-01",
            employees: 20,
            projects: 10,
            revenue: "$3.0M"
        },
        {
            id: 5,
            name: "EcoBuild Construction",
            email: "info@ecobuild.com",
            phone: "+1 234-567-8905",
            website: "www.ecobuild.com",
            industry: "Construction",
            employeeCount: 350,
            foundedYear: 2005,
            address: "654 Green Way",
            city: "Seattle",
            state: "WA",
            country: "USA",
            zipCode: "98101",
            status: "active",
            description: "Sustainable construction and green building solutions.",
            logo: null,
            taxId: "TAX-567890",
            registrationNumber: "REG-123456",
            contactPerson: "David Wilson",
            contactPersonEmail: "david.w@ecobuild.com",
            contactPersonPhone: "+1 234-567-8555",
            socialMedia: {
                linkedin: "linkedin.com/company/ecobuild",
                twitter: "@ecobuild",
                facebook: "facebook.com/ecobuild"
            },
            subscription: "professional",
            subscriptionStart: "2024-01-20",
            subscriptionEnd: "2025-01-19",
            createdAt: "2024-01-20",
            employees: 30,
            projects: 15,
            revenue: "$4.2M"
        },
    ]);

    // Filter options
    const industries = ["Technology", "Marketing", "Finance", "Healthcare", "Construction", "Education", "Retail", "Manufacturing", "Consulting"];
    const statuses = ["Active", "Inactive", "Suspended", "Pending"];
    const subscriptionTypes = ["Basic", "Professional", "Enterprise", "Custom"];

    // Calculate summary statistics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(company => company.status === 'active').length;
    const inactiveCompanies = companies.filter(company => company.status === 'inactive').length;
    const newThisMonth = companies.filter(company => {
        const createdAt = new Date(company.createdAt);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;

    // Industry distribution
    const industryCount = companies.reduce((acc, company) => {
        acc[company.industry] = (acc[company.industry] || 0) + 1;
        return acc;
    }, {});

    const topIndustry = Object.entries(industryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Total employees across all companies
    const totalEmployeesAcrossCompanies = companies.reduce((acc, company) => acc + company.employees, 0);

    // Average employees per company
    const avgEmployeesPerCompany = Math.round(totalEmployeesAcrossCompanies / (companies.length || 1));

    // Total projects across all companies
    const totalProjectsAcrossCompanies = companies.reduce((acc, company) => acc + company.projects, 0);

    // Subscription distribution
    const subscriptionCount = companies.reduce((acc, company) => {
        acc[company.subscription] = (acc[company.subscription] || 0) + 1;
        return acc;
    }, {});

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Handle nested social media fields
        if (name.startsWith('socialMedia.')) {
            const field = name.split('.')[1];
            if (showEditModal && selectedCompany) {
                setSelectedCompany(prev => ({
                    ...prev,
                    socialMedia: {
                        ...prev.socialMedia,
                        [field]: value
                    }
                }));
            } else {
                setNewCompany(prev => ({
                    ...prev,
                    socialMedia: {
                        ...prev.socialMedia,
                        [field]: value
                    }
                }));
            }
        } else {
            if (showEditModal && selectedCompany) {
                setSelectedCompany(prev => ({
                    ...prev,
                    [name]: value
                }));
            } else {
                setNewCompany(prev => ({
                    ...prev,
                    [name]: value
                }));
            }
        }
    };

    // Handle form submit for add
    const handleAddCompany = () => {
        // Create new company object
        const company = {
            id: companies.length + 1,
            name: newCompany.name,
            email: newCompany.email,
            phone: newCompany.phone,
            website: newCompany.website,
            industry: newCompany.industry,
            employeeCount: parseInt(newCompany.employeeCount) || 0,
            foundedYear: parseInt(newCompany.foundedYear) || new Date().getFullYear(),
            address: newCompany.address,
            city: newCompany.city,
            state: newCompany.state,
            country: newCompany.country,
            zipCode: newCompany.zipCode,
            status: newCompany.status,
            description: newCompany.description,
            logo: newCompany.logo,
            taxId: newCompany.taxId,
            registrationNumber: newCompany.registrationNumber,
            contactPerson: newCompany.contactPerson,
            contactPersonEmail: newCompany.contactPersonEmail,
            contactPersonPhone: newCompany.contactPersonPhone,
            socialMedia: newCompany.socialMedia,
            subscription: newCompany.subscription,
            subscriptionStart: newCompany.subscriptionStart,
            subscriptionEnd: newCompany.subscriptionEnd,
            createdAt: new Date().toISOString().split('T')[0],
            employees: 0,
            projects: 0,
            revenue: "$0"
        };

        // Add to companies list
        setCompanies([...companies, company]);

        // Reset form
        setNewCompany({
            name: "",
            email: "",
            phone: "",
            website: "",
            industry: "",
            employeeCount: "",
            foundedYear: "",
            address: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
            status: "active",
            description: "",
            logo: null,
            taxId: "",
            registrationNumber: "",
            contactPerson: "",
            contactPersonEmail: "",
            contactPersonPhone: "",
            socialMedia: {
                linkedin: "",
                twitter: "",
                facebook: ""
            },
            subscription: "basic",
            subscriptionStart: "",
            subscriptionEnd: ""
        });

        // Close modal and show success message
        setShowAddModal(false);
        setSuccessMessage("Company added successfully!");
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 3000);
    };

    // Handle form submit for edit
    const handleEditCompany = () => {
        if (selectedCompany) {
            // Update the company in the list
            const updatedCompanies = companies.map(company =>
                company.id === selectedCompany.id ? selectedCompany : company
            );

            setCompanies(updatedCompanies);
            setShowEditModal(false);
            setSelectedCompany(null);
            setSuccessMessage("Company updated successfully!");
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        }
    };

    // Handle delete company
    const handleDeleteCompany = () => {
        if (selectedCompany) {
            setCompanies(companies.filter(company => company.id !== selectedCompany.id));
            setShowDeleteModal(false);
            setSelectedCompany(null);
            setSuccessMessage("Company deleted successfully!");
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 3000);
        }
    };

    // Open view modal
    const handleViewCompany = (company) => {
        setSelectedCompany(company);
        setShowViewModal(true);
    };

    // Open edit modal
    const handleEditClick = (company) => {
        setSelectedCompany(company);
        setShowEditModal(true);
    };

    // Filter companies
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.city.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesIndustry = selectedIndustry === "all" ||
            company.industry.toLowerCase() === selectedIndustry.toLowerCase();
        const matchesStatus = selectedStatus === "all" ||
            company.status === selectedStatus.toLowerCase();
        return matchesSearch && matchesIndustry && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + itemsPerPage);

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'inactive':
                return 'bg-slate-100 text-slate-600';
            case 'suspended':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    // Get subscription badge color
    const getSubscriptionColor = (subscription) => {
        switch (subscription) {
            case 'enterprise':
                return 'bg-purple-100 text-purple-700';
            case 'professional':
                return 'bg-blue-100 text-blue-700';
            case 'basic':
                return 'bg-slate-100 text-slate-600';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    // Summary card data
    const summaryCards = [
        {
            title: "Total Companies",
            value: totalCompanies,
            icon: FaBuilding,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            change: "+8%",
            changeType: "increase"
        },
        {
            title: "Active Companies",
            value: activeCompanies,
            icon: FaCheckCircle,
            bgColor: "bg-green-50",
            textColor: "text-green-600",
            subtext: `${((activeCompanies / totalCompanies) * 100).toFixed(1)}% of total`,
            change: "+5%",
            changeType: "increase"
        },
        {
            title: "Total Employees",
            value: totalEmployeesAcrossCompanies,
            icon: FaUsers,
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            subtext: `Avg ${avgEmployeesPerCompany} per company`,
            change: "+12%",
            changeType: "increase"
        },
        {
            title: "Total Projects",
            value: totalProjectsAcrossCompanies,
            icon: FaBriefcase,
            bgColor: "bg-amber-50",
            textColor: "text-amber-600",
            change: "+15%",
            changeType: "increase"
        },
        {
            title: "Industries",
            value: Object.keys(industryCount).length,
            icon: FaIndustry,
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            subtext: `${topIndustry} leads`
        },
        {
            title: "New This Month",
            value: newThisMonth,
            icon: FaClock,
            bgColor: "bg-rose-50",
            textColor: "text-rose-600",
            change: "+3",
            changeType: "increase"
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
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
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
                    Companies Directory
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
                        onClick={() => setShowAddModal(true)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"
                    >
                        <FaPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Company</span>
                        <span className="sm:hidden">Add</span>
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
                        placeholder="Search by company name, email, industry, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
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
                                        Industry
                                    </label>
                                    <select
                                        value={selectedIndustry}
                                        onChange={(e) => setSelectedIndustry(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="all">All Industries</option>
                                        {industries.map(industry => (
                                            <option key={industry} value={industry.toLowerCase()}>{industry}</option>
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
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Companies Grid/Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Table Header - Hidden on mobile */}
                <div className="hidden md:grid md:grid-cols-8 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase">
                    <div className="col-span-2">Company</div>
                    <div>Industry</div>
                    <div>Location</div>
                    <div>Employees</div>
                    <div>Subscription</div>
                    <div>Status</div>
                    <div>Actions</div>
                </div>

                {/* Company Rows */}
                <div className="divide-y divide-slate-200">
                    <AnimatePresence mode="wait">
                        {paginatedCompanies.map((company, index) => (
                            <motion.div
                                key={company.id}
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
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-medium">
                                                    {company.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-800">{company.name}</h3>
                                                <p className="text-xs text-slate-500">{company.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}>
                                            {company.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400">Industry</p>
                                            <p className="text-slate-700">{company.industry}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Location</p>
                                            <p className="text-slate-700">{company.city}, {company.state}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Employees</p>
                                            <p className="text-slate-700">{company.employees}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">Subscription</p>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSubscriptionColor(company.subscription)}`}>
                                                {company.subscription}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleViewCompany(company)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEditClick(company)}
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setSelectedCompany(company);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:grid md:grid-cols-8 gap-4 items-center">
                                    <div className="col-span-2 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-medium">
                                                {company.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{company.name}</p>
                                            <p className="text-xs text-slate-500">{company.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600">{company.industry}</div>
                                    <div className="text-sm text-slate-600">{company.city}, {company.state}</div>
                                    <div className="text-sm text-slate-600">{company.employees}</div>
                                    <div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubscriptionColor(company.subscription)}`}>
                                            {company.subscription}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(company.status)}`}>
                                            {company.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleViewCompany(company)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View"
                                        >
                                            <FaEye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEditClick(company)}
                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                                            title="Edit"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setSelectedCompany(company);
                                                setShowDeleteModal(true);
                                            }}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Delete"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
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

            {/* View Company Modal */}
            <AnimatePresence>
                {showViewModal && selectedCompany && (
                    <motion.div
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
                            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <FaBuilding className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Company Profile</h2>
                                        <p className="text-sm text-white/80">Detailed information about the company</p>
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
                                {/* Company Header */}
                                <div className="flex flex-col sm:flex-row gap-6 mb-8">
                                    <div className="flex-shrink-0">
                                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <span className="text-white text-4xl font-bold">
                                                {selectedCompany.name.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-slate-800 mb-1">{selectedCompany.name}</h1>
                                        <p className="text-slate-500 mb-3">{selectedCompany.industry} • Founded {selectedCompany.foundedYear}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedCompany.status)}`}>
                                                {selectedCompany.status}
                                            </span>
                                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSubscriptionColor(selectedCompany.subscription)}`}>
                                                {selectedCompany.subscription} Plan
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Employees</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedCompany.employees}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Projects</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedCompany.projects}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">Revenue</p>
                                        <p className="text-xl font-bold text-slate-800">{selectedCompany.revenue}</p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Company Information */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaBuilding className="w-4 h-4 text-indigo-500" />
                                            Company Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <FaEnvelope className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Email</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaPhone className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Phone</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaGlobe className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Website</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.website}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaIdCard className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Tax ID / Registration</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.taxId} | {selectedCompany.registrationNumber}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Person */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaUserTie className="w-4 h-4 text-indigo-500" />
                                            Primary Contact
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <FaUserCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Name</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.contactPerson}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaEnvelope className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Email</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.contactPersonEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaPhone className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Phone</p>
                                                    <p className="text-sm text-slate-700">{selectedCompany.contactPersonPhone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaMapMarkerAlt className="w-4 h-4 text-indigo-500" />
                                            Address
                                        </h3>
                                        <p className="text-sm text-slate-700">
                                            {selectedCompany.address}<br />
                                            {selectedCompany.city}, {selectedCompany.state} {selectedCompany.zipCode}<br />
                                            {selectedCompany.country}
                                        </p>
                                    </div>

                                    {/* Subscription Details */}
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaStar className="w-4 h-4 text-indigo-500" />
                                            Subscription Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <FaCalendarAlt className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">Start Date</p>
                                                    <p className="text-sm text-slate-700">
                                                        {new Date(selectedCompany.subscriptionStart).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <FaCalendarAlt className="w-4 h-4 text-slate-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-slate-400">End Date</p>
                                                    <p className="text-sm text-slate-700">
                                                        {new Date(selectedCompany.subscriptionEnd).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social Media */}
                                    <div className="bg-slate-50 rounded-xl p-5 md:col-span-2">
                                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                            <FaLink className="w-4 h-4 text-indigo-500" />
                                            Social Media
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {selectedCompany.socialMedia.linkedin && (
                                                <div>
                                                    <p className="text-xs text-slate-400 mb-1">LinkedIn</p>
                                                    <p className="text-sm text-indigo-600 hover:underline cursor-pointer">
                                                        {selectedCompany.socialMedia.linkedin}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedCompany.socialMedia.twitter && (
                                                <div>
                                                    <p className="text-xs text-slate-400 mb-1">Twitter</p>
                                                    <p className="text-sm text-indigo-600 hover:underline cursor-pointer">
                                                        {selectedCompany.socialMedia.twitter}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedCompany.socialMedia.facebook && (
                                                <div>
                                                    <p className="text-xs text-slate-400 mb-1">Facebook</p>
                                                    <p className="text-sm text-indigo-600 hover:underline cursor-pointer">
                                                        {selectedCompany.socialMedia.facebook}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedCompany.description && (
                                        <div className="bg-slate-50 rounded-xl p-5 md:col-span-2">
                                            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                                <FaFileAlt className="w-4 h-4 text-indigo-500" />
                                                About
                                            </h3>
                                            <p className="text-sm text-slate-700">{selectedCompany.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowViewModal(false)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Company Modal */}
            <AnimatePresence>
                {showEditModal && selectedCompany && (
                    <motion.div
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
                                        <h2 className="text-lg font-semibold text-slate-800">Edit Company</h2>
                                        <p className="text-sm text-slate-500">Update company information</p>
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
                                {/* Company Logo */}
                                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                                            <span className="text-white text-3xl font-medium">
                                                {selectedCompany.name?.charAt(0) || '?'}
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
                                        <p className="text-sm text-slate-500 mb-1">Company Logo</p>
                                        <p className="text-xs text-slate-400">Click the camera icon to update</p>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaBuilding className="w-4 h-4 text-amber-500" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={selectedCompany.name || ''}
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
                                                value={selectedCompany.email || ''}
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
                                                value={selectedCompany.phone || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Website
                                            </label>
                                            <input
                                                type="text"
                                                name="website"
                                                value={selectedCompany.website || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                placeholder="www.example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Industry <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="industry"
                                                value={selectedCompany.industry || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="">Select Industry</option>
                                                {industries.map(industry => (
                                                    <option key={industry} value={industry}>{industry}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Founded Year
                                            </label>
                                            <input
                                                type="number"
                                                name="foundedYear"
                                                value={selectedCompany.foundedYear || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                placeholder="YYYY"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaMapMarkerAlt className="w-4 h-4 text-amber-500" />
                                        Address
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={selectedCompany.address || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={selectedCompany.city || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={selectedCompany.state || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                ZIP Code
                                            </label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={selectedCompany.zipCode || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={selectedCompany.country || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Person */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaUserTie className="w-4 h-4 text-amber-500" />
                                        Primary Contact
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                name="contactPerson"
                                                value={selectedCompany.contactPerson || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                name="contactPersonEmail"
                                                value={selectedCompany.contactPersonEmail || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactPersonPhone"
                                                value={selectedCompany.contactPersonPhone || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Business Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaIdCard className="w-4 h-4 text-amber-500" />
                                        Business Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Tax ID
                                            </label>
                                            <input
                                                type="text"
                                                name="taxId"
                                                value={selectedCompany.taxId || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Registration Number
                                            </label>
                                            <input
                                                type="text"
                                                name="registrationNumber"
                                                value={selectedCompany.registrationNumber || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaStar className="w-4 h-4 text-amber-500" />
                                        Subscription Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription Plan
                                            </label>
                                            <select
                                                name="subscription"
                                                value={selectedCompany.subscription || 'basic'}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="basic">Basic</option>
                                                <option value="professional">Professional</option>
                                                <option value="enterprise">Enterprise</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={selectedCompany.status || 'active'}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription Start
                                            </label>
                                            <input
                                                type="date"
                                                name="subscriptionStart"
                                                value={selectedCompany.subscriptionStart || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription End
                                            </label>
                                            <input
                                                type="date"
                                                name="subscriptionEnd"
                                                value={selectedCompany.subscriptionEnd || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaLink className="w-4 h-4 text-amber-500" />
                                        Social Media
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                LinkedIn
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.linkedin"
                                                value={selectedCompany.socialMedia?.linkedin || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Twitter
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.twitter"
                                                value={selectedCompany.socialMedia?.twitter || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Facebook
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.facebook"
                                                value={selectedCompany.socialMedia?.facebook || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaFileAlt className="w-4 h-4 text-amber-500" />
                                        Company Description
                                    </h3>
                                    <textarea
                                        name="description"
                                        value={selectedCompany.description || ''}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Brief description of the company..."
                                    />
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
                                    onClick={handleEditCompany}
                                    disabled={!selectedCompany.name || !selectedCompany.email || !selectedCompany.phone || !selectedCompany.industry}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed"
                                >
                                    Update Company
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Company Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
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
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <FaPlus className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-800">Add New Company</h2>
                                        <p className="text-sm text-slate-500">Fill in the company details below</p>
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
                                {/* Company Logo */}
                                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <span className="text-white text-3xl font-medium">
                                                {newCompany.name?.charAt(0) || '?'}
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
                                        <p className="text-sm text-slate-500 mb-1">Company Logo</p>
                                        <p className="text-xs text-slate-400">Upload a company logo (optional)</p>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaBuilding className="w-4 h-4 text-indigo-500" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={newCompany.name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Acme Inc."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={newCompany.email}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="info@company.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Phone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={newCompany.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="+1 234-567-8901"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Website
                                            </label>
                                            <input
                                                type="text"
                                                name="website"
                                                value={newCompany.website}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="www.example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Industry <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="industry"
                                                value={newCompany.industry}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Industry</option>
                                                {industries.map(industry => (
                                                    <option key={industry} value={industry}>{industry}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Founded Year
                                            </label>
                                            <input
                                                type="number"
                                                name="foundedYear"
                                                value={newCompany.foundedYear}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="YYYY"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Employee Count
                                            </label>
                                            <input
                                                type="number"
                                                name="employeeCount"
                                                value={newCompany.employeeCount}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Number of employees"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaMapMarkerAlt className="w-4 h-4 text-indigo-500" />
                                        Address
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Street Address
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={newCompany.address}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="123 Business Ave"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={newCompany.city}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="San Francisco"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={newCompany.state}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="CA"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                ZIP Code
                                            </label>
                                            <input
                                                type="text"
                                                name="zipCode"
                                                value={newCompany.zipCode}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="94105"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={newCompany.country}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="USA"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Person */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaUserTie className="w-4 h-4 text-indigo-500" />
                                        Primary Contact
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                name="contactPerson"
                                                value={newCompany.contactPerson}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                name="contactPersonEmail"
                                                value={newCompany.contactPersonEmail}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="john@company.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactPersonPhone"
                                                value={newCompany.contactPersonPhone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="+1 234-567-8901"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Business Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaIdCard className="w-4 h-4 text-indigo-500" />
                                        Business Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Tax ID
                                            </label>
                                            <input
                                                type="text"
                                                name="taxId"
                                                value={newCompany.taxId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="TAX-123456"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Registration Number
                                            </label>
                                            <input
                                                type="text"
                                                name="registrationNumber"
                                                value={newCompany.registrationNumber}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="REG-789012"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Subscription Details */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaStar className="w-4 h-4 text-indigo-500" />
                                        Subscription Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription Plan
                                            </label>
                                            <select
                                                name="subscription"
                                                value={newCompany.subscription}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="basic">Basic</option>
                                                <option value="professional">Professional</option>
                                                <option value="enterprise">Enterprise</option>
                                                <option value="custom">Custom</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Status
                                            </label>
                                            <select
                                                name="status"
                                                value={newCompany.status}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                                <option value="pending">Pending</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription Start
                                            </label>
                                            <input
                                                type="date"
                                                name="subscriptionStart"
                                                value={newCompany.subscriptionStart}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Subscription End
                                            </label>
                                            <input
                                                type="date"
                                                name="subscriptionEnd"
                                                value={newCompany.subscriptionEnd}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaLink className="w-4 h-4 text-indigo-500" />
                                        Social Media
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                LinkedIn
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.linkedin"
                                                value={newCompany.socialMedia.linkedin}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="linkedin.com/company/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Twitter
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.twitter"
                                                value={newCompany.socialMedia.twitter}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="@company"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                Facebook
                                            </label>
                                            <input
                                                type="text"
                                                name="socialMedia.facebook"
                                                value={newCompany.socialMedia.facebook}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="facebook.com/company"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <FaFileAlt className="w-4 h-4 text-indigo-500" />
                                        Company Description
                                    </h3>
                                    <textarea
                                        name="description"
                                        value={newCompany.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Brief description of the company..."
                                    />
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
                                    onClick={handleAddCompany}
                                    disabled={!newCompany.name || !newCompany.email || !newCompany.phone || !newCompany.industry}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                                >
                                    Add Company
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
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
                                Delete Company
                            </h3>

                            <p className="text-sm text-slate-500 text-center mb-6">
                                Are you sure you want to delete <span className="font-semibold">{selectedCompany?.name}</span>? This action cannot be undone and will remove all associated data.
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
                                    onClick={handleDeleteCompany}
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