/**
 * Fetches the current position with high precision.
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} - Becomes an object containing all coordinate fields and timestamp
 */
export const getPreciseLocation = async (options = {}) => {
  const getCoordinates = () => new Promise((resolve, reject) => {
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

  const pos = await getCoordinates();

  if (options.fetchAddress) {
    try {
      const params = new URLSearchParams({
        lat: pos.latitude.toString(),
        lon: pos.longitude.toString(),
        format: 'json',
        addressdetails: 1
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AttendanceApp/1.0'
        }
      });
      const data = await response.json();
      
      if (data && (data.address || data.display_name)) {
        const address = data.address || {};
        
        // Extract PIN code with fallback to display_name regex
        let pin = address.postcode || '';
        if (!pin && data.display_name) {
           const match = data.display_name.match(/\b\d{5,6}\b/);
           if (match) pin = match[0];
        }

        // Extremely robust Line 1 extraction
        const entityName = address.amenity || address.building || address.shop || address.office || address.commercial || data.name || '';
        const street = [address.house_number, address.road].filter(Boolean).join(' ').trim();
        
        let line1 = [entityName, street].filter(Boolean).join(', ').trim() || 
                    [address.neighbourhood, address.suburb, address.residential].filter(Boolean).join(', ').trim() || 
                    (data.display_name ? data.display_name.split(',').slice(0, 2).join(', ').trim() : "");
                    
        pos.address = {
          line1: line1,
          line2: [address.neighbourhood, address.suburb, address.hamlet, address.locality, address.village].filter(Boolean).join(', ').trim(),
          city: address.city || address.town || address.village || address.county || address.state_district || "",
          state: address.state || "",
          postal_code: pin,
          country: address.country || "India",
          raw: address
        };
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      // We don't throw here because coordinates were fetched successfully
    }
  }

  return pos;
};
