import { compose, createSpec, derived, faker, oneOf } from '@helpscout/helix';
import type { DehydratedState, MutationKey, QueryKey, QueryState } from '@tanstack/react-query';
import type { MutationState } from '@tanstack/query-core/build/lib/mutation';
import { PersistedClient } from '@tanstack/react-query-persist-client';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { EnrollmentState, OrderState, PaymentProviders, ProductType } from 'types/Joanie';

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

export const ContextFactory = (context: Partial<CommonDataProps['context']> = {}) =>
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

export const CourseFactory = createSpec({
  code: faker.random.alphaNumeric(5),
  organization: OrganizationFactory,
  title: faker.unique(faker.random.words(Math.ceil(Math.random() * 3))),
  products: derived(() => ProductFactory.generate(1, 3)),
  course_runs: [],
  orders: null,
});

export const UserWishlistCourseFactory = createSpec({
  course: faker.random.alphaNumeric(5),
  id: faker.datatype.uuid(),
});

/**
 * `scopes` allows to conditionally include properties.
 * This is required to avoid circular dependencies when generating mocks.
 */
export const JoanieCourseRunFactory = (scopes?: { course: Boolean }) => {
  return createSpec({
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
    ...(scopes?.course && {
      course: CourseFactory.generate(),
    }),
  });
};

export const JoanieEnrollmentFactory = createSpec({
  id: faker.datatype.uuid(),
  course_run: derived(() => JoanieCourseRunFactory({ course: true }).generate()),
  is_active: true,
  state: EnrollmentState.SET,
  was_created_by_order: false,
});

export const TargetCourseFactory = createSpec({
  code: faker.unique(faker.random.alphaNumeric(5), { maxRetries: 20 }),
  organizations: [],
  title: derived(({ code }: { code: string }) => {
    return `${faker.random.words(1, 3)()}(${code})`;
  }),
  course_runs: derived(() => JoanieCourseRunFactory().generate(3, 5)),
});

export const CertificationDefinitionFactory = createSpec({
  id: faker.datatype.uuid(),
  title: faker.random.words(Math.ceil(Math.random() * 3)),
  description: faker.lorem.sentences(2),
});

export const CertificateProductFactory = createSpec({
  id: faker.datatype.uuid(),
  title: faker.unique(faker.random.words(1, 3)),
  course: faker.unique(faker.random.alphaNumeric(5)),
  type: ProductType.CERTIFICATE,
  price: faker.datatype.number(),
  price_currency: faker.finance.currencyCode(),
  call_to_action: faker.random.words(1, 3),
  certificate_definition: derived(() => CertificationDefinitionFactory.generate()),
  orders: [],
  target_courses: derived(() => TargetCourseFactory.generate(1, 5)),
});

export const OrderLiteFactory = createSpec({
  created_on: faker.date.past()().toISOString(),
  enrollments: [],
  id: faker.datatype.uuid(),
  main_proforma_invoice: faker.datatype.uuid(),
  total: faker.datatype.number(),
  total_currency: faker.finance.currencyCode(),
  product: faker.datatype.uuid(),
  state: OrderState.VALIDATED,
});

export const ProductFactory = oneOf([CertificateProductFactory]);

export const OrderFactory = createSpec({
  id: faker.datatype.uuid(),
  created_on: faker.date.past()().toISOString(),
  owner: faker.internet.userName(),
  total: faker.datatype.number(),
  total_currency: faker.finance.currencyCode(),
  main_proforma_invoice: faker.datatype.uuid(),
  state: OrderState.VALIDATED,
  product: faker.datatype.uuid(),
  target_courses: derived(() => TargetCourseFactory.generate(1, 5)),
  course: faker.random.alphaNumeric(5),
  enrollments: [],
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
