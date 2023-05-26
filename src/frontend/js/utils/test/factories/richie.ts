import { faker } from '@faker-js/faker';
import { User } from 'types/User';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseRun, CourseState, CourseStateTextEnum, Enrollment, Priority } from 'types';
import { Course } from 'types/Course';
import { factory } from './factories';

/**
 * mapping between priority and text
 * | Priority | Text |
 * | ----------- | ----------- |
 * |ONGOING_OPEN        | CLOSING_ON|
 * |FUTURE_OPEN         | STARTING_ON|
 * |ARCHIVED_OPEN       | CLOSING_ON|
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
    text: CourseStateTextEnum.CLOSING_ON,
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

export const CourseRunFactory = factory<CourseRun>(() => {
  return {
    id: faker.number.int(),
    resource_link: faker.helpers.unique(faker.internet.url),
    start: faker.date.past().toISOString(),
    end: faker.date.past().toISOString(),
    enrollment_start: faker.date.past().toISOString(),
    enrollment_end: faker.date.past().toISOString(),
    languages: [faker.location.countryCode('alpha-2')],
    state: CourseStateFactory().one(),
    starts_in_message: null,
    dashboard_link: null,
  };
});

export const EnrollmentFactory = factory<Enrollment>(() => {
  return {
    id: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    user: faker.string.uuid(),
    course_run: faker.string.uuid(),
  };
});

export const UserFactory = factory<User>(() => ({
  access_token: faker.lorem.word(12),
  fullname: faker.person.fullName(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
}));

export const FonzieUserFactory = factory<User>(() => ({
  ...UserFactory().one(),
  access_token: btoa(faker.string.uuid()),
}));

export const RichieContextFactory = factory<CommonDataProps['context']>(() => ({
  csrftoken: faker.string.alphanumeric(64),
  environment: 'test',
  authentication: {
    backend: APIBackend.OPENEDX_HAWTHORN,
    endpoint: 'https://endpoint.test',
  },
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
}));

export const CourseLightFactory = factory<Course>(() => {
  const organizationName = faker.helpers.unique(faker.lorem.words, [Math.ceil(Math.random() * 3)]);
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
