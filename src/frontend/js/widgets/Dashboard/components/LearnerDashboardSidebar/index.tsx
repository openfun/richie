import { defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import {
  DashboardPaths,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/routers';
import { DashboardSidebar } from 'components/Dashboard/DashboardSidebar';

const messages = defineMessages({
  header: {
    id: 'components.StudentDashboardSidebar.header',
    description: 'Title of the dashboard sidebar',
    defaultMessage: 'Welcome {name}',
  },
  subHeader: {
    id: 'components.StudentDashboardSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on your dashboard',
  },
});

export const LearnerDashboardSidebar = () => {
  const intl = useIntl();

  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () =>
      [DashboardPaths.COURSES, DashboardPaths.PREFERENCES].map((path) => ({
        to: getRoutePath(path),
        label: getRouteLabel(path),
      })),
    [],
  );
  return (
    <DashboardSidebar menuLinks={links} header={messages.header} subHeader={messages.subHeader} />
  );
};
