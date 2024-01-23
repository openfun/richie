import { Location, matchPath, resolvePath } from 'react-router-dom';

export const isMenuLinkActive = (to: string, location: Location) => {
  const path = resolvePath(to).pathname;
  return !!matchPath({ path, end: true }, location.pathname);
};
