import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Settings state
  const [settings, setSettings] = useState({
    account: {
      name: 'Alex Morgan',
      email: 'alex.morgan@company.com',
      language: 'en',
      timezone: 'America/Los_Angeles',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    password: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    theme: {
      mode: 'light', // 'light', 'dark', 'system'
      colorScheme: 'blue', // 'blue', 'purple', 'green', 'orange'
      compactMode: false,
      reducedMotion: false,
      fontSize: 'medium' // 'small', 'medium', 'large'
    },
    notifications: {
      email: {
        leaveApproved: true,
        leaveRejected: true,
        leavePending: true,
        lateWarning: true,
        timesheetReminder: true,
        profileUpdates: false,
        newsletters: false
      },
      push: {
        leaveApproved: true,
        leaveRejected: true,
        leavePending: false,
        lateWarning: true,
        timesheetReminder: true,
        profileUpdates: true,
        announcements: false
      },
      inApp: {
        leaveApproved: true,
        leaveRejected: true,
        leavePending: true,
        lateWarning: true,
        timesheetReminder: true,
        profileUpdates: true,
        systemAlerts: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    },
    privacy: {
      profileVisibility: 'public', // 'public', 'private', 'team'
      showEmail: false,
      showPhone: false,
      showBirthday: true,
      activityStatus: true,
      readReceipts: true
    }
  });

  // Password form errors
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Settings already set with defaults
      setLoading(false);
    };

    fetchSettings();
  }, []);

  // Handle account changes
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [name]: value
      }
    }));
  };

  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      password: {
        ...prev.password,
        [name]: value
      }
    }));

    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle theme changes
  const handleThemeChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }));

    // Apply theme to document
    if (key === 'mode') {
      if (value === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (value === 'light') {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Handle notification changes
  const handleNotificationChange = (channel, key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: {
          ...prev.notifications[channel],
          [key]: value
        }
      }
    }));
  };

  // Handle privacy changes
  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  // Validate password form
  const validatePassword = () => {
    const errors = {};

    if (!settings.password.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!settings.password.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (settings.password.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(settings.password.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase and number';
    }

    if (!settings.password.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (settings.password.confirmPassword !== settings.password.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  };

  // Handle password change submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    const errors = validatePassword();
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // Simulate password change
    setSuccessMessage('Password updated successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Clear form
    setSettings(prev => ({
      ...prev,
      password: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }));
  };

  // Handle save all settings
  const handleSaveAll = () => {
    setSuccessMessage('Settings saved successfully');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Get theme preview class
  const getThemePreview = (color) => {
    switch(color) {
      case 'blue': return 'bg-blue-600';
      case 'purple': return 'bg-purple-600';
      case 'green': return 'bg-green-600';
      case 'orange': return 'bg-orange-600';
      default: return 'bg-blue-600';
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-48 bg-slate-200 rounded-lg mb-8 animate-pulse"></div>
          
          {/* Tabs skeleton */}
          <div className="flex gap-2 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="bg-white rounded-2xl p-8 animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-green-50 text-green-800 px-6 py-3 rounded-2xl shadow-lg border border-green-200">
              {successMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-slate-600">Manage your preferences and account settings</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {[
            { id: 'account', label: 'Account' },
            { id: 'password', label: 'Password' },
            { id: 'theme', label: 'Appearance' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'privacy', label: 'Privacy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Settings Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={settings.account.name}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={settings.account.email}
                    onChange={handleAccountChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Language
                    </label>
                    <select
                      name="language"
                      value={settings.account.language}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={settings.account.timezone}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Australia/Sydney">Sydney (AEST)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date Format
                    </label>
                    <select
                      name="dateFormat"
                      value={settings.account.dateFormat}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Time Format
                    </label>
                    <select
                      name="timeFormat"
                      value={settings.account.timeFormat}
                      onChange={handleAccountChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Settings */}
          {activeTab === 'password' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={settings.password.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      passwordErrors.currentPassword ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-rose-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={settings.password.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      passwordErrors.newPassword ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-rose-600">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={settings.password.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      passwordErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-rose-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Password requirements */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Password requirements:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        settings.password.newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'
                      }`}></span>
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        /[A-Z]/.test(settings.password.newPassword) ? 'bg-green-500' : 'bg-slate-300'
                      }`}></span>
                      At least one uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        /[a-z]/.test(settings.password.newPassword) ? 'bg-green-500' : 'bg-slate-300'
                      }`}></span>
                      At least one lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        /\d/.test(settings.password.newPassword) ? 'bg-green-500' : 'bg-slate-300'
                      }`}></span>
                      At least one number
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Appearance</h2>
              
              <div className="space-y-8">
                {/* Theme mode */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', preview: 'bg-white border-2 border-slate-200' },
                      { id: 'dark', label: 'Dark', preview: 'bg-slate-800' },
                      { id: 'system', label: 'System', preview: 'bg-gradient-to-r from-white to-slate-800' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleThemeChange('mode', option.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          settings.theme.mode === option.id
                            ? 'border-slate-800 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`h-20 rounded-lg mb-3 ${option.preview}`}></div>
                        <p className="text-sm font-medium text-slate-700">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color scheme */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Accent Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['blue', 'purple', 'green', 'orange'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleThemeChange('colorScheme', color)}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          color === 'blue' ? 'bg-blue-600' :
                          color === 'purple' ? 'bg-purple-600' :
                          color === 'green' ? 'bg-green-600' : 'bg-orange-600'
                        } ${
                          settings.theme.colorScheme === color
                            ? 'ring-4 ring-offset-2 ring-slate-300'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Font size */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    Font Size
                  </label>
                  <div className="flex gap-4">
                    {[
                      { id: 'small', label: 'Small', preview: 'text-sm' },
                      { id: 'medium', label: 'Medium', preview: 'text-base' },
                      { id: 'large', label: 'Large', preview: 'text-lg' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleThemeChange('fontSize', option.id)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          settings.theme.fontSize === option.id
                            ? 'border-slate-800 bg-slate-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <p className={`font-medium text-slate-700 ${option.preview}`}>
                          {option.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional options */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.theme.compactMode}
                      onChange={(e) => handleThemeChange('compactMode', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Compact mode (denser layout)</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.theme.reducedMotion}
                      onChange={(e) => handleThemeChange('reducedMotion', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Reduced motion</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Notification Preferences</h2>
              
              <div className="space-y-8">
                {/* Email notifications */}
                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.email).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNotificationChange('email', key, e.target.checked)}
                          className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push notifications */}
                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.push).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNotificationChange('push', key, e.target.checked)}
                          className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* In-app notifications */}
                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-4">In-App Notifications</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.inApp).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleNotificationChange('inApp', key, e.target.checked)}
                          className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quiet hours */}
                <div className="border-t border-slate-200 pt-6">
                  <label className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={settings.notifications.quietHours.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          quietHours: {
                            ...prev.notifications.quietHours,
                            enabled: e.target.checked
                          }
                        }
                      }))}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enable Quiet Hours</span>
                  </label>

                  {settings.notifications.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 ml-8">
                      <div>
                        <label className="block text-sm text-slate-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={settings.notifications.quietHours.start}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              quietHours: {
                                ...prev.notifications.quietHours,
                                start: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={settings.notifications.quietHours.end}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              quietHours: {
                                ...prev.notifications.quietHours,
                                end: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Privacy Settings</h2>
              
              <div className="space-y-6">
                {/* Profile visibility */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Profile Visibility
                  </label>
                  <div className="flex gap-4">
                    {[
                      { id: 'public', label: 'Public' },
                      { id: 'team', label: 'Team Only' },
                      { id: 'private', label: 'Private' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handlePrivacyChange('profileVisibility', option.id)}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                          settings.privacy.profileVisibility === option.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Show email to team members</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Show phone number</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.privacy.showBirthday}
                      onChange={(e) => handlePrivacyChange('showBirthday', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Show birthday</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.privacy.activityStatus}
                      onChange={(e) => handlePrivacyChange('activityStatus', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Show activity status</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.privacy.readReceipts}
                      onChange={(e) => handlePrivacyChange('readReceipts', e.target.checked)}
                      className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">Send read receipts</span>
                  </label>
                </div>

                {/* Data export */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Data & Privacy</h3>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                      Export My Data
                    </button>
                    <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                      Download Activity Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Save button for all tabs except password */}
        {activeTab !== 'password' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex justify-end"
          >
            <button
              onClick={handleSaveAll}
              className="px-8 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              Save Changes
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Settings;