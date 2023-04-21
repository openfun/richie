import { defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherOrganizationDashboardSidebar.subHeader',
    description: 'Sub title of the organization dashboard sidebar',
    defaultMessage: 'You are on the organization dashboard',
  },
});

export const TeacherOrganizationDashboardSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const params = useParams();

  const links = useMemo(
    () =>
      [
        TeacherDashboardPaths.ORGANIZATION_COURSES,
        TeacherDashboardPaths.ORGANIZATION_MEMBERS,
        TeacherDashboardPaths.ORGANIZATION_SETTINGS,
      ].map((path) => ({
        to: generatePath(
          getRoutePath(path, {
            organizationId: ':organizationId',
          }),
          params,
        ),
        label: getRouteLabel(path),
      })),
    [],
  );

  return (
    <DashboardSidebar
      menuLinks={links}
      header="Dummy Organization"
      subHeader={intl.formatMessage(messages.subHeader)}
    />
  );
};
