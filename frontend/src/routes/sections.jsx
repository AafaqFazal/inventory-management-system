import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from '../layouts/dashboard';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy imports
export const LoginPage = lazy(() => import('../pages/login'));
export const SignUp = lazy(() => import('../pages/signup'));
export const ForgetPassword = lazy(() => import('../pages/forget-password'));
export const Page404 = lazy(() => import('../pages/page-not-found'));
export const SuperAdminDashboard = lazy(() => import('../pages/super-admin-dashboard'));
export const StockManagement = lazy(() => import('../pages/stock-managment'));
export const ChangePassword = lazy(() => import('../pages/change-password'));
export const Departments = lazy(() => import('../pages/departments'));
export const Warehouses = lazy(() => import('../pages/warehouse'));
export const Materials = lazy(() => import('../pages/materials'));
export const Schemes = lazy(() => import('../pages/scheme'));
export const UserManagement = lazy(() => import('../pages/user-management'));
export const StockReport = lazy(() => import('../pages/stock-report'));
export const PoTracking = lazy(() => import('../pages/po-tracking'));
export const MaterialManagmenet = lazy(() => import('../pages/material-management'));

export default function Router() {
  const routes = useRoutes([
    {
      element: <ProtectedRoute />, // ✅ protect all routes inside
      children: [
        {
          element: (
            <DashboardLayout>
              <Suspense>
                <Outlet />
              </Suspense>
            </DashboardLayout>
          ),
          children: [
            { path: 'dashboard', element: <SuperAdminDashboard /> },
            { path: 'stock-management', element: <StockManagement /> },
            { path: 'departments', element: <Departments /> },
            { path: 'warehouse', element: <Warehouses /> },
            { path: 'materials', element: <Materials /> },
            { path: 'schemes', element: <Schemes /> },
            { path: 'user-management', element: <UserManagement /> },
            { path: 'stock-report', element: <StockReport /> },
            { path: 'po-tracking', element: <PoTracking /> },
            { path: 'material-report', element: <MaterialManagmenet /> },
          ],
        },
      ],
    },
    {
      path: '/',
      element: <LoginPage />,
    },
    { path: '/forgot-password', element: <ForgetPassword /> },
    { path: '/change-password', element: <ChangePassword /> },
    { path: '404', element: <Page404 /> },
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);

  return routes;
}
