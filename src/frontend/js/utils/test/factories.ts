import { compose, createSpec, derived, faker, oneOf } from '@helpscout/helix';
import { MutationKey, QueryKey } from 'react-query';
import { MutationState } from 'react-query/types/core/mutation';
import { QueryState } from 'react-query/types/core/query';
import { DehydratedState } from 'react-query/types/hydration';
import { PersistedClient } from 'react-query/types/persistQueryClient-experimental';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { EnrollmentState, OrderState, PaymentProviders, ProductType } from 'types/Joanie';

const CourseStateFactory = createSpec({
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
    web_analytics_provider: null,
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

export const CurrencyFactory = createSpec({
  code: faker.finance.currencyCode(),
  symbol: faker.finance.currencySymbol(),
});

export const OrganizationFactory = createSpec({
  code: faker.random.alphaNumeric(5),
  title: faker.random.words(1),
});

export const JoanieCourseRunFactory = createSpec({
  end: derived(() => faker.date.future(0.75)().toISOString()),
  enrollment_end: derived(() => faker.date.future(0.5)().toISOString()),
  enrollment_start: derived(() => faker.date.past(0.5)().toISOString()),
  id: faker.datatype.uuid(),
  resource_link: faker.unique(faker.internet.url()),
  start: derived(() => faker.date.past(0.25)().toISOString()),
  title: faker.random.words(Math.ceil(Math.random() * 3)),
  state: {
    priority: 1,
    datetime: derived(() => faker.date.past(0.25)().toISOString()),
    call_to_action: 'enroll now',
    text: 'closing on',
  },
});

export const JoanieEnrollmentFactory = compose(
  JoanieCourseRunFactory,
  createSpec({
    is_active: true,
    state: EnrollmentState.SET,
  }),
);

export const TargetCourseFactory = createSpec({
  code: faker.unique(faker.random.alphaNumeric(5)),
  organization: OrganizationFactory,
  title: faker.random.words(1, 3),
  course_runs: derived(() => JoanieCourseRunFactory.generate(1, 3)),
});

export const CertificationDefinitionFactory = createSpec({
  id: faker.datatype.uuid(),
  title: faker.random.words(Math.ceil(Math.random() * 3)),
  description: faker.lorem.sentences(2),
});

export const CertificateProductFactory = createSpec({
  id: faker.datatype.uuid(),
  title: faker.unique(faker.random.words(1, 3)),
  type: ProductType.CERTIFICATE,
  price: faker.datatype.number(),
  price_currency: faker.finance.currencyCode(),
  call_to_action: faker.random.words(1, 3),
  certificate: derived(() => CertificationDefinitionFactory.generate()),
  order: null,
  target_courses: derived(() => TargetCourseFactory.generate(1, 5)),
});

export const OrderLiteFactory = createSpec({
  created_on: faker.date.past()().toISOString(),
  enrollments: [],
  id: faker.datatype.uuid(),
  main_invoice: faker.datatype.uuid(),
  total: faker.datatype.number(),
  total_currency: faker.finance.currencyCode(),
  product: faker.datatype.uuid(),
  state: OrderState.VALIDATED,
});

export const ProductFactory = oneOf([CertificateProductFactory]);

export const CourseFactory = createSpec({
  code: faker.random.alphaNumeric(5),
  organization: OrganizationFactory,
  title: faker.unique(faker.random.words(Math.ceil(Math.random() * 3))),
  products: derived(() => ProductFactory.generate(1, 3)),
  course_runs: [],
  orders: null,
});

export const OrderFactory = createSpec({
  id: faker.datatype.uuid(),
  course: faker.random.alphaNumeric(5),
  created_on: faker.date.past()().toISOString(),
  owner: faker.internet.userName(),
  total: faker.datatype.number(),
  total_currency: faker.finance.currencyCode(),
  main_invoice: faker.datatype.uuid(),
  state: OrderState.VALIDATED,
  product: faker.datatype.uuid(),
  target_courses: derived(() => TargetCourseFactory.generate(1, 5)),
});

export const AddressFactory = createSpec({
  address: faker.address.streetAddress(),
  city: faker.address.city(),
  country: faker.address.countryCode(),
  first_name: faker.name.firstName(),
  last_name: faker.name.lastName(),
  id: faker.datatype.uuid(),
  is_main: false,
  postcode: faker.address.zipCode(),
  title: faker.unique(faker.random.word()),
});

export const CreditCardFactory = createSpec({
  brand: 'Visa',
  expiration_month: derived(() => faker.date.future()().getMonth()),
  expiration_year: derived(() => faker.date.future()().getFullYear()),
  id: faker.datatype.uuid(),
  is_main: false,
  last_numbers: derived(() => faker.finance.creditCardNumber('visa')().slice(-4)),
  title: faker.unique(faker.random.word()),
});

export const PaymentFactory = createSpec({
  payment_id: faker.finance.routingNumber(),
  provider: PaymentProviders.DUMMY,
  url: faker.internet.url(),
});

export const OrderWithPaymentFactory = compose(
  OrderFactory,
  createSpec({
    payment_info: PaymentFactory,
  }),
);

export const OrderWithOneClickPaymentFactory = compose(
  OrderFactory,
  createSpec({
    payment_info: derived(() => ({
      ...PaymentFactory.generate(),
      is_paid: true,
    })),
  }),
);
