import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';

interface GetMenuRoutesArgs {
  offerId?: string;
  organizationId?: string;
}

export const getMenuRoutes = ({ offerId, organizationId }: GetMenuRoutesArgs) => {
  if (organizationId) {
    if (offerId) {
      return [
        TeacherDashboardPaths.ORGANIZATION_PRODUCT,
        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
        TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST,
      ];
    }
    return [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION];
  }

  if (offerId) {
    return [
      TeacherDashboardPaths.COURSE_PRODUCT,
      TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS,
      TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST,
    ];
  }
  return [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION];
};
