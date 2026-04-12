/**
 * Fetches the current position with high precision.
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} - Becomes an object containing all coordinate fields and timestamp
 */
export const getPreciseLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true, // Force GPS precision
      timeout: 15000,          // 15 seconds to allow for GPS fix
      maximumAge: 0,           // Ensure fresh data
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = 'An unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please allow access to fetch precise coordinates.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Ensure GPS is enabled.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        const err = new Error(message);
        err.code = error.code;
        reject(err);
      },
      defaultOptions
    );
  });
};
