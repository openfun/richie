import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { defineMessages, IntlShape } from 'react-intl';

/**
 * All existing dashboard paths.
 */
export enum DashboardPaths {
  COURSES = '/courses',
  ORDER = '/courses/orders/:code',
  COURSE = '/courses/:code',
  PREFERENCES = '/preferences',
  PREFERENCES_ADDRESS_EDITION = '/preferences/addresses/:addressId',
  PREFERENCES_ADDRESS_CREATION = '/preferences/addresses/create',
  PREFERENCES_CREDIT_CARD_EDITION = '/preferences/credit-cards/:creditCardId',
}

// Translations of dashboard route paths
const dashboardRoutePaths = defineMessages<DashboardPaths>({
  [DashboardPaths.COURSES]: {
    id: 'components.Dashboard.DashboardRoutes.courses.path',
    description: 'The path to display the courses view.',
    defaultMessage: '/courses',
  },
  [DashboardPaths.ORDER]: {
    id: 'components.Dashboard.DashboardRoutes.order.path',
    description: 'The path to display an order detail view.',
    defaultMessage: '/courses/orders/{orderId}',
  },
  [DashboardPaths.COURSE]: {
    id: 'components.Dashboard.DashboardRoutes.course.path',
    description: 'The path to display a course detail view.',
    defaultMessage: '/courses/{code}',
  },
  [DashboardPaths.PREFERENCES]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.path',
    description: 'The path to display the preferences view.',
    defaultMessage: '/preferences',
  },
  [DashboardPaths.PREFERENCES_ADDRESS_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.edition.path',
    description: 'The path to display the addresses edition view.',
    defaultMessage: '/preferences/addresses/{addressId}',
  },
  [DashboardPaths.PREFERENCES_ADDRESS_CREATION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.creation.path',
    description: 'The path to display the addresses creation view.',
    defaultMessage: '/preferences/addresses/create',
  },
  [DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.creditCards.edition.path',
    description: 'The path to display the credit cards edition view.',
    defaultMessage: '/preferences/credit-cards/{creditCardId}',
  },
});

// Translations of dashboard route labels
export const dashboardRouteLabels = defineMessages<DashboardPaths>({
  [DashboardPaths.COURSES]: {
    id: 'components.Dashboard.DashboardRoutes.courses.label',
    description: 'Label of the courses view used in navigation components.',
    defaultMessage: 'My courses',
  },
  [DashboardPaths.ORDER]: {
    id: 'components.Dashboard.DashboardRoutes.order.label',
    description: 'Label of the order view used in navigation components.',
    defaultMessage: 'Order details "{orderTitle}"',
  },
  [DashboardPaths.COURSE]: {
    id: 'components.Dashboard.DashboardRoutes.course.session.label',
    description: 'Label of the course session view used in navigation components.',
    defaultMessage: 'Course',
  },
  [DashboardPaths.PREFERENCES]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.label',
    description: 'Label of the preferences view used in navigation components.',
    defaultMessage: 'My preferences',
  },
  [DashboardPaths.PREFERENCES_ADDRESS_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.edition.label',
    description: 'Label of the addresses edition view.',
    defaultMessage: 'Edit address "{addressTitle}"',
  },
  [DashboardPaths.PREFERENCES_ADDRESS_CREATION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.addresses.creation.label',
    description: 'Label of the addresses creation view.',
    defaultMessage: 'Create address',
  },
  [DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION]: {
    id: 'components.Dashboard.DashboardRoutes.preferences.creditCards.label',
    description: 'Label of the credit cards edition view.',
    defaultMessage: 'Edit credit card "{creditCardTitle}"',
  },
});

/**
 * Use `intl.formatMessage` to retrieve a path or label of a given route for the active locale.
 *
 * Currying function which takes first the type of attribute to translate (path or label)
 * then takes the intl object retrieved from the IntlProvider.
 * Finally, it takes a path and options to pass to `intl.formatMessage` method
 */

enum RouteAttributes {
  PATH = 'path',
  LABEL = 'label',
}

const getDashboardRouteAttribute =
  (attribute: RouteAttributes) =>
  (intl: IntlShape) =>
  (
    path: DashboardPaths,
    ...options: [
      values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
      opts?: IntlMessageFormatOptions,
    ]
  ) => {
    const messages =
      attribute === RouteAttributes.LABEL ? dashboardRouteLabels : dashboardRoutePaths;
    return intl.formatMessage(messages[path], ...options);
  };

/** Get the provided dashboard route label in the active locale */
export const getDashboardRouteLabel = getDashboardRouteAttribute(RouteAttributes.LABEL);

/** Get the provided dashboard route path in the active locale */
export const getDashboardRoutePath = getDashboardRouteAttribute(RouteAttributes.PATH);

/** Type guard to detect if a path is a dashboard path */
export const isIntlPath = (path: string): path is DashboardPaths => path in dashboardRoutePaths;
