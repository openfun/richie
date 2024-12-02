import { Location, matchPath, resolvePath } from 'react-router';

export const isMenuLinkActive = (to: string, location: Location) => {
  const path = resolvePath(to).pathname;
  return !!matchPath({ path, end: true }, location.pathname);
};
