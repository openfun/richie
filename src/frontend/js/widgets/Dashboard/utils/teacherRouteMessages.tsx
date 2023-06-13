import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum TeacherDashboardPaths {
  ROOT = '/teacher',
  TEACHER_PROFILE = '/teacher/profile',
  TEACHER_COURSES = '/teacher/profile/courses',
  TEACHER_SETTINGS = '/teacher/profile/settings',
  TEACHER_NOTIFICATIONS = '/teacher/profile/notifications',
  ORGANIZATION = '/teacher/organization/{organizationId}',
  ORGANIZATION_COURSES = '/teacher/organization/{organizationId}/courses',
  ORGANIZATION_SETTINGS = '/teacher/organization/{organizationId}/settings',
  ORGANIZATION_MEMBERS = '/teacher/organization/{organizationId}/members',
  COURSE = '/teacher/course/{courseId}',
  COURSE_PRODUCT = '/teacher/course/{courseId}/product/{courseProductRelationId}',
  COURSE_SETTINGS = '/teacher/course/{courseId}/settings',
  COURSE_CLASSROOMS = '/teacher/course/{courseId}/classrooms',
  COURSE_STUDENTS = '/teacher/course/{courseId}/students',
  COURSE_RECORDS = '/teacher/course/{courseId}/records',
}

// Translations of dashboard route paths
export const TEACHER_DASHBOARD_ROUTE_PATHS = defineMessages<TeacherDashboardPaths>({
  [TeacherDashboardPaths.ROOT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.root.path',
    description: 'The path to display the teacher dashboard root view.',
    defaultMessage: '/teacher',
  },
  [TeacherDashboardPaths.TEACHER_PROFILE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.path',
    description: 'The path to display the teacher profile view.',
    defaultMessage: '/teacher/profile',
  },
  [TeacherDashboardPaths.TEACHER_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.settings.path',
    description: 'The path to display the teacher profile settings view.',
    defaultMessage: '/teacher/profile/settings',
  },
  [TeacherDashboardPaths.TEACHER_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.courses.path',
    description: 'The path to display the teacher courses liste view.',
    defaultMessage: '/teacher/profile/courses',
  },
  [TeacherDashboardPaths.TEACHER_NOTIFICATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.notifications.path',
    description: 'The path to display the teacher notifications view.',
    defaultMessage: '/teacher/profile/notifications',
  },
  [TeacherDashboardPaths.ORGANIZATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.path',
    description: 'The path to display the organization view.',
    defaultMessage: '/teacher/organization/{organizationId}',
  },
  [TeacherDashboardPaths.ORGANIZATION_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.settings.path',
    description: 'The path to display the organization settings view.',
    defaultMessage: '/teacher/organization/{organizationId}/settings',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.path',
    description: 'The path to display the organization courses view.',
    defaultMessage: '/teacher/organization/{organizationId}/courses',
  },
  [TeacherDashboardPaths.ORGANIZATION_MEMBERS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.members.path',
    description: 'The path to display the unisersity members view.',
    defaultMessage: '/teacher/organization/{organizationId}/members',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.path',
    description: 'The path to display the course view.',
    defaultMessage: '/teacher/course/{courseId}',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.path',
    description: 'The path to display the product view.',
    defaultMessage: '/teacher/course/{courseId}/product/{courseProductRelationId}',
  },
  [TeacherDashboardPaths.COURSE_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.settings.path',
    description: 'The path to display the course settings view.',
    defaultMessage: '/teacher/course/{courseId}/settings',
  },
  [TeacherDashboardPaths.COURSE_CLASSROOMS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.classrooms.path',
    description: 'The path to display the course classrooms view.',
    defaultMessage: '/teacher/course/{courseId}/classrooms',
  },
  [TeacherDashboardPaths.COURSE_STUDENTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.students.path',
    description: 'The path to display the course students view.',
    defaultMessage: '/teacher/course/{courseId}/students',
  },
  [TeacherDashboardPaths.COURSE_RECORDS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.path',
    description: "The path to display the course's records view.",
    defaultMessage: '/teacher/course/{courseId}/records',
  },
});

// Translations of dashboard route labels
export const TEACHER_DASHBOARD_ROUTE_LABELS = defineMessages<TeacherDashboardPaths>({
  [TeacherDashboardPaths.ROOT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.root.label',
    description: 'Label of the teacher dashboard root view.',
    defaultMessage: 'Teacher dashboard',
  },
  [TeacherDashboardPaths.TEACHER_PROFILE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.label',
    description: 'Label of the teacher profile view.',
    defaultMessage: 'Profile',
  },
  [TeacherDashboardPaths.TEACHER_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.settings.label',
    description: 'Label of the teacher profile settings view.',
    defaultMessage: 'Settings',
  },
  [TeacherDashboardPaths.TEACHER_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.courses.label',
    description: 'Label of the teacher courses liste view.',
    defaultMessage: 'All my courses',
  },
  [TeacherDashboardPaths.TEACHER_NOTIFICATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.notifications.label',
    description: 'Label of the teacher notifications view.',
    defaultMessage: 'Notifications',
  },
  [TeacherDashboardPaths.ORGANIZATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.label',
    description: 'Label of the organization view.',
    defaultMessage: 'General informations',
  },
  [TeacherDashboardPaths.ORGANIZATION_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.settings.label',
    description: 'Label of the organization settings view.',
    defaultMessage: 'Settings',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.courses.label',
    description: 'Label of the organization courses view.',
    defaultMessage: 'Courses',
  },
  [TeacherDashboardPaths.ORGANIZATION_MEMBERS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.members.label',
    description: 'Label of the unisersity members view.',
    defaultMessage: 'Members',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.label',
    description: 'Label of the course view.',
    defaultMessage: 'General informations',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.label',
    description: 'Label of the product view.',
    defaultMessage: 'Training',
  },
  [TeacherDashboardPaths.COURSE_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.settings.label',
    description: 'Label of the course settings view.',
    defaultMessage: 'Settings',
  },
  [TeacherDashboardPaths.COURSE_CLASSROOMS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.classrooms.label',
    description: 'Label of the course classrooms view.',
    defaultMessage: 'Classrooms',
  },
  [TeacherDashboardPaths.COURSE_STUDENTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.students.label',
    description: 'Label of the course students view.',
    defaultMessage: 'Students',
  },
  [TeacherDashboardPaths.COURSE_RECORDS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.label',
    description: "Label of the course's records view.",
    defaultMessage: 'Records',
  },
});
