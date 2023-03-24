import { compose, createSpec, derived, faker, oneOf } from '@helpscout/helix';
import { EnrollmentState, OrderState, PaymentProviders, ProductType } from 'types/Joanie';

export const EnrollmentFactory = createSpec({
  id: faker.datatype.uuid(),
  course_run: derived(() => CourseRunFactory({ course: true }).generate()),
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
  course_runs: derived(() => CourseRunFactory().generate(3, 5)),
});

export const OrganizationFactory = createSpec({
  id: faker.random.alphaNumeric(5),
  code: faker.random.alphaNumeric(5),
  title: faker.random.words(1),
  logo: {
    filename: faker.random.words(1),
    url: derived(({ id }: { id: string }) => `/organizations/${id}`),
    height: 40,
    width: 60,
  },
});

export const OrganizationLightFactory = createSpec({
  code: faker.random.alphaNumeric(5),
  title: faker.random.words(1),
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

/**
 * `scopes` allows to conditionally include properties.
 * This is required to avoid circular dependencies when generating mocks.
 */
export const CourseRunFactory = (scopes?: { course: Boolean }) => {
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

export const CourseFactory = createSpec({
  code: faker.random.alphaNumeric(5),
  organization: OrganizationLightFactory,
  title: faker.unique(faker.random.words(Math.ceil(Math.random() * 3))),
  products: derived(() => ProductFactory.generate(1, 3)),
  course_runs: [],
  orders: null,
});

export const UserWishlistCourseFactory = createSpec({
  course: faker.random.alphaNumeric(5),
  id: faker.datatype.uuid(),
});

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

export const CurrencyFactory = createSpec({
  code: faker.finance.currencyCode(),
  symbol: faker.finance.currencySymbol(),
});
