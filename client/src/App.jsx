import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Readings from './pages/Readings';
import Reports from './pages/Reports';

// Only logged-in users can see these pages
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Logged-in users don't need the login/register pages
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/readings" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/readings" element={<Readings />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/readings" replace />} />
    </Routes>
  );
}
