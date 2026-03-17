import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Catalogue } from './pages/customer/Catalogue';
import { Checkout } from './pages/customer/Checkout';
import { Orders } from './pages/customer/Orders';
import { Inventory } from './pages/rdc/Inventory';
import { DriverDashboard } from './pages/logistics/DriverDashboard';
import { Billing } from './pages/billing/Billing';
import { Dashboard } from './pages/analytics/Dashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useAuth();
  
  if (currentUser === undefined) return <div>Loading...</div>; // auth state initializing
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Basic RBAC mock check (will be fleshed out later)
  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

// Public Route Wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { theme } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        </Route>

        {/* Dashboard / App Routes */}
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/logistics" element={<DriverDashboard />} />
            <Route path="/billing" element={<Billing />} />
          </Route>
          
          {/* Redirect root to dashboard -> wait -> login if unauthenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<div><h2>404 - Page Not Found</h2></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
