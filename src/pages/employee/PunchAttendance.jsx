import React, { useState, useEffect } from 'react';

const PunchAttendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchStatus, setPunchStatus] = useState('punched_out');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [faceDialogOpen, setFaceDialogOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [punchHistory, setPunchHistory] = useState([]);
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('punchHistory');
    if (savedHistory) {
      setPunchHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('punchHistory', JSON.stringify(punchHistory));
  }, [punchHistory]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePunch = async (type) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    const punchRecord = {
      id: Date.now(),
      type: type,
      timestamp: now.toISOString(),
      location: gpsLocation ? `${gpsLocation.lat}, ${gpsLocation.lng}` : 'Location not available',
      method: type === 'qr' ? 'QR Scan' : type === 'face' ? 'Face Recognition' : type === 'gps' ? 'GPS' : 'Manual'
    };
    
    setPunchHistory(prev => [punchRecord, ...prev]);
    
    let newStatus = '';
    let message = '';
    
    switch(type) {
      case 'punch_in':
        newStatus = 'punched_in';
        message = 'Successfully punched in!';
        break;
      case 'punch_out':
        newStatus = 'punched_out';
        message = 'Successfully punched out!';
        break;
      case 'break_start':
        newStatus = 'on_break';
        message = 'Break started!';
        break;
      case 'break_end':
        newStatus = 'break_end';
        message = 'Break ended!';
        break;
      case 'qr':
        newStatus = 'punched_in';
        message = 'QR scan successful! Punched in.';
        break;
      case 'face':
        newStatus = 'punched_in';
        message = 'Face recognition successful! Punched in.';
        break;
      case 'gps':
        newStatus = 'punched_in';
        message = 'GPS location verified! Punched in.';
        break;
      default:
        break;
    }
    
    setPunchStatus(newStatus);
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setLoading(false);
  };

  const handleQRScan = () => {
    setQrDialogOpen(false);
    handlePunch('qr');
  };

  const handleFaceRecognition = () => {
    setFaceDialogOpen(false);
    handlePunch('face');
  };

  const handleGPSPunch = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          handlePunch('gps');
        },
        (error) => {
          setNotificationMessage(`GPS error: ${error.message}`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          setLoading(false);
        }
      );
    } else {
      setNotificationMessage('Geolocation not supported by your browser');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch(punchStatus) {
      case 'punched_in': return 'bg-green-100 text-green-800 border-green-300';
      case 'punched_out': return 'bg-red-100 text-red-800 border-red-300';
      case 'on_break': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'break_end': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = () => {
    const statusMap = {
      punched_in: 'Punched In',
      punched_out: 'Punched Out',
      on_break: 'On Break',
      break_end: 'Break Ended'
    };
    return statusMap[punchStatus] || 'Unknown';
  };

  const getPunchTime = () => {
    if (punchHistory.length > 0) {
      const lastPunch = punchHistory[0];
      return new Date(lastPunch.timestamp).toLocaleTimeString();
    }
    return '--:--:--';
  };

  const PunchCard = ({ icon: Icon, title, description, onClick, color = 'blue' }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100"
    >
      <div className={`w-20 h-20 rounded-full bg-${color}-100 flex items-center justify-center mb-4`}>
        <Icon className={`w-10 h-10 text-${color}-600`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center">{description}</p>
    </div>
  );

  // Icons as simple SVG components
  const LoginIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const PlayIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const StopIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );

  const QrIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );

  const FaceIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const TimeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Punch</h1>
        <p className="text-gray-600">{formatDate(currentTime)}</p>
      </div>

      {/* Status Cards */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <TimeIcon />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(currentTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckIcon />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
                {getStatusLabel()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
              <LoginIcon />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Punch</p>
              <p className="text-lg font-semibold text-gray-900">{getPunchTime()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Punch Actions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Punch Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <PunchCard 
          icon={LoginIcon} 
          title="Punch In" 
          description="Start your work day"
          onClick={() => handlePunch('punch_in')}
          color="green"
        />
        <PunchCard 
          icon={LogoutIcon} 
          title="Punch Out" 
          description="End your work day"
          onClick={() => handlePunch('punch_out')}
          color="red"
        />
        <PunchCard 
          icon={PlayIcon} 
          title="Break Start" 
          description="Start your break"
          onClick={() => handlePunch('break_start')}
          color="orange"
        />
        <PunchCard 
          icon={StopIcon} 
          title="Break End" 
          description="End your break"
          onClick={() => handlePunch('break_end')}
          color="blue"
        />
      </div>

      {/* Advanced Methods */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Advanced Punch Methods</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <PunchCard 
          icon={QrIcon} 
          title="QR Scan Punch" 
          description="Scan QR code to punch"
          onClick={() => setQrDialogOpen(true)}
          color="purple"
        />
        <PunchCard 
          icon={FaceIcon} 
          title="Face Punch" 
          description="Use facial recognition"
          onClick={() => setFaceDialogOpen(true)}
          color="indigo"
        />
        <PunchCard 
          icon={LocationIcon} 
          title="GPS Punch" 
          description="Verify location to punch"
          onClick={handleGPSPunch}
          color="teal"
        />
      </div>

      {/* Punch History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Punch History</h3>
        <div className="divide-y divide-gray-200">
          {punchHistory.length > 0 ? (
            punchHistory.slice(0, 5).map((record) => (
              <div key={record.id} className="py-3 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {record.type.includes('in') && <LoginIcon />}
                  {record.type.includes('out') && <LogoutIcon />}
                  {record.type.includes('break') && <PlayIcon />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {record.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.timestamp).toLocaleTimeString()} • {record.method} • {record.location}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No punch records for today</p>
          )}
        </div>
      </div>

      {/* QR Dialog */}
      {qrDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 mb-4">
              <QrIcon />
              <h3 className="text-lg font-semibold">QR Code Scan</h3>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Position the QR code within the frame to scan
              </p>
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                <QrIcon />
              </div>
            </div>
            <input
              type="text"
              placeholder="Or enter QR code manually"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setQrDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleQRScan}
                disabled={!scanInput}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Verify & Punch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Face Dialog */}
      {faceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 mb-4">
              <FaceIcon />
              <h3 className="text-lg font-semibold">Face Recognition</h3>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Position your face within the frame
              </p>
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-white overflow-hidden">
                <FaceIcon />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Ensure proper lighting and face visibility
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setFaceDialogOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFaceRecognition}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Recognition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default PunchAttendance;