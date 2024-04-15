import { defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { generatePath } from 'react-router-dom';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import {
  DashboardSidebar,
  DashboardSidebarProps,
} from 'widgets/Dashboard/components/DashboardSidebar';
import { useSession } from 'contexts/SessionContext';
import { UserHelper } from 'utils/UserHelper';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

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

export const LearnerDashboardSidebar = (props: Partial<DashboardSidebarProps>) => {
  const intl = useIntl();
  const { user } = useSession();

  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () =>
      [
        LearnerDashboardPaths.COURSES,
        LearnerDashboardPaths.CERTIFICATES,
        LearnerDashboardPaths.CONTRACTS,
        LearnerDashboardPaths.PREFERENCES,
      ].map((path) => ({
        to: generatePath(path),
        label: getRouteLabel(path),
        activePaths:
          path === LearnerDashboardPaths.CERTIFICATES
            ? [
                LearnerDashboardPaths.ORDER_CERTIFICATES,
                LearnerDashboardPaths.ENROLLMENT_CERTIFICATES,
              ]
            : undefined,
      })),
    [],
  );
  return (
    <DashboardSidebar
      menuLinks={links}
      header={intl.formatMessage(messages.header, { name: user ? UserHelper.getName(user) : '' })}
      subHeader={intl.formatMessage(messages.subHeader)}
      {...props}
    />
  );
};
