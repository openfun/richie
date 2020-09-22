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
  username: faker.internet.email(),
});

export const CommonDataPropsFactory = (props: Partial<CommonDataProps> = {}) => ({
  assets: {
    icons: '/icons.svg',
  },
  csrftoken: 'the csrf token',
  environment: 'frontend_tests',
  release: '9.8.7',
  sentry_dsn: null,
  redirect_whitelist: [],
  ...props,
});
