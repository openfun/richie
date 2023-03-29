import { compose, createSpec, derived, faker } from '@helpscout/helix';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';

export const CourseStateFactory = createSpec({
  priority: derived(() => Math.floor(Math.random() * 7)),
  datetime: derived(() => faker.date.past()().toISOString()),
  call_to_action: faker.random.words(1, 3),
  text: faker.random.words(1, 3),
});

export const CourseRunFactory = createSpec({
  id: faker.datatype.number(),
  resource_link: faker.unique(faker.internet.url()),
  start: derived(() => faker.date.past()().toISOString()),
  end: derived(() => faker.date.past()().toISOString()),
  enrollment_start: derived(() => faker.date.past()().toISOString()),
  enrollment_end: derived(() => faker.date.past()().toISOString()),
  languages: faker.random.locale(),
  state: CourseStateFactory,
  starts_in_message: null,
});

export const EnrollmentFactory = createSpec({
  id: faker.datatype.number(),
  created_at: derived(() => faker.date.past()().toISOString()),
  user: faker.datatype.number(),
  course_run: faker.datatype.number(),
});

export const UserFactory = createSpec({
  full_name: faker.fake('{{name.firstName}} {{name.lastName}}'),
  username: faker.internet.userName(),
});

export const FonzieUserFactory = compose(
  UserFactory,
  createSpec({
    access_token: btoa(faker.datatype.uuid()),
  }),
);

export const RichieContextFactory = (context: Partial<CommonDataProps['context']> = {}) =>
  createSpec({
    csrftoken: faker.random.alphaNumeric(64),
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
    ...context,
    web_analytics_providers: derived(() => context.web_analytics_providers || null),
  });
