import { useEffect } from 'react';
import { location } from 'utils/indirection/window';

interface ProtectedRouteProps {
  children: JSX.Element;
  isAllowed: Boolean;
  redirectPath: string;
}

const ProtectedRoute = ({ isAllowed, redirectPath, children }: ProtectedRouteProps) => {
  useEffect(() => {
    if (!isAllowed) {
      location.assign(redirectPath);
    }
  }, [isAllowed, redirectPath]);

  return children;
};

export default ProtectedRoute;
