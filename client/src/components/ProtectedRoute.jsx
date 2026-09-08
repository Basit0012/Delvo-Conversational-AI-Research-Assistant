import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--bg-main)',
        color: 'var(--text-secondary)',
        gap: '16px'
      }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
        <span>Restoring your session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
