import { useEffect } from 'react';

const useAutoLogout = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      // ✅ Clear everything only when browser/tab is closed
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('warehouseId');
      localStorage.removeItem('warehouse');
      localStorage.removeItem('userPolicies');
      localStorage.removeItem('roleId');
      localStorage.removeItem('fullName');
      localStorage.removeItem('departmentId');
      localStorage.removeItem('department');
      localStorage.removeItem('email');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
};

export default useAutoLogout;
