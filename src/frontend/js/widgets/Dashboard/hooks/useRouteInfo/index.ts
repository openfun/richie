import { useLocation, useMatches } from 'react-router';

/**
 * Retrieve route information
 * Try to find the current route from all routes that match the current location.
 *
 * ⚠️ This hook must be used within a Router.
 */
const useRouteInfo = () => {
  const location = useLocation();
  const matches = useMatches();

  return matches.find((m) => location.pathname === m.pathname)!;
};

export default useRouteInfo;
