import { useAuth } from '../../hooks/useAuth';
import Login from '../Auth/Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;