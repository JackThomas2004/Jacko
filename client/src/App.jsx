import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Browse from './pages/Browse';
import SpaceDetail from './pages/SpaceDetail';
import Dashboard from './pages/Dashboard';
import ListSpace from './pages/ListSpace';
import EditSpace from './pages/EditSpace';
import MyBookings from './pages/MyBookings';
import HostedBookings from './pages/HostedBookings';
import Checkout from './pages/Checkout';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/spaces/:id" element={<SpaceDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/list-space"
            element={<ProtectedRoute><ListSpace /></ProtectedRoute>}
          />
          <Route
            path="/spaces/:id/edit"
            element={<ProtectedRoute><EditSpace /></ProtectedRoute>}
          />
          <Route
            path="/my-bookings"
            element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
          />
          <Route
            path="/hosted-bookings"
            element={<ProtectedRoute><HostedBookings /></ProtectedRoute>}
          />
          <Route
            path="/checkout/:bookingId"
            element={<ProtectedRoute><Checkout /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
