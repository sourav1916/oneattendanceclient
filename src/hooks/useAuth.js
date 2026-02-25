// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    // Save individual fields too (for backward compatibility)
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("email", userData.email);
    localStorage.setItem("first_name", userData.first_name);
    localStorage.setItem("is_system_admin", userData.is_system_admin);
    setUser(userData);
  };

  const logout = () => {
    // ✅ Clear ALL auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('first_name');
    localStorage.removeItem('middle_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('phone');
    localStorage.removeItem('is_system_admin');
    
    // Clear entire localStorage if you want (optional)
    // localStorage.clear();
    
    setUser(null);
    navigate('/login', { replace: true }); // Don't keep login in history
  };

  return { user, isLoading, login, logout };
};
