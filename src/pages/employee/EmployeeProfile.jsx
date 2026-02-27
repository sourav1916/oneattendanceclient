import React, { useState, useEffect } from 'react';
import {
  FaUserCircle,
  FaEnvelope,
  FaIdCard,
  FaBuilding,
  FaBriefcase,
  FaCalendarAlt,
  FaCamera,
  FaQrcode,
  FaFingerprint,
  FaLock,
  FaBell,
  FaLanguage,
  FaPhone,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaVenusMars,
  FaHeart,
  FaGlobe,
  FaEdit,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaHistory,
  FaDownload,
  FaPrint,
  FaShare,
  FaUserTie,
  FaGraduationCap,
  FaAward,
  FaFileAlt,
  FaCreditCard,
  FaWallet,
  FaShieldAlt,
  FaMobile,
  FaLaptop,
  FaKey,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [faceEnrollment, setFaceEnrollment] = useState({
    status: 'pending', // enrolled, pending, not_started
    enrolledOn: null,
    lastUpdated: null,
    confidence: 0,
    attempts: 0
  });
  const [showQR, setShowQR] = useState(false);
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock employee data
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData = {
        personal: {
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Michael',
          preferredName: 'John',
          gender: 'Male',
          dateOfBirth: '1990-05-15',
          age: 33,
          bloodGroup: 'O+',
          maritalStatus: 'Married',
          nationality: 'Indian',
          religion: 'Christian',
          community: 'General'
        },
        
        contact: {
          email: 'john.doe@company.com',
          personalEmail: 'john.doe@gmail.com',
          phone: '+91 9876543210',
          alternatePhone: '+91 9876543211',
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '+91 9876543212'
          },
          presentAddress: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            pincode: '400001'
          },
          permanentAddress: {
            street: '456 Park Avenue',
            city: 'Delhi',
            state: 'Delhi',
            country: 'India',
            pincode: '110001'
          }
        },

        employment: {
          employeeCode: 'EMP001',
          department: 'Engineering',
          designation: 'Senior Software Developer',
          grade: 'Grade 5',
          level: 'Level 3',
          joiningDate: '2020-01-15',
          confirmationDate: '2020-07-15',
          probationPeriod: '6 months',
          employmentType: 'Permanent',
          workMode: 'Hybrid',
          workLocation: 'Mumbai Office',
          reportingManager: {
            name: 'Sarah Johnson',
            designation: 'Engineering Manager',
            employeeCode: 'EMP045',
            email: 'sarah.j@company.com'
          },
          hrManager: {
            name: 'Mike Wilson',
            designation: 'HR Manager',
            employeeCode: 'EMP089',
            email: 'mike.w@company.com'
          }
        },

        identity: {
          aadharNumber: 'XXXX-XXXX-1234',
          panNumber: 'ABCDE1234F',
          passportNumber: 'Z1234567',
          passportExpiry: '2025-12-31',
          drivingLicense: 'MH01-2020-12345',
          voterId: 'ABC1234567',
          uanNumber: '101234567890',
          pfNumber: 'MH/12345/1234'
        },

        education: [
          {
            degree: 'B.Tech Computer Science',
            institution: 'IIT Bombay',
            year: '2016',
            percentage: '85%',
            specialization: 'Software Engineering'
          },
          {
            degree: 'Higher Secondary',
            institution: 'Delhi Public School',
            year: '2012',
            percentage: '92%',
            board: 'CBSE'
          }
        ],

        experience: [
          {
            company: 'Tech Solutions Ltd',
            designation: 'Software Developer',
            from: '2016-07',
            to: '2020-01',
            duration: '3 years 6 months',
            responsibilities: 'Full stack development'
          }
        ],

        skills: [
          'JavaScript', 'React', 'Node.js', 'Python', 'SQL',
          'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'Redis'
        ],

        bankDetails: {
          accountNumber: 'XXXXXXXXXXXX1234',
          accountName: 'John Doe',
          bankName: 'HDFC Bank',
          branch: 'Andheri East',
          ifscCode: 'HDFC0001234',
          panNumber: 'ABCDE1234F'
        },

        documents: [
          { name: 'Aadhar Card', uploaded: true, verified: true },
          { name: 'PAN Card', uploaded: true, verified: true },
          { name: 'Degree Certificate', uploaded: true, verified: false },
          { name: 'Previous Experience Letters', uploaded: true, verified: true }
        ],

        settings: {
          language: 'English',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          notifications: {
            email: true,
            sms: true,
            push: true,
            weeklyReport: true
          },
          privacy: {
            showEmail: true,
            showPhone: true,
            showBirthday: false
          }
        },

        attendance: {
          lastPunch: '2024-03-27T09:15:00',
          todayStatus: 'Present',
          averageWorkingHours: '8.5',
          attendanceRate: '95%',
          lateCount: 2
        },

        leave: {
          annual: { taken: 12, total: 20 },
          sick: { taken: 3, total: 12 },
          casual: { taken: 4, total: 8 }
        }
      };

      setEmployee(mockData);
      setEditedData(mockData);
      
      // Set face enrollment status
      setFaceEnrollment({
        status: 'enrolled', // Change to 'pending' or 'not_started' for different states
        enrolledOn: '2024-01-15',
        lastUpdated: '2024-03-20',
        confidence: 98.5,
        attempts: 3
      });
      
      setLoading(false);
    }, 1500);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    setEditMode(false);
    setEmployee(editedData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditedData(employee);
  };

  const handleInputChange = (section, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFaceEnrollment = () => {
    setShowFaceEnrollment(true);
    // Simulate face capture
    setTimeout(() => {
      setFaceImage('captured-face-image-data');
      setFaceEnrollment({
        status: 'enrolled',
        enrolledOn: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        confidence: 98.5,
        attempts: 1
      });
      setShowFaceEnrollment(false);
    }, 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    return new Date(dateTimeString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFaceEnrollmentStatus = () => {
    switch(faceEnrollment.status) {
      case 'enrolled':
        return {
          label: 'Enrolled',
          icon: FaCheckCircle,
          color: 'green',
          message: 'Face enrolled successfully'
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: FaClock,
          color: 'yellow',
          message: 'Enrollment in progress'
        };
      default:
        return {
          label: 'Not Started',
          icon: FaExclamationTriangle,
          color: 'gray',
          message: 'Face enrollment not completed'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) return null;

  const enrollmentStatus = getFaceEnrollmentStatus();
  const StatusIcon = enrollmentStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUserCircle className="text-3xl text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employee Profile</h1>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage your personal and professional information
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!editMode ? (
                <>
                  <button
                    onClick={() => setShowQR(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <FaQrcode className="mr-2" />
                    Show QR
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FaSave className="mr-2" />
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-20 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <FaCheckCircle className="mr-2" />
          Profile updated successfully!
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6">
            <div className="flex items-start">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {employee.personal.firstName.charAt(0)}{employee.personal.lastName.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <FaCamera size={14} />
                </button>
              </div>

              {/* Basic Info */}
              <div className="ml-6 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {employee.personal.firstName} {employee.personal.lastName}
                    </h2>
                    <p className="text-gray-500">{employee.employment.designation}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Employee Code</p>
                      <p className="text-lg font-bold text-gray-900">{employee.employment.employeeCode}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium">{employee.employment.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{employee.contact.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{employee.contact.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joining Date</p>
                    <p className="text-sm font-medium">{formatDate(employee.employment.joiningDate)}</p>
                  </div>
                </div>

                {/* Face Enrollment Status */}
                <div className="mt-4 flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 bg-${enrollmentStatus.color}-100 rounded-full mr-3`}>
                    <StatusIcon className={`text-${enrollmentStatus.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Face Enrollment Status</p>
                        <p className="text-xs text-gray-500">{enrollmentStatus.message}</p>
                      </div>
                      {faceEnrollment.status === 'enrolled' ? (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Enrolled on {formatDate(faceEnrollment.enrolledOn)}</p>
                          <p className="text-xs text-gray-500">Confidence: {faceEnrollment.confidence}%</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleFaceEnrollment}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex -mb-px px-6">
              {[
                { id: 'personal', label: 'Personal', icon: FaUserCircle },
                { id: 'employment', label: 'Employment', icon: FaBriefcase },
                { id: 'contact', label: 'Contact', icon: FaPhone },
                { id: 'identity', label: 'Identity', icon: FaIdCard },
                { id: 'education', label: 'Education', icon: FaGraduationCap },
                { id: 'bank', label: 'Bank Details', icon: FaWallet },
                { id: 'documents', label: 'Documents', icon: FaFileAlt },
                { id: 'settings', label: 'Settings', icon: FaShieldAlt }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Personal Information */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.firstName}
                      onChange={(e) => handleInputChange('personal', 'firstName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.middleName}
                      onChange={(e) => handleInputChange('personal', 'middleName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.middleName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.lastName}
                      onChange={(e) => handleInputChange('personal', 'lastName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.preferredName}
                      onChange={(e) => handleInputChange('personal', 'preferredName', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.preferredName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  {editMode ? (
                    <select
                      value={editedData.personal.gender}
                      onChange={(e) => handleInputChange('personal', 'gender', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={editedData.personal.dateOfBirth}
                      onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formatDate(employee.personal.dateOfBirth)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                  {editMode ? (
                    <select
                      value={editedData.personal.bloodGroup}
                      onChange={(e) => handleInputChange('personal', 'bloodGroup', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>O+</option>
                      <option>O-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.bloodGroup}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                  {editMode ? (
                    <select
                      value={editedData.personal.maritalStatus}
                      onChange={(e) => handleInputChange('personal', 'maritalStatus', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.maritalStatus}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.nationality}
                      onChange={(e) => handleInputChange('personal', 'nationality', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.nationality}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Religion</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.personal.religion}
                      onChange={(e) => handleInputChange('personal', 'religion', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.personal.religion}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Employment Information */}
          {activeTab === 'employment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Employment Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.employeeCode}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.employment.department}
                      onChange={(e) => handleInputChange('employment', 'department', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.employment.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editedData.employment.designation}
                      onChange={(e) => handleInputChange('employment', 'designation', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.employment.designation}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.grade}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.level}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(employee.employment.joiningDate)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmation Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(employee.employment.confirmationDate)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.employmentType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Mode</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.workMode}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment.workLocation}</p>
                </div>
              </div>

              {/* Reporting Manager */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Reporting Manager</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaUserTie className="text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{employee.employment.reportingManager.name}</p>
                      <p className="text-sm text-gray-500">{employee.employment.reportingManager.designation}</p>
                      <p className="text-xs text-gray-400">Emp Code: {employee.employment.reportingManager.employeeCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Balance */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Leave Balance</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600">Annual Leave</p>
                    <p className="text-xl font-bold text-blue-700">
                      {employee.leave.annual.taken}/{employee.leave.annual.total}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-600">Sick Leave</p>
                    <p className="text-xl font-bold text-red-700">
                      {employee.leave.sick.taken}/{employee.leave.sick.total}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Casual Leave</p>
                    <p className="text-xl font-bold text-green-700">
                      {employee.leave.casual.taken}/{employee.leave.casual.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Email</label>
                  <p className="mt-1 text-sm text-gray-900">{employee.contact.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={editedData.contact.personalEmail}
                      onChange={(e) => handleInputChange('contact', 'personalEmail', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.contact.personalEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={editedData.contact.phone}
                      onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.contact.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Alternate Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={editedData.contact.alternatePhone}
                      onChange={(e) => handleInputChange('contact', 'alternatePhone', e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{employee.contact.alternatePhone}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Emergency Contact</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium">{employee.contact.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Relationship</p>
                      <p className="text-sm font-medium">{employee.contact.emergencyContact.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium">{employee.contact.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Present Address</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    {employee.contact.presentAddress.street},<br />
                    {employee.contact.presentAddress.city}, {employee.contact.presentAddress.state}<br />
                    {employee.contact.presentAddress.country} - {employee.contact.presentAddress.pincode}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Identity Documents */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Identity Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Aadhar Number</p>
                  <p className="text-lg font-medium">{employee.identity.aadharNumber}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">PAN Number</p>
                  <p className="text-lg font-medium">{employee.identity.panNumber}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Passport Number</p>
                  <p className="text-lg font-medium">{employee.identity.passportNumber}</p>
                  <p className="text-xs text-gray-400">Expires: {formatDate(employee.identity.passportExpiry)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Driving License</p>
                  <p className="text-lg font-medium">{employee.identity.drivingLicense}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Voter ID</p>
                  <p className="text-lg font-medium">{employee.identity.voterId}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">UAN Number</p>
                  <p className="text-lg font-medium">{employee.identity.uanNumber}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">PF Number</p>
                  <p className="text-lg font-medium">{employee.identity.pfNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Education */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Education</h3>
              
              {employee.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                      <p className="text-sm text-gray-600">{edu.institution}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Year: {edu.year} | Percentage: {edu.percentage}
                      </p>
                      {edu.specialization && (
                        <p className="text-xs text-gray-500">Specialization: {edu.specialization}</p>
                      )}
                      {edu.board && (
                        <p className="text-xs text-gray-500">Board: {edu.board}</p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bank Details */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Bank Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Account Number</p>
                  <p className="text-lg font-medium">{employee.bankDetails.accountNumber}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Account Name</p>
                  <p className="text-lg font-medium">{employee.bankDetails.accountName}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Bank Name</p>
                  <p className="text-lg font-medium">{employee.bankDetails.bankName}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-lg font-medium">{employee.bankDetails.branch}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">IFSC Code</p>
                  <p className="text-lg font-medium">{employee.bankDetails.ifscCode}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500">PAN Number</p>
                  <p className="text-lg font-medium">{employee.bankDetails.panNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {employee.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <FaFileAlt className="text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {doc.uploaded ? 'Uploaded' : 'Not Uploaded'} • 
                          {doc.verified ? ' Verified' : ' Pending Verification'}
                        </p>
                      </div>
                    </div>
                    {doc.verified ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      <FaExclamationTriangle className="text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language Preference</label>
                  <select
                    value={employee.settings.language}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={employee.settings.timezone}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>Asia/Kolkata</option>
                    <option>Asia/Dubai</option>
                    <option>Asia/Singapore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Format</label>
                  <select
                    value={employee.settings.dateFormat}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Notification Preferences</h4>
                <div className="space-y-2">
                  {Object.entries(employee.settings.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => {}}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Change Password */}
              <div className="mt-6 border-t pt-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">Change Password</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Current Password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-400"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attendance Summary Card */}
        <div className="mt-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-80">Status</p>
              <p className="text-xl font-bold">{employee.attendance.todayStatus}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Last Punch</p>
              <p className="text-xl font-bold">{formatDateTime(employee.attendance.lastPunch)}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Avg Working Hours</p>
              <p className="text-xl font-bold">{employee.attendance.averageWorkingHours}</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Attendance Rate</p>
              <p className="text-xl font-bold">{employee.attendance.attendanceRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Employee QR Code</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg flex justify-center">
                <div className="w-48 h-48 bg-white p-2">
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <FaQrcode className="text-6xl text-gray-600" />
                  </div>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Employee Code: {employee.employment.employeeCode}
              </p>
              
              <div className="mt-4 flex justify-center space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <FaDownload className="mr-2" />
                  Download
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                  <FaPrint className="mr-2" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Enrollment Modal */}
      {showFaceEnrollment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Face Enrollment</h3>
                <button
                  onClick={() => setShowFaceEnrollment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg flex justify-center">
                <div className="w-48 h-48 bg-gray-200 rounded-full flex items-center justify-center border-4 border-blue-500 border-dashed">
                  <FaCamera className="text-4xl text-gray-500" />
                </div>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Position your face within the frame
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Processing... Please look at the camera</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;