import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum TeacherDashboardPaths {
  ROOT = '/teacher',
  TEACHER_PROFILE = '/teacher/profile',
  TEACHER_COURSES = '/teacher/profile/courses',
  TEACHER_SETTING = '/teacher/profile/settings',
  TEACHER_NOTIFICATIONS = '/teacher/profile/notifications',
  UNIVERSITY = '/teacher/university/{universityId}',
  UNIVERSITY_COURSES = '/teacher/university/{universityId}/courses',
  UNIVERSITY_SETTINGS = '/teacher/university/{universityId}/settings',
  UNIVERSITY_MEMBERS = '/teacher/university/{universityId}/members',
  COURSE = '/teacher/course',
  COURSE_SETTINGS = '/teacher/course/{courseCode}/settings',
  COURSE_CLASSROOMS = '/teacher/course/{courseCode}/classrooms',
  COURSE_RECORDS_APPLICATIONS = '/teacher/course/{courseCode}/records/applications',
  COURSE_RECORDS_FINANCE = '/teacher/course/{courseCode}/records/finance',
}

// Translations of dashboard route paths
export const teacherDashboardRoutePaths = defineMessages<TeacherDashboardPaths>({
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
  [TeacherDashboardPaths.TEACHER_SETTING]: {
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
  [TeacherDashboardPaths.UNIVERSITY]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.path',
    description: 'The path to display the university view.',
    defaultMessage: '/teacher/university/{universityId}',
  },
  [TeacherDashboardPaths.UNIVERSITY_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.settings.path',
    description: 'The path to display the university settings view.',
    defaultMessage: '/teacher/university/{universityId}/settings',
  },
  [TeacherDashboardPaths.UNIVERSITY_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.courses.path',
    description: 'The path to display the university courses view.',
    defaultMessage: '/teacher/university/{universityId}/courses',
  },
  [TeacherDashboardPaths.UNIVERSITY_MEMBERS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.members.path',
    description: 'The path to display the unisersity members view.',
    defaultMessage: '/teacher/university/{universityId}/members',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.path',
    description: 'The path to display the course view.',
    defaultMessage: '/teacher/course/{courseCode}',
  },
  [TeacherDashboardPaths.COURSE_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.settings.path',
    description: 'The path to display the course settings view.',
    defaultMessage: '/teacher/course/{courseCode}/settings',
  },
  [TeacherDashboardPaths.COURSE_CLASSROOMS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.classroom.path',
    description: 'The path to display the course classroom view.',
    defaultMessage: '/teacher/course/{courseCode}/classrooms',
  },
  [TeacherDashboardPaths.COURSE_RECORDS_APPLICATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.applications.path',
    description: "The path to display the course's application records view.",
    defaultMessage: '/teacher/course/{courseCode}/records/applications',
  },
  [TeacherDashboardPaths.COURSE_RECORDS_FINANCE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.finance.path',
    description: "The path to display the course's contract and finance records view.",
    defaultMessage: '/teacher/course/{courseCode}/records/finance',
  },
});

// Translations of dashboard route labels
export const teacherDashboardRouteLabels = defineMessages<TeacherDashboardPaths>({
  [TeacherDashboardPaths.ROOT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.root.label',
    description: 'Label of the teacher dashboard root view.',
    defaultMessage: 'My teacher dashboard',
  },
  [TeacherDashboardPaths.TEACHER_PROFILE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.label',
    description: 'Label of the teacher profile view.',
    defaultMessage: 'My profile',
  },
  [TeacherDashboardPaths.TEACHER_SETTING]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.settings.label',
    description: 'Label of the teacher profile settings view.',
    defaultMessage: 'Settings',
  },
  [TeacherDashboardPaths.TEACHER_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.courses.label',
    description: 'Label of the teacher courses liste view.',
    defaultMessage: 'Manage my courses',
  },
  [TeacherDashboardPaths.TEACHER_NOTIFICATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.profile.notifications.label',
    description: 'Label of the teacher notifications view.',
    defaultMessage: 'My notifications',
  },
  [TeacherDashboardPaths.UNIVERSITY]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.label',
    description: 'Label of the university view.',
    defaultMessage: 'University settings',
  },
  [TeacherDashboardPaths.UNIVERSITY_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.settings.label',
    description: 'Label of the university settings view.',
    defaultMessage: 'University settings',
  },
  [TeacherDashboardPaths.UNIVERSITY_COURSES]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.courses.label',
    description: 'Label of the university courses view.',
    defaultMessage: 'University courses',
  },
  [TeacherDashboardPaths.UNIVERSITY_MEMBERS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.university.members.label',
    description: 'Label of the unisersity members view.',
    defaultMessage: 'University members',
  },
  [TeacherDashboardPaths.COURSE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.label',
    description: 'Label of the course view.',
    defaultMessage: 'Course settings',
  },
  [TeacherDashboardPaths.COURSE_SETTINGS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.settings.label',
    description: 'Label of the course settings view.',
    defaultMessage: 'Course settings',
  },
  [TeacherDashboardPaths.COURSE_CLASSROOMS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.classroom.label',
    description: 'Label of the course classroom view.',
    defaultMessage: 'Course classroom',
  },
  [TeacherDashboardPaths.COURSE_RECORDS_APPLICATIONS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.applications.label',
    description: "Label of the course's application records view.",
    defaultMessage: "Course's application records",
  },
  [TeacherDashboardPaths.COURSE_RECORDS_FINANCE]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.records.finance.label',
    description: "Label of the course's contract and finance records view.",
    defaultMessage: "Course's contract and finance records",
  },
});
