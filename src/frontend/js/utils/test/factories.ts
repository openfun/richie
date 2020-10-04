import { createSpec, derived, faker } from '@helpscout/helix';
import { CommonDataProps } from 'types/commonDataProps';

const CourseStateFactory = createSpec({
  priority: derived(() => Math.floor(Math.random() * 7)),
  datetime: derived(() => faker.date.past()().toISOString()),
  call_to_action: faker.random.words(1, 3),
  text: faker.random.words(1, 3),
});

export const CourseRunFactory = createSpec({
  id: faker.random.number(),
  resource_link: faker.internet.url(),
  start: derived(() => faker.date.past()().toISOString()),
  end: derived(() => faker.date.past()().toISOString()),
  enrollment_start: derived(() => faker.date.past()().toISOString()),
  enrollment_end: derived(() => faker.date.past()().toISOString()),
  languages: faker.random.locale(),
  state: CourseStateFactory,
});

export const EnrollmentFactory = createSpec({
  id: faker.random.number(),
  created_at: derived(() => faker.date.past()().toISOString()),
  user: faker.random.number(),
  course_run: faker.random.number(),
});

export const UserFactory = createSpec({
  full_name: faker.fake('{{name.firstName}} {{name.lastName}}'),
  username: faker.internet.userName(),
});

export const ContextFactory = (context: Partial<CommonDataProps['context']> = {}) => {
  return createSpec({
    auth_endpoint: 'https://endpoint.test',
    csrftoken: faker.random.alphaNumeric(64),
    environment: 'test',
    authentication: {
      backend: 'richie.apps.courses.lms.base.BaseLMSBackend',
      endpoint: 'https://endpoint.test',
    },
    lms_backends: [
      {
        backend: 'richie.apps.courses.lms.base.BaseLMSBackend',
        selector_regexp: '.*',
        course_regexp: '.*',
        endpoint: 'https://endpoint.test',
      },
    ],
    release: faker.system.semver(),
    sentry_dsn: null,
    ...context,
  });
};
