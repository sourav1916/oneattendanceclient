import { useCallback } from 'react';

/**
 * A reusable hook for validating password strength.
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one numeric digit
 * - At least one special character
 */
export const usePasswordValidation = () => {
  const validatePassword = useCallback((password) => {
    if (!password) {
      return {
        minLength: false,
        hasUpper: false,
        hasNumber: false,
        hasSpecial: false,
        isValid: false,
      };
    }
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpper,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasNumber && hasSpecial,
    };
  }, []);

  return { validatePassword };
};
