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
import { UserHelper } from 'utils/UserHelper';
import OrganizationLinks from './components/OrganizationLinks';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherDashboardProfileSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on your teacher dashboard',
  },
});

export const TeacherDashboardProfileSidebar = () => {
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
      header={user ? UserHelper.getName(user) : ''}
      subHeader={intl.formatMessage(messages.subHeader)}
    >
      {organizations.length > 0 && <OrganizationLinks organizations={organizations} />}
    </DashboardSidebar>
  );
};
