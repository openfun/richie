import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum TeacherDashboardPaths {
  ROOT = '/teacher',
  TEACHER_COURSES = '/teacher/courses',
  ORGANIZATION = '/teacher/organizations/{organizationId}',
  ORGANIZATION_COURSES = '/teacher/organizations/{organizationId}/courses',
  ORGANIZATION_COURSE_GENERAL_INFORMATION = '/teacher/organizations/{organizationId}/courses/{courseId}/information',
  ORGANIZATION_PRODUCT = '/teacher/organizations/{organizationId}/courses/{courseId}/products/{courseProductRelationId}',
  COURSE = '/teacher/courses/{courseId}',
  COURSE_GENERAL_INFORMATION = '/teacher/courses/{courseId}/information',
  COURSE_PRODUCT = '/teacer/courses/{courseId}/products/{courseProductRelationId}',
}

// Translations of dashboard route paths
export const TEACHER_DASHBOARD_ROUTE_PATHS = defineMessages<TeacherDashboardPaths>({
  [TeacherDashboardPaths.ROOT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.root.path',
    description: 'The path to display the teacher dashboard root view.',
    defaultMessage: '/teacher',
  },
  [TeacherDashboardPaths.TEACHER_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.courses.path',
    description: 'The path to display the teacher courses liste view.',
    defaultMessage: '/teacher/courses',
  },
  [TeacherDashboardPaths.ORGANIZATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.path',
    description: 'The path to display the organization view.',
    defaultMessage: '/teacher/organizations/{organizationId}',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.path',
    description: 'The path to display the organization courses view.',
    defaultMessage: '/teacher/organizations/{organizationId}/courses',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.generalInformation.path',
    description: 'The path to display the organization course general information view.',
    defaultMessage: '/teacher/organizations/{organizationId}/courses/{courseId}/information',
  },
  [TeacherDashboardPaths.ORGANIZATION_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.product.path',
    description: 'The path to display the organization product view.',
    defaultMessage:
      '/teacher/organizations/{organizationId}/courses/{courseId}/products/{courseProductRelationId}',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.path',
    description: 'The path to display the course view.',
    defaultMessage: '/teacher/courses/{courseId}',
  },
  [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.generalInformation.path',
    description: 'The path to display the course general information view.',
    defaultMessage: '/teacher/courses/{courseId}/information',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.path',
    description: 'The path to display the product view.',
    defaultMessage: '/teacher/courses/{courseId}/products/{courseProductRelationId}',
  },
});

// Translations of dashboard route labels
export const TEACHER_DASHBOARD_ROUTE_LABELS = defineMessages<TeacherDashboardPaths>({
  [TeacherDashboardPaths.ROOT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.root.label',
    description: 'Label of the teacher dashboard root view.',
    defaultMessage: 'Teacher dashboard',
  },
  [TeacherDashboardPaths.TEACHER_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.courses.label',
    description: 'Label of the teacher courses liste view.',
    defaultMessage: 'All my courses',
  },
  [TeacherDashboardPaths.ORGANIZATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.label',
    description: 'Label of the organization view.',
    defaultMessage: '{organizationTitle}',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.label',
    description: 'Label of the organization courses view.',
    defaultMessage: 'Courses',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.generalInformation.label',
    description: 'Label of the organization course general information view.',
    defaultMessage: 'General information',
  },
  [TeacherDashboardPaths.ORGANIZATION_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.product.label',
    description: 'Label of the organization product view.',
    defaultMessage: 'Training',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.label',
    description: 'Label of the course root view.',
    defaultMessage: '{courseTitle}',
  },
  [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.generalInformation.label',
    description: 'Label of the course general information view.',
    defaultMessage: 'General information',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.label',
    description: 'Label of the product view.',
    defaultMessage: 'Training',
  },
});
