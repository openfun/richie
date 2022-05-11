import { useEffect } from 'react';
import { location } from 'utils/indirection/window';

interface ProtectedRouteProps {
  isAllowed: Boolean;
  redirectPath: string;
}

const ProtectedRoute = ({
  isAllowed,
  redirectPath,
  children,
}: ProtectedRouteProps & { children: JSX.Element }) => {
  useEffect(() => {
    if (!isAllowed) {
      location.assign(redirectPath);
    }
  }, [isAllowed, redirectPath]);

  return children;
};

export default ProtectedRoute;
