import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';

interface GetMenuRoutesArgs {
  offeringId?: string;
  organizationId?: string;
}

export const getMenuRoutes = ({ offeringId, organizationId }: GetMenuRoutesArgs) => {
  if (organizationId) {
    if (offeringId) {
      return [
        TeacherDashboardPaths.ORGANIZATION_PRODUCT,
        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
        TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST,
      ];
    }
    return [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION];
  }

  if (offeringId) {
    return [
      TeacherDashboardPaths.COURSE_PRODUCT,
      TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS,
      TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST,
    ];
  }
  return [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION];
};
