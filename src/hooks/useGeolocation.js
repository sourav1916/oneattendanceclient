import { useState, useCallback } from 'react';
import { getPreciseLocation } from '../utils/geolocation';

/**
 * Hook for managing geolocation state within React components.
 * Returns location data, errors, and loading states, along with a trigger function.
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getPreciseLocation(options);
      setLocation(pos);
      setLoading(false);
      return pos;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return { location, error, loading, fetchLocation };
};

export default useGeolocation;
