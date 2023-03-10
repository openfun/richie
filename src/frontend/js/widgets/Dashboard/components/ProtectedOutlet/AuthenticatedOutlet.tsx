import { useSession } from 'contexts/SessionContext';
import ProtectedOutlet, { type ProtectedOutletProps } from './ProtectedOutlet';

/**
 * A component which renders <Outlet /> only if user is authenticated,
 * otherwise redirect to the provided redirect path.
 *
 * ⚠️ This component must be used within Routes.
 */
const AuthenticatedOutlet = (props: Omit<ProtectedOutletProps, 'isAllowed'>) => {
  const { user } = useSession();

  return <ProtectedOutlet isAllowed={!!user} {...props} />;
};

export default AuthenticatedOutlet;
