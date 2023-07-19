import { defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { useSession } from 'contexts/SessionContext';
import { useOrganizations } from 'hooks/useOrganizations';
import OrganizationLinks from './components/OrganizationLinks';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherProfileDashboardSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on your teacher dashboard',
  },
});

export const TeacherProfileDashboardSidebar = () => {
  const intl = useIntl();
  const { user } = useSession();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const { items: organizations } = useOrganizations();

  const links = useMemo(
    () =>
      [TeacherDashboardPaths.TEACHER_COURSES].map((path) => ({
        to: getRoutePath(path),
        label: getRouteLabel(path),
      })),
    [],
  );

  return (
    <DashboardSidebar
      menuLinks={links}
      header={user?.username || ''}
      subHeader={intl.formatMessage(messages.subHeader)}
    >
      {organizations.length > 0 && <OrganizationLinks organizations={organizations} />}
    </DashboardSidebar>
  );
};
