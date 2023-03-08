import { defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouter';
import { DashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { getDashboardRouteLabel, getDashboardRoutePath } from 'widgets/Dashboard/utils/routers';

const messages = defineMessages({
  header: {
    id: 'components.TeacherProfileDashboardSidebar.header',
    description: 'Title of the dashboard sidebar',
    defaultMessage: '{name}',
  },
  subHeader: {
    id: 'components.TeacherProfileDashboardSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on your teacher dashboard',
  },
});

export const TeacherProfileDashboardSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () =>
      [TeacherDashboardPaths.TEACHER_COURSES, TeacherDashboardPaths.TEACHER_NOTIFICATIONS].map(
        (path) => ({
          to: getRoutePath(path),
          label: getRouteLabel(path),
        }),
      ),
    [],
  );
  const settingsUrl = getRoutePath(TeacherDashboardPaths.TEACHER_SETTING);

  return (
    <DashboardSidebar
      menuLinks={links}
      settingsUrl={settingsUrl}
      header={messages.header}
      subHeader={messages.subHeader}
    />
  );
};
