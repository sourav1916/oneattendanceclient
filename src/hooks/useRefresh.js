import { useAuth } from "./context/AuthContext";

/**
 * Hook to access the refresh state and trigger a refresh.
 * This is useful for components that need to re-fetch data 
 * when the company is switched or a manual refresh is requested.
 */
export const useRefresh = () => {
  const { refreshKey, triggerRefresh } = useAuth();
  
  return {
    refreshKey,
    refresh: triggerRefresh,
    triggerRefresh
  };
};

export default useRefresh;
