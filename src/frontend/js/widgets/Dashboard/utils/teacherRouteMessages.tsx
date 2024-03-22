import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum TeacherDashboardPaths {
  ROOT = '/teacher',
  TEACHER_COURSES = '/teacher/courses',
  ORGANIZATION = '/teacher/organizations/:organizationId',
  ORGANIZATION_CONTRACTS = '/teacher/organizations/:organizationId/contracts',
  ORGANIZATION_COURSES = '/teacher/organizations/:organizationId/courses',
  ORGANIZATION_PRODUCT = '/teacher/organizations/:organizationId/courses/:courseId/products/:courseProductRelationId',
  ORGANIZATION_COURSE_CONTRACTS = '/teacher/organizations/:organizationId/courses/:courseId/contracts',
  ORGANIZATION_PRODUCT_CONTRACTS = '/teacher/organizations/:organizationId/courses/:courseId/products/:courseProductRelationId/contracts',
  ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST = '/teacher/organizations/:organizationId/courses/:courseId/products/:courseProductRelationId/learners',
  ORGANIZATION_COURSE_GENERAL_INFORMATION = '/teacher/organizations/:organizationId/courses/:courseId/information',
  COURSE = '/teacher/courses/:courseId',
  COURSE_GENERAL_INFORMATION = '/teacher/courses/:courseId/information',
  COURSE_PRODUCT = '/teacher/courses/:courseId/products/:courseProductRelationId',
  COURSE_PRODUCT_LEARNER_LIST = '/teacher/courses/:courseId/products/:courseProductRelationId/learners',
  COURSE_CONTRACTS = '/teacher/courses/:courseId/contracts',
  COURSE_PRODUCT_CONTRACTS = '/teacher/courses/:courseId/products/:courseProductRelationId/contracts',
}

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
  [TeacherDashboardPaths.ORGANIZATION_CONTRACTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.contracts.label',
    description: 'Label of the organization contracts view.',
    defaultMessage: 'Contracts',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSE_CONTRACTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.contracts.label',
    description: "Label of the organization course's contracts view.",
    defaultMessage: 'Contracts',
  },
  [TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.product.contracts.label',
    description: "Label of the organization product's contracts view.",
    defaultMessage: 'Contracts',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.generalInformation.label',
    description: 'Label of the organization course general information view.',
    defaultMessage: 'General information',
  },
  [TeacherDashboardPaths.ORGANIZATION_PRODUCT]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.product.label',
    description: 'Label of the organization product view.',
    defaultMessage: 'General information',
  },
  [TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.organization.course.product.learnerList.label',
    description: "Label to display the organization product's learner list view.",
    defaultMessage: 'Learners',
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
    defaultMessage: 'General information',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.learnerList.label',
    description: "Label to display the product's learner list view.",
    defaultMessage: 'Learners',
  },
  [TeacherDashboardPaths.COURSE_CONTRACTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.contracts.label',
    description: 'Label of the course contracts view.',
    defaultMessage: 'Contracts',
  },
  [TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS]: {
    id: 'components.TeacherDashboard.TeacherDashboardRoutes.course.product.contracts.label',
    description: 'Label of the product contracts view.',
    defaultMessage: 'Contracts',
  },
});
