import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectPath: string;
}
const ProtectedRoute = ({ isAllowed, redirectPath }: ProtectedRouteProps) => {
  return isAllowed ? <Outlet /> : <Navigate to={redirectPath} />;
};

export default ProtectedRoute;
