import { useMemo } from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import { createBrowserRouter, generatePath, NavigateOptions, useNavigate } from 'react-router-dom';
import { getDashboardRoutes } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { getDashboardBasename } from './getDashboardBasename';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

/**
 * Returns the Dashboard router.
 * As dashboard is only accessible to authenticated user, this hook
 * is also in charge to redirect user to the root of the site if user
 * is anonymous.
 */
const useDashboardRouter = () => {
  const intl = useIntl();
  return createBrowserRouter(getDashboardRoutes(), { basename: getDashboardBasename(intl.locale) });
};

/**
 * Wrapper for `useNavigate` to avoid repetitive hooks calls.
 */
export const useDashboardNavigate = () => {
  const navigate = useNavigate();

  return useMemo(
    () =>
      <Path extends LearnerDashboardPaths | TeacherDashboardPaths>(
        to: number | Path,
        params?: Parameters<typeof generatePath<Path>>[1],
        routerOptions?: NavigateOptions,
      ) => {
        if (typeof to === 'number') {
          return navigate(to);
        }
        return navigate(generatePath(to, params), routerOptions);
      },
    [],
  );
};

export default useDashboardRouter;
