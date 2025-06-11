import { useEffect } from 'react';

const useAutoLogout = (timeout = 10 * 60 * 1000) => {
  // 10 min timeout
  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        sessionStorage.removeItem('name');
        sessionStorage.removeItem('warehouseId');
        sessionStorage.removeItem('warehouse');
        sessionStorage.removeItem('userPolicies');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('roleId');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('fullName');
        sessionStorage.removeItem('departmentId');
        sessionStorage.removeItem('department');
        sessionStorage.removeItem('email');
        alert('Session expired due to inactivity.');
        window.location.href = '/'; // Redirect to login page
      }, timeout);
    };

    // Reset timer on user activity
    window.onload = resetTimer;
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.onscroll = resetTimer;
    document.onclick = resetTimer;

    resetTimer(); // Initialize timer

    return () => clearTimeout(logoutTimer); // Cleanup on unmount
  }, [timeout]);
};

export default useAutoLogout;
