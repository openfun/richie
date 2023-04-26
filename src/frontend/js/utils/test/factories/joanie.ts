import { faker } from '@faker-js/faker';
import { Priority } from 'types';
import { OrganizationMock } from 'api/mocks/joanie/organizations';
import {
  Address,
  Certificate,
  CertificateDefinition,
  CourseLight,
  CourseProduct,
  CourseRun,
  CreditCard,
  CreditCardBrand,
  Enrollment,
  EnrollmentState,
  Order,
  OrderLite,
  OrderState,
  OrderWithPaymentInfo,
  OrganizationLight,
  Payment,
  PaymentProviders,
  Product,
  ProductType,
  TargetCourse,
  UserWishlistCourse,
} from 'types/Joanie';
import { CourseStateFactory } from 'utils/test/factories/richie';
import { CourseListItemMock } from 'api/mocks/joanie/courses';
import { FactoryConfig, factory } from './factories';

export const EnrollmentFactory = factory<Enrollment>(() => {
  return {
    id: faker.datatype.uuid(),
    course_run: CourseRunWithCourseFactory().one(),
    is_active: true,
    state: EnrollmentState.SET,
    was_created_by_order: false,
    created_on: faker.date.past(1).toISOString(),
  };
});

export const TargetCourseFactory = factory<TargetCourse>(() => {
  const code = faker.helpers.unique(faker.random.alphaNumeric, [5], {
    maxRetries: 20,
    store: FactoryConfig.GLOBAL_UNIQUE_STORE,
  });
  const courseRuns: CourseRun[] = CourseRunFactory().many(3);

  return {
    id: faker.datatype.uuid(),
    code,
    organizations: [],
    title: faker.helpers.unique(() => `${faker.random.words(3)}(${code})`, undefined, {
      maxRetries: 20,
      store: FactoryConfig.GLOBAL_UNIQUE_STORE,
    }),
    course_runs: courseRuns,
    is_graded: true,
    position: 1,
  };
});

export const OrganizationFactory = factory<OrganizationMock>(() => {
  const uuid = faker.datatype.uuid();
  return {
    id: uuid,
    code: faker.random.alphaNumeric(5),
    title: faker.random.words(1),
    logo: {
      filename: faker.random.words(1),
      url: `/organizations/${uuid}`,
      height: 40,
      width: 60,
    },
  };
});

export const OrganizationLightFactory = factory<OrganizationLight>(() => {
  return {
    code: faker.random.alphaNumeric(5),
    title: faker.random.words(1),
  };
});

export const CertificationDefinitionFactory = factory<CertificateDefinition>(() => {
  return {
    id: faker.datatype.uuid(),
    title: faker.random.words(Math.ceil(Math.random() * 3)),
    description: faker.lorem.sentences(2),
  };
});

export const CertificateFactory = factory<Certificate>(() => {
  return {
    id: faker.datatype.uuid(),
    title: faker.random.words(Math.ceil(Math.random() * 3)),
    description: faker.lorem.sentences(2),
    certificate_definition: CertificationDefinitionFactory().one(),
    order: OrderWithFullCourseFactory().one(),
    issued_on: faker.date.past().toISOString(),
  };
});

export const CertificateProductFactory = factory<Product>(() => {
  return {
    id: faker.datatype.uuid(),
    title: faker.helpers.unique(faker.random.words, [10]),
    course: faker.helpers.unique(faker.random.alphaNumeric, [5]),
    type: ProductType.CERTIFICATE,
    price: faker.datatype.number(),
    price_currency: faker.finance.currencyCode(),
    call_to_action: faker.random.words(3),
    certificate_definition: CertificationDefinitionFactory().one(),
    orders: [],
    target_courses: TargetCourseFactory().many(5),
  };
});

export const CertificateCourseProductFactory = factory<CourseProduct>(() => {
  return {
    ...CertificateProductFactory().one(),
    order: OrderLiteFactory().one(),
    target_courses: TargetCourseFactory().many(3),
  };
});

// ProductFactory is an alias for CertificateProductFactory
// in the future we'll have differents types of products,
// factories.js need a feature that return a random factory from a list.
export const ProductFactory = CertificateProductFactory;

export const CourseRunFactory = factory<CourseRun>(() => {
  return {
    end: faker.date.future(0.75).toISOString(),
    enrollment_end: faker.date.future(0.5).toISOString(),
    enrollment_start: faker.date.past(0.5).toISOString(),
    id: faker.datatype.uuid(),
    resource_link: faker.helpers.unique(
      () => faker.internet.url() + '/' + faker.random.alphaNumeric(5),
      undefined,
      {
        store: FactoryConfig.GLOBAL_UNIQUE_STORE,
      },
    ),
    start: faker.date.past(0.25).toISOString(),
    title: faker.random.words(Math.ceil(Math.random() * 3)),
    state: CourseStateFactory({
      priority: Priority.FUTURE_OPEN,
      datetime: faker.date.past(0.25).toISOString(),
      call_to_action: 'enroll now',
      text: 'closing on',
    }).one(),
  };
});

export const CourseRunWithCourseFactory = factory<CourseRun>(() => {
  return {
    ...CourseRunFactory().one(),
    course: CourseLightFactory().one(),
  };
});

export const CourseFactory = factory<CourseListItemMock>(() => {
  const organizations = OrganizationFactory().many(1);
  return {
    id: faker.datatype.uuid(),
    code: faker.random.alphaNumeric(5),
    organization: organizations[0],
    organizations,
    title: faker.helpers.unique(() => faker.random.words(Math.ceil(Math.random() * 3)), undefined, {
      store: FactoryConfig.GLOBAL_UNIQUE_STORE,
    }),
    products: CertificateCourseProductFactory().many(3),
    course_runs: [],
    orders: [],
    state: CourseStateFactory().one(),
    cover: {
      filename: 'course_cover_image.jpg',
      url: '/static/course_cover_image.jpg',
      height: 100,
      width: 200,
    },
  };
});

export const CourseLightFactory = factory<CourseLight>(() => {
  return {
    id: faker.datatype.uuid(),
    code: faker.random.alphaNumeric(5),
    organizations: OrganizationLightFactory().many(1),
    title: faker.helpers.unique(() => faker.random.words(Math.ceil(Math.random() * 3)), undefined, {
      store: FactoryConfig.GLOBAL_UNIQUE_STORE,
    }),
    products: CertificateCourseProductFactory().many(3),
    course_runs: [],
    orders: [],
  };
});

export const UserWishlistCourseFactory = factory<UserWishlistCourse>(() => {
  return {
    course: faker.random.alphaNumeric(5),
    id: faker.datatype.uuid(),
  };
});

export const OrderLiteFactory = factory<OrderLite>(() => {
  return {
    created_on: faker.date.past().toISOString(),
    enrollments: [],
    id: faker.datatype.uuid(),
    main_proforma_invoice: faker.datatype.uuid(),
    total: faker.datatype.number(),
    total_currency: faker.finance.currencyCode(),
    product: faker.datatype.uuid(),
    state: OrderState.VALIDATED,
  };
});

export const OrderFactory = factory<Order>(() => {
  return {
    id: faker.datatype.uuid(),
    created_on: faker.date.past(1).toISOString(),
    owner: faker.internet.userName(),
    total: faker.datatype.number(),
    total_currency: faker.finance.currencyCode(),
    main_proforma_invoice: faker.datatype.uuid(),
    state: OrderState.VALIDATED,
    product: faker.datatype.uuid(),
    target_courses: TargetCourseFactory().many(5),
    course: faker.random.alphaNumeric(5),
    enrollments: [],
  };
});

export const OrderWithFullCourseFactory = factory<Order>(() => {
  return {
    ...OrderFactory().one(),
    course: CourseLightFactory().one(),
  };
});

export const OrderWithPaymentFactory = factory<OrderWithPaymentInfo>(() => {
  return {
    ...OrderFactory().one(),
    payment_info: PaymentFactory().one(),
  };
});

export const OrderWithOneClickPaymentFactory = factory<OrderWithPaymentInfo>(() => {
  return {
    ...OrderFactory().one(),
    payment_info: {
      ...PaymentFactory().one(),
      is_paid: true,
    },
  };
});

export const AddressFactory = factory<Address>(() => {
  return {
    address: faker.address.streetAddress(),
    city: faker.address.city(),
    country: faker.address.countryCode(),
    first_name: faker.name.firstName(),
    last_name: faker.name.lastName(),
    id: faker.datatype.uuid(),
    is_main: false,
    postcode: faker.address.zipCode(),
    title: faker.helpers.unique(faker.random.words, [5], {
      store: FactoryConfig.GLOBAL_UNIQUE_STORE,
    }),
  };
});

export const CreditCardFactory = factory<CreditCard>(() => {
  return {
    brand: CreditCardBrand.VISA,
    expiration_month: faker.date.future().getMonth(),
    expiration_year: faker.date.future().getFullYear(),
    id: faker.datatype.uuid(),
    is_main: false,
    last_numbers: faker.finance.creditCardNumber('visa').slice(-4),
    title: faker.helpers.unique(faker.random.words, [5], {
      store: FactoryConfig.GLOBAL_UNIQUE_STORE,
    }),
  };
});

export const PaymentFactory = factory<Payment>(() => {
  return {
    payment_id: faker.finance.routingNumber(),
    provider: PaymentProviders.DUMMY,
    url: faker.internet.url(),
  };
});
