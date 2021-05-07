import { createSpec, derived, faker } from '@helpscout/helix';
import { CommonDataProps } from 'types/commonDataProps';
import { APIBackend } from 'types/api';
import { DehydratedState } from 'react-query/types/hydration';
import { QueryState } from 'react-query/types/core/query';
import { MutationState } from 'react-query/types/core/mutation';
import { PersistedClient } from 'react-query/types/persistQueryClient-experimental';
import { MutationKey, QueryKey } from 'react-query';

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
  starts_in_message: null,
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

export const ContextFactory = (context: Partial<CommonDataProps['context']> = {}) =>
  createSpec({
    auth_endpoint: 'https://endpoint.test',
    csrftoken: faker.random.alphaNumeric(64),
    environment: 'test',
    authentication: {
      backend: APIBackend.BASE,
      endpoint: 'https://endpoint.test',
    },
    lms_backends: [
      {
        backend: APIBackend.BASE,
        course_regexp: '.*',
        endpoint: 'https://endpoint.test',
      },
    ],
    release: faker.system.semver(),
    sentry_dsn: null,
    ...context,
  });

interface PersistedClientFactoryOptions {
  buster?: number;
  mutations?: DehydratedState['mutations'];
  queries?: DehydratedState['queries'];
  timestamp?: number;
}
export const PersistedClientFactory = ({
  buster,
  mutations,
  queries,
  timestamp,
}: PersistedClientFactoryOptions) =>
  ({
    timestamp: timestamp || Date.now(),
    buster: buster || '',
    clientState: {
      mutations: mutations || [],
      queries: queries || [],
    },
  } as PersistedClient);

export const QueryStateFactory = (key: QueryKey, state: Partial<QueryState>) => ({
  queryKey: key,
  queryHash: Array.isArray(key) ? JSON.stringify(key) : `[${JSON.stringify(key)}]`,
  state: {
    data: undefined,
    dataUpdateCount: 1,
    dataUpdatedAt: Date.now(),
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchMeta: null,
    isFetching: false,
    isInvalidated: false,
    isPaused: false,
    status: 'success',
    ...state,
  } as QueryState,
});

export const MutationStateFactory = (key: MutationKey, state: Partial<MutationState> = {}) => ({
  mutationKey: key,
  state: {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    isPaused: false,
    status: 'success',
    variables: undefined,
    ...state,
  } as MutationState,
});
