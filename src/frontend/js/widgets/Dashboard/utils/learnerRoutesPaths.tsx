import { defineMessages } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum LearnerDashboardPaths {
  COURSES = '/courses',
  ORDER = `${COURSES}/orders/:orderId`,
  ORDER_RUNS = `${ORDER}/runs`,
  COURSE = `${COURSES}/:code`,
  CERTIFICATES = '/certificates',
  ORDER_CERTIFICATES = '/certificates/order',
  ENROLLMENT_CERTIFICATES = '/certificates/enrollment',
  CONTRACTS = '/training-contracts',
  PREFERENCES = '/preferences',
  PREFERENCES_ADDRESS_EDITION = `${PREFERENCES}/addresses/:addressId`,
  PREFERENCES_ADDRESS_CREATION = `${PREFERENCES}/addresses/create`,
  PREFERENCES_CREDIT_CARD_EDITION = `${PREFERENCES}/credit-cards/:creditCardId`,
}

export const LEARNER_DASHBOARD_ROUTE_LABELS = defineMessages<LearnerDashboardPaths>({
  [LearnerDashboardPaths.COURSES]: {
    id: 'components.Dashboard.DashboardRoutes.courses.label',
    description: 'Label of the courses view used in navigation components.',
    defaultMessage: 'My courses',
  },
  [LearnerDashboardPaths.ORDER]: {
    id: 'components.Dashboard.DashboardRoutes.order.label',
    description: 'Label of the order view used in navigation components.',
    defaultMessage: '{orderTitle}',
  },
  [LearnerDashboardPaths.ORDER_RUNS]: {
    id: 'components.Dashboard.DashboardRoutes.order.runs.label',
    description: 'Label of the order runs view used in navigation components.',
    defaultMessage: 'General information',
  },
  [LearnerDashboardPaths.COURSE]: {
    id: 'components.Dashboard.DashboardRoutes.course.session.label',
    description: 'Label of the course session view used in navigation components.',
    defaultMessage: 'Course',
  },
  [LearnerDashboardPaths.CERTIFICATES]: {
    id: 'components.Dashboard.DashboardRoutes.certificates.label',
    description: 'Label of the certificates view used in navigation components.',
    defaultMessage: 'My certificates',
  },
  [LearnerDashboardPaths.ORDER_CERTIFICATES]: {
    id: 'components.Dashboard.DashboardRoutes.certificates.order.label',
    description: 'Label of the order certificates view used in navigation components.',
    defaultMessage: 'My certificates',
  },
  [LearnerDashboardPaths.ENROLLMENT_CERTIFICATES]: {
    id: 'components.Dashboard.DashboardRoutes.certificates.enrollment.label',
    description: 'Label of the enrollment certificates view used in navigation components.',
    defaultMessage: 'My attestations of achievement',
  },
  [LearnerDashboardPaths.CONTRACTS]: {
    id: 'components.Dashboard.DashboardRoutes.contracts.label',
    description: 'Label of the training contracts view used in navigation components.',
    defaultMessage: 'My training contracts',
  },
  [LearnerDashboardPaths.PREFERENCES]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.label',
    description: 'Label of the preferences view used in navigation components.',
    defaultMessage: 'My preferences',
  },
  [LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.edition.label',
    description: 'Label of the addresses edition view.',
    defaultMessage: 'Edit address "{addressTitle}"',
  },
  [LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.creation.label',
    description: 'Label of the addresses creation view.',
    defaultMessage: 'Create address',
  },
  [LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.creditCards.label',
    description: 'Label of the credit cards edition view.',
    defaultMessage: 'Edit credit card "{creditCardTitle}"',
  },
});
