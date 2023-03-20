import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { useMemo } from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import { createBrowserRouter, NavigateOptions, useNavigate } from 'react-router-dom';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardRoutes, getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
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
  const getRoutePath = getDashboardRoutePath(useIntl());
  const navigate = useNavigate();
  return useMemo(
    () =>
      (
        to: number | LearnerDashboardPaths | TeacherDashboardPaths,
        values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
        options?: IntlMessageFormatOptions,
        routerOptions?: NavigateOptions,
      ) => {
        if (typeof to === 'number') {
          return navigate(to);
        }
        return navigate(getRoutePath(to, values, options), routerOptions);
      },
    [],
  );
};

export default useDashboardRouter;
