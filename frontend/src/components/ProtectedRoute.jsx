import { Outlet, Navigate } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = sessionStorage.getItem('token'); // check login status

  if (!token) {
    // if no token, redirect to login
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // allow access
};

export default ProtectedRoute;
