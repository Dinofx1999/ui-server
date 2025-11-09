// components/PublicRoute.tsx
import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  if (isLoggedIn) {
    // Redirect to home if already authenticated
    return <Navigate to="/price" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;