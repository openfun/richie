import { Navigate, Outlet } from 'react-router';

interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectPath: string;
}
const ProtectedRoute = ({ isAllowed, redirectPath }: ProtectedRouteProps) => {
  return isAllowed ? <Outlet /> : <Navigate to={redirectPath} />;
};

export default ProtectedRoute;
