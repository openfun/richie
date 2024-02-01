import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';

interface GetMenuRoutesArgs {
  courseProductRelationId?: string;
  organizationId?: string;
}

export const getMenuRoutes = ({ courseProductRelationId, organizationId }: GetMenuRoutesArgs) => {
  if (organizationId) {
    if (courseProductRelationId) {
      return [
        TeacherDashboardPaths.ORGANIZATION_PRODUCT,
        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
      ];
    }
    return [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION];
  }

  if (courseProductRelationId) {
    return [TeacherDashboardPaths.COURSE_PRODUCT, TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS];
  }
  return [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION];
};
