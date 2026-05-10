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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/spaces/:id" element={<SpaceDetail />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
