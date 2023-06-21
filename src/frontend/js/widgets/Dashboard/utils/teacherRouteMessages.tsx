import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum TeacherDashboardPaths {
  ROOT = '/teacher',
  TEACHER_COURSES = '/teacher/courses',
  ORGANIZATION = '/teacher/organization/{organizationId}',
  ORGANIZATION_COURSES = '/teacher/organization/{organizationId}/courses',
  COURSE = '/teacher/courses/{courseId}',
  COURSE_GENERAL_INFORMATIONS = '/teacher/courses/{courseId}/informations',
  COURSE_PRODUCT = '/teacher/courses/{courseId}/product/{courseProductRelationId}',
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
    defaultMessage: '/teacher/organization/{organizationId}',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.path',
    description: 'The path to display the organization courses view.',
    defaultMessage: '/teacher/organization/{organizationId}/courses',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.path',
    description: 'The path to display the course view.',
    defaultMessage: '/teacher/courses/{courseId}',
  },
  [TeacherDashboardPaths.COURSE_GENERAL_INFORMATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.generalInformations.path',
    description: 'The path to display the course general informations view.',
    defaultMessage: '/teacher/courses/{courseId}/informations',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.path',
    description: 'The path to display the product view.',
    defaultMessage: '/teacher/courses/{courseId}/product/{courseProductRelationId}',
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
    defaultMessage: 'Dummy Organization',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.label',
    description: 'Label of the organization courses view.',
    defaultMessage: 'Courses',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.label',
    description: 'Label of the course root view.',
    defaultMessage: '{courseTitle}',
  },
  [TeacherDashboardPaths.COURSE_GENERAL_INFORMATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.generalInformations.label',
    description: 'Label of the course general information view.',
    defaultMessage: 'General informations',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.label',
    description: 'Label of the product view.',
    defaultMessage: 'Training',
  },
});
