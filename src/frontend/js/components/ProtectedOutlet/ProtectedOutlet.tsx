import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { location } from 'utils/indirection/window';

export interface ProtectedOutletProps {
  isAllowed: Boolean;
  redirectTo?: string;
}

/**
 * A component which renders <Outlet /> only if isAllowed is true,
 * otherwise redirect to the provided redirect path.
 *
 * ⚠️ This component must be used within Routes.
 */
const ProtectedOutlet = ({ isAllowed, redirectTo = '/' }: ProtectedOutletProps) => {
  useEffect(() => {
    if (!isAllowed) {
      location.replace(redirectTo);
    }
  }, [isAllowed, redirectTo]);

  return isAllowed ? <Outlet /> : null;
};

export default ProtectedOutlet;
