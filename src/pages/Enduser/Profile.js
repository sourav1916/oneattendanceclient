import React, { useState, useEffect } from 'react';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineLocationMarker, // Changed from HiOutlineMapPin
  HiOutlineCamera,
  HiOutlinePencil,
  HiOutlineKey,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSave,
  HiOutlineUpload,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineGlobeAlt,
  HiOutlineHeart,
  HiOutlineStar,
  HiOutlineLink,
  HiOutlineClock,
  HiOutlineUserGroup
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

const MyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form errors
  const [editErrors, setEditErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dummy profile data
      const dummyProfile = {
        id: 'EMP-2024-089',
        name: 'Alex Morgan',
        email: 'alex.morgan@company.com',
        personalEmail: 'alex.m@gmail.com',
        phone: '+1 (555) 123-4567',
        emergencyContact: '+1 (555) 987-6543',
        department: 'Engineering',
        role: 'Senior Software Engineer',
        team: 'Frontend Development',
        manager: 'Sarah Johnson',
        location: 'San Francisco, CA',
        office: 'Main Campus, Building B',
        joinDate: '2022-03-15',
        employeeType: 'Full-time',
        workEmail: 'a.morgan@company.com',
        skills: ['React', 'Node.js', 'TypeScript', 'UI/UX', 'GraphQL'],
        certifications: ['AWS Certified', 'Scrum Master'],
        education: 'M.S. Computer Science - Stanford University',
        bio: 'Passionate software engineer with 5+ years of experience in building scalable web applications. Love mentoring junior developers and contributing to open source.',
        profilePhoto: null,
        coverPhoto: null,
        birthday: '1992-08-23',
        timezone: 'PST (UTC-8)',
        languages: ['English (Native)', 'Spanish (Conversational)'],
        socialLinks: {
          linkedin: 'linkedin.com/in/alexmorgan',
          github: 'github.com/alexmorgan',
          twitter: '@alexmorgan_dev'
        }
      };

      setProfileData(dummyProfile);
      setEditForm(dummyProfile);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate edit form
  const validateEditForm = () => {
    const errors = {};

    if (!editForm.name?.trim()) {
      errors.name = 'Name is required';
    }

    if (!editForm.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      errors.email = 'Email is invalid';
    }

    if (!editForm.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(editForm.phone)) {
      errors.phone = 'Phone number is invalid';
    }

    if (!editForm.location?.trim()) {
      errors.location = 'Location is required';
    }

    return errors;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase and number';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Handle save profile
  const handleSaveProfile = () => {
    const errors = validateEditForm();
    
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setProfileData(editForm);
    setIsEditing(false);
    setSuccessMessage('Profile updated successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Handle change password
  const handleChangePassword = () => {
    const errors = validatePasswordForm();
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Simulate password change
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSuccessMessage('Password changed successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate years of service
  const getYearsOfService = (joinDate) => {
    const join = new Date(joinDate);
    const now = new Date();
    const years = now.getFullYear() - join.getFullYear();
    return years;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
        <div className="max-w-5xl mx-auto animate-pulse">
          {/* Cover skeleton */}
          <div className="h-48 bg-slate-200 rounded-3xl mb-20"></div>
          
          {/* Avatar skeleton */}
          <div className="relative flex justify-center mb-8">
            <div className="absolute -top-16 w-32 h-32 bg-slate-300 rounded-2xl"></div>
          </div>
          
          {/* Info skeleton */}
          <div className="text-center mb-8">
            <div className="h-8 w-48 bg-slate-200 rounded-lg mx-auto mb-2"></div>
            <div className="h-5 w-32 bg-slate-200 rounded-lg mx-auto"></div>
          </div>
          
          {/* Details skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>

      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-emerald-50 text-emerald-800 px-6 py-3 rounded-2xl shadow-lg border border-emerald-200 flex items-center gap-3">
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with tabs */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Profile
            </span>
          </h1>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'profile'
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Profile Information
              {activeTab === 'profile' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('employment')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'employment'
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Employment Details
              {activeTab === 'employment' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'skills'
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Skills & Education
              {activeTab === 'skills' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                />
              )}
            </button>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl overflow-hidden"
        >
          {/* Cover photo */}
          <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
            {profileData?.coverPhoto && (
              <img src={profileData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            )}
            
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!isEditing && !isChangingPassword && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center gap-2 hover:bg-white/30 transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    Edit Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center gap-2 hover:bg-white/30 transition-colors"
                  >
                    <HiOutlineKey className="w-4 h-4" />
                    Change Password
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Profile photo */}
          <div className="relative flex justify-center">
            <div className="absolute -top-16">
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                  {profileData?.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt={profileData.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {getInitials(profileData?.name || '')}
                    </span>
                  )}
                </div>
                
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <HiOutlineCamera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Profile content */}
          <div className="pt-20 p-8">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Name and basic info */}
                <div className="text-center mb-8">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editForm.name || ''}
                      onChange={handleEditChange}
                      className={`text-3xl font-bold text-center w-full max-w-md mx-auto px-4 py-2 bg-slate-50 border rounded-xl ${
                        editErrors.name ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-slate-800">{profileData?.name}</h2>
                  )}
                  {editErrors.name && (
                    <p className="text-sm text-rose-600 mt-1">{editErrors.name}</p>
                  )}
                  
                  <p className="text-indigo-600 font-medium mt-1">{profileData?.role}</p>
                  <p className="text-sm text-slate-500 mt-1">Member since {formatDate(profileData?.joinDate)}</p>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineMail className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Work Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={editForm.email || ''}
                          onChange={handleEditChange}
                          className={`w-full mt-1 px-3 py-1 bg-white border rounded-lg ${
                            editErrors.email ? 'border-rose-500' : 'border-slate-200'
                          }`}
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{profileData?.email}</p>
                      )}
                      {editErrors.email && (
                        <p className="text-xs text-rose-600 mt-1">{editErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Personal Email */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineMail className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Personal Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          name="personalEmail"
                          value={editForm.personalEmail || ''}
                          onChange={handleEditChange}
                          className="w-full mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg"
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{profileData?.personalEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlinePhone className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Phone Number</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone || ''}
                          onChange={handleEditChange}
                          className={`w-full mt-1 px-3 py-1 bg-white border rounded-lg ${
                            editErrors.phone ? 'border-rose-500' : 'border-slate-200'
                          }`}
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{profileData?.phone}</p>
                      )}
                      {editErrors.phone && (
                        <p className="text-xs text-rose-600 mt-1">{editErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlinePhone className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Emergency Contact</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="emergencyContact"
                          value={editForm.emergencyContact || ''}
                          onChange={handleEditChange}
                          className="w-full mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg"
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{profileData?.emergencyContact}</p>
                      )}
                    </div>
                  </div>

                  {/* Location - using HiOutlineLocationMarker */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineLocationMarker className="w-5 h-5 text-rose-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Location</p>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={editForm.location || ''}
                          onChange={handleEditChange}
                          className={`w-full mt-1 px-3 py-1 bg-white border rounded-lg ${
                            editErrors.location ? 'border-rose-500' : 'border-slate-200'
                          }`}
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{profileData?.location}</p>
                      )}
                      {editErrors.location && (
                        <p className="text-xs text-rose-600 mt-1">{editErrors.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineGlobeAlt className="w-5 h-5 text-cyan-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Timezone</p>
                      <p className="font-medium text-slate-700">{profileData?.timezone}</p>
                    </div>
                  </div>

                  {/* Birthday */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineCalendar className="w-5 h-5 text-pink-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Birthday</p>
                      {isEditing ? (
                        <input
                          type="date"
                          name="birthday"
                          value={editForm.birthday || ''}
                          onChange={handleEditChange}
                          className="w-full mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg"
                        />
                      ) : (
                        <p className="font-medium text-slate-700">{formatDate(profileData?.birthday)}</p>
                      )}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineGlobeAlt className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-500">Languages</p>
                      <p className="font-medium text-slate-700">
                        {profileData?.languages?.join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-2">Bio</p>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={editForm.bio || ''}
                      onChange={handleEditChange}
                      rows="3"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                    />
                  ) : (
                    <p className="text-slate-700">{profileData?.bio}</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'employment' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee ID */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineIdentification className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Employee ID</p>
                      <p className="font-medium text-slate-700">{profileData?.id}</p>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Department</p>
                      <p className="font-medium text-slate-700">{profileData?.department}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineBriefcase className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Role</p>
                      <p className="font-medium text-slate-700">{profileData?.role}</p>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineUserGroup className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Team</p>
                      <p className="font-medium text-slate-700">{profileData?.team}</p>
                    </div>
                  </div>

                  {/* Manager */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineBadgeCheck className="w-5 h-5 text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Manager</p>
                      <p className="font-medium text-slate-700">{profileData?.manager}</p>
                    </div>
                  </div>

                  {/* Employee Type */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineShieldCheck className="w-5 h-5 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Employment Type</p>
                      <p className="font-medium text-slate-700">{profileData?.employeeType}</p>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineCalendar className="w-5 h-5 text-pink-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Join Date</p>
                      <p className="font-medium text-slate-700">{formatDate(profileData?.joinDate)}</p>
                    </div>
                  </div>

                  {/* Years of Service */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineClock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Years of Service</p>
                      <p className="font-medium text-slate-700">{getYearsOfService(profileData?.joinDate)} years</p>
                    </div>
                  </div>

                  {/* Office Location - using HiOutlineLocationMarker */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineLocationMarker className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Office Location</p>
                      <p className="font-medium text-slate-700">{profileData?.office}</p>
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                    <HiOutlineMail className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Work Email</p>
                      <p className="font-medium text-slate-700">{profileData?.workEmail}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData?.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Certifications</h3>
                  <div className="space-y-2">
                    {profileData?.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <HiOutlineBadgeCheck className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Education</h3>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-700">{profileData?.education}</p>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Social Links</h3>
                  <div className="space-y-2">
                    {Object.entries(profileData?.socialLinks || {}).map(([platform, link]) => (
                      <div key={platform} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <HiOutlineLink className="w-5 h-5 text-indigo-600" />
                        <span className="text-slate-700 capitalize">{platform}: </span>
                        <a href={`https://${link}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Edit/Save buttons */}
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-end mt-8 pt-6 border-t border-slate-200"
              >
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm(profileData);
                    setEditErrors({});
                  }}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
                >
                  <HiOutlineSave className="w-4 h-4" />
                  Save Changes
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Change Password Modal */}
        <AnimatePresence>
          {isChangingPassword && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsChangingPassword(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
              >
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-800">Change Password</h2>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="p-6 space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        passwordErrors.currentPassword ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-rose-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        passwordErrors.newPassword ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-rose-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        passwordErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200'
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-rose-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Password requirements */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Password requirements:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          passwordForm.newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}></span>
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          /[A-Z]/.test(passwordForm.newPassword) ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}></span>
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          /[a-z]/.test(passwordForm.newPassword) ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}></span>
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          /\d/.test(passwordForm.newPassword) ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}></span>
                        At least one number
                      </li>
                    </ul>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default MyProfile;