import { defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouter';
import { DashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { getDashboardRouteLabel, getDashboardRoutePath } from 'widgets/Dashboard/utils/routers';

const messages = defineMessages({
  header: {
    id: 'components.TeacherProfileDashboardSidebar.header',
    description: 'Title of the dashboard sidebar',
    defaultMessage: 'TODO UNIVERSITY NAME',
  },
  subHeader: {
    id: 'components.TeacherProfileDashboardSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on the university dashboard',
  },
});

export const TeacherUniversityDashboardSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const params = useParams();

  const links = useMemo(
    () =>
      [TeacherDashboardPaths.UNIVERSITY_COURSES, TeacherDashboardPaths.UNIVERSITY_MEMBERS].map(
        (path) => ({
          to: generatePath(
            getRoutePath(path, {
              universityId: ':universityId',
            }),
            params,
          ),
          label: getRouteLabel(path),
        }),
      ),
    [],
  );
  const settingsUrl = generatePath(
    getRoutePath(TeacherDashboardPaths.UNIVERSITY_SETTINGS, {
      universityId: ':universityId',
    }),
    params,
  );

  return (
    <DashboardSidebar
      menuLinks={links}
      settingsUrl={settingsUrl}
      header={messages.header}
      subHeader={messages.subHeader}
    />
  );
};
