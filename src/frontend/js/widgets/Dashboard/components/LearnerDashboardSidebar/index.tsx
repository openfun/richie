import { defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import { useSession } from 'contexts/SessionContext';

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
  const { user } = useSession();

  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () =>
      [
        LearnerDashboardPaths.COURSES,
        LearnerDashboardPaths.PREFERENCES,
        LearnerDashboardPaths.CERTIFICATES,
      ].map((path) => ({
        to: getRoutePath(path),
        label: getRouteLabel(path),
      })),
    [],
  );
  return (
    <DashboardSidebar
      menuLinks={links}
      header={intl.formatMessage(messages.header, { name: user?.username })}
      subHeader={intl.formatMessage(messages.subHeader)}
    />
  );
};
