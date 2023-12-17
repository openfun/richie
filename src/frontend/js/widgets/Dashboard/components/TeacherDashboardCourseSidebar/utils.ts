import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';

interface GetMenuRoutesArgs {
  courseProductRelationId?: string;
  organizationId?: string;
}
export const getMenuRoutes = ({ courseProductRelationId, organizationId }: GetMenuRoutesArgs) => {
  if (organizationId) {
    if (courseProductRelationId) {
      return [TeacherDashboardPaths.ORGANIZATION_PRODUCT];
    }
    return [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION];
  }

  if (courseProductRelationId) {
    return [TeacherDashboardPaths.COURSE_PRODUCT];
  }
  return [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION];
};
