import { useIntl } from 'react-intl';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';

export const TeacherCoursesDashboardLoader = () => {
  const intl = useIntl();
  const getRouteLabel = getDashboardRouteLabel(intl);
  return (
    <DashboardLayout sidebar={<TeacherProfileDashboardSidebar />}>
      <RouteInfo title={getRouteLabel(TeacherDashboardPaths.TEACHER_NOTIFICATIONS)} />,
    </DashboardLayout>
  );
};
