import { useNavigate } from 'react-router-dom';

const useEmployeeNavigation = () => {
    const navigate = useNavigate();

    const navigateToEmployeeProfile = (employeeId) => {
        if (employeeId) {
            navigate(`/employee-profile/${employeeId}`);
        } else {
            console.warn("Attempted to navigate to employee profile without an employee ID");
        }
    };

    return navigateToEmployeeProfile;
};

export default useEmployeeNavigation;
