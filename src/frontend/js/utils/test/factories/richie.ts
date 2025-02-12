import { faker } from '@faker-js/faker';
import { User } from 'types/User';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import {
  CourseRun,
  CourseRunDisplayMode,
  CourseState,
  CourseStateTextEnum,
  PacedCourse,
  Priority,
} from 'types';
import { Course } from 'types/Course';
import { FactoryHelper } from 'utils/test/factories/helper';
import { factory } from './factories';

/**
 * mapping between priority and text
 * | Priority | Text |
 * | ----------- | ----------- |
 * |ONGOING_OPEN        | ENROLLMENT_OPENED|
 * |FUTURE_OPEN         | STARTING_ON|
 * |ARCHIVED_OPEN       | ENROLLMENT_OPENED|
 * |FUTURE_NOT_YET_OPEN | STARTING_ON|
 * |FUTURE_CLOSED       | ENROLLMENT_CLOSED|
 * |ONGOING_CLOSED      | ON_GOING|
 * |ARCHIVED_CLOSED     | ARCHIVED|
 * |TO_BE_SCHEDULED     | TO_BE_SCHEDULED|
 */
export const CourseStateFactory = factory<CourseState>(() => {
  return {
    priority: Priority.ONGOING_OPEN,
    datetime: faker.date.past().toISOString(),
    call_to_action: 'enroll now',
    text: CourseStateTextEnum.ENROLLMENT_OPENED,
  };
});

export const CourseStateFutureOpenFactory = factory<CourseState>(() => {
  return {
    priority: Priority.FUTURE_OPEN,
    datetime: faker.date.future().toISOString(),
    call_to_action: undefined,
    text: CourseStateTextEnum.STARTING_ON,
  };
});

enum OfferType {
  PAID = 'PAID',
  FREE = 'FREE',
  PARTIALLY_FREE = 'PARTIALLY_FREE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export const CourseRunFactory = factory<CourseRun>(() => {
  const offerValues = Object.values(OfferType);
  const offer = offerValues[Math.floor(Math.random() * offerValues.length)];
  const certificateOfferValues = [OfferType.PAID, OfferType.FREE, OfferType.SUBSCRIPTION];
  const certificateOffer =
    certificateOfferValues[Math.floor(Math.random() * certificateOfferValues.length)];
  const currency = faker.finance.currency().code;
  const price = [OfferType.FREE, OfferType.PARTIALLY_FREE].includes(offer)
    ? 0
    : parseFloat(faker.finance.amount({ min: 1, max: 100, symbol: currency, autoFormat: true }));
  const certificatePrice =
    certificateOffer === OfferType.FREE
      ? 0
      : parseFloat(faker.finance.amount({ min: 1, max: 100, symbol: currency, autoFormat: true }));
  return {
    id: faker.number.int(),
    resource_link: FactoryHelper.unique(faker.internet.url),
    start: faker.date.past().toISOString(),
    end: faker.date.past().toISOString(),
    enrollment_start: faker.date.past().toISOString(),
    enrollment_end: faker.date.past().toISOString(),
    languages: [faker.location.countryCode('alpha-2')],
    state: CourseStateFactory().one(),
    dashboard_link: null,
    title: faker.lorem.sentence(3),
    display_mode: CourseRunDisplayMode.DETAILED,
    price,
    price_currency: currency,
    offer,
    certificate_price: certificatePrice,
    certificate_offer: certificateOffer,
  };
});

export const PacedCourseFactory = factory((): PacedCourse => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    is_self_paced: false,
  };
});

export const CourseRunFactoryFromPriority = (priority: Priority) => {
  return factory<CourseRun>(() => {
    let courseRun = CourseRunFactory().one();
    switch (priority) {
      case Priority.ONGOING_OPEN:
        courseRun = {
          ...courseRun,
          start: faker.date.past().toISOString(),
          end: faker.date.future().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.future().toISOString(),
        };
        break;
      case Priority.ONGOING_CLOSED:
        courseRun = {
          ...courseRun,
          start: faker.date.past().toISOString(),
          end: faker.date.future().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.past().toISOString(),
        };
        break;
      case Priority.ARCHIVED_OPEN:
        courseRun = {
          ...courseRun,
          start: faker.date.past().toISOString(),
          end: faker.date.past().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.future().toISOString(),
        };
        break;
      case Priority.ARCHIVED_CLOSED:
        courseRun = {
          ...courseRun,
          start: faker.date.past().toISOString(),
          end: faker.date.past().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.past().toISOString(),
        };
        break;
      case Priority.FUTURE_NOT_YET_OPEN:
        courseRun = {
          ...courseRun,
          start: faker.date.future().toISOString(),
          end: faker.date.future().toISOString(),
          enrollment_start: faker.date.future().toISOString(),
          enrollment_end: faker.date.future().toISOString(),
        };
        break;
      case Priority.FUTURE_OPEN:
        courseRun = {
          ...courseRun,
          start: faker.date.future().toISOString(),
          end: faker.date.future().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.future().toISOString(),
        };
        break;
      case Priority.FUTURE_CLOSED:
        courseRun = {
          ...courseRun,
          start: faker.date.future().toISOString(),
          end: faker.date.future().toISOString(),
          enrollment_start: faker.date.past().toISOString(),
          enrollment_end: faker.date.past().toISOString(),
        };
        break;
      case Priority.TO_BE_SCHEDULED:
        courseRun = {
          ...courseRun,
          start: undefined,
          end: faker.date.future().toISOString(),
          enrollment_start: undefined,
          enrollment_end: faker.date.past().toISOString(),
        } as unknown as CourseRun;
        break;
    }
    return courseRun;
  });
};

export const UserFactory = factory<User>(() => ({
  access_token: faker.lorem.word(12),
  full_name: faker.person.fullName(),
  email: faker.internet.email(),
  username: faker.internet.username(),
}));

export const FonzieUserFactory = factory<User>(() => ({
  ...UserFactory().one(),
  access_token: btoa(faker.string.uuid()),
}));

export const RichieContextFactory = factory<CommonDataProps['context']>(() => ({
  authentication: {
    backend: APIBackend.OPENEDX_HAWTHORN,
    endpoint: 'https://endpoint.test',
  },
  environment: 'test',
  features: {},
  lms_backends: [
    {
      backend: APIBackend.DUMMY,
      course_regexp: '.*',
      endpoint: 'https://endpoint.test',
    },
  ],
  release: faker.system.semver(),
  sentry_dsn: null,
  web_analytics_providers: null,
  site_urls: {
    terms_and_conditions: null,
  },
}));

export const CourseLightFactory = factory<Course>(() => {
  const organizationName = FactoryHelper.sequence((counter) => `Organization ${counter}`);
  return {
    id: faker.string.uuid(),
    absolute_url: '',
    categories: [],
    code: faker.string.alphanumeric(5),
    cover_image: {
      sizes: '300px',
      src: '/static/course_cover_image.jpg',
      srcset: '/static/course_cover_image.jpg',
    },
    title: faker.word.words(Math.ceil(Math.random() * 10)),
    duration: '',
    effort: '',
    icon: {
      color: 'blue',
      sizes: '60px',
      src: '/static/course_icon.png',
      srcset: '/static/course_icon.png',
      title: 'Certifiant',
    },
    organization_highlighted: organizationName,
    organization_highlighted_cover_image: {
      sizes: '100vh',
      src: '/static/organization_cover_image.png',
      srcset: '/static/organization_cover_image.png',
    },
    organizations: [organizationName],
    state: CourseStateFactory().one(),
  };
});
