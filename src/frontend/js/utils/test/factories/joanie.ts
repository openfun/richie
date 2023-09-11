import { faker } from '@faker-js/faker';
import { CourseStateTextEnum, Priority } from 'types';
import {
  Address,
  Certificate,
  CertificateDefinition,
  CourseListItem,
  CourseLight,
  CourseProduct,
  CourseProductRelation,
  CourseRun,
  CreditCard,
  CreditCardBrand,
  Enrollment,
  EnrollmentState,
  Order,
  OrderLite,
  OrderState,
  OrderWithPaymentInfo,
  Organization,
  OrganizationLight,
  Payment,
  PaymentProviders,
  Product,
  ProductType,
  TargetCourse,
  CourseProductRelationCourse,
  JoanieFile,
} from 'types/Joanie';
import { CourseStateFactory } from 'utils/test/factories/richie';
import { FactoryHelper } from 'utils/test/factories/helper';
import { factory } from './factories';

export const JoanieFileFactory = factory((): JoanieFile => {
  return {
    filename: faker.lorem.words(1),
    src: '/image/url',
    height: 40,
    width: 60,
    srcset: '/image/url',
    size: 300,
  };
});

export const EnrollmentFactory = factory((): Enrollment => {
  return {
    id: faker.string.uuid(),
    course_run: CourseRunWithCourseFactory().one(),
    is_active: true,
    products: ProductFactory().many(1),
    state: EnrollmentState.SET,
    was_created_by_order: false,
    created_on: faker.date.past({ years: 1 }).toISOString(),
  };
});

export const TargetCourseFactory = factory((): TargetCourse => {
  const courseRuns: CourseRun[] = CourseRunFactory().many(3);

  return {
    id: faker.string.uuid(),
    code: FactoryHelper.unique(faker.string.sample, { args: [5] }),
    organizations: [],
    title: FactoryHelper.sequence((counter) => `Target course (${counter})`),
    course_runs: courseRuns,
    is_graded: true,
    position: 1,
  };
});

export const OrganizationFactory = factory((): Organization => {
  const uuid = faker.string.uuid();
  return {
    id: uuid,
    code: faker.string.alphanumeric(5),
    title: FactoryHelper.unique(faker.lorem.words, { args: [1] }),
    logo: JoanieFileFactory().one(),
  };
});

export const OrganizationLightFactory = factory((): OrganizationLight => {
  return {
    code: faker.string.alphanumeric(5),
    title: faker.lorem.words(1),
  };
});

export const CertificationDefinitionFactory = factory((): CertificateDefinition => {
  return {
    id: faker.string.uuid(),
    title: FactoryHelper.sequence((counter) => `Certificate definition ${counter}`),
    description: faker.lorem.sentences(2),
  };
});

export const CertificateFactory = factory((): Certificate => {
  return {
    id: faker.string.uuid(),
    certificate_definition: CertificationDefinitionFactory().one(),
    order: OrderWithFullCourseFactory().one(),
    issued_on: faker.date.past().toISOString(),
  };
});

export const CredentialProductFactory = factory((): Product => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past().toISOString(),
    title: FactoryHelper.sequence((counter) => `Certificate Product ${counter}`),
    type: ProductType.CREDENTIAL,
    price: faker.number.int(),
    price_currency: faker.finance.currencyCode(),
    call_to_action: faker.lorem.words(3),
    certificate_definition: CertificationDefinitionFactory().one(),
    target_courses: TargetCourseFactory().many(5),
    remaining_order_count: faker.number.int({ min: 1, max: 100 }),
    state: CourseStateFactory().one(),
  };
});

export const CertificateCourseProductFactory = factory((): CourseProduct => {
  return {
    ...CredentialProductFactory().one(),
    order: OrderLiteFactory().one(),
    target_courses: TargetCourseFactory().many(3),
  };
});

// ProductFactory is an alias for CredentialProductFactory
// in the future we'll have differents types of products,
// factories.js need a feature that return a random factory from a list.
export const ProductFactory = CredentialProductFactory;

export const CourseRunFactory = factory((): CourseRun => {
  return {
    course: CourseLightFactory().one(),
    end: faker.date.future({ years: 0.75 }).toISOString(),
    enrollment_end: faker.date.future({ years: 0.5 }).toISOString(),
    enrollment_start: faker.date.past({ years: 0.5 }).toISOString(),
    id: faker.string.uuid(),
    resource_link: FactoryHelper.sequence((counter) => `${faker.internet.url()}/${counter}`),
    start: faker.date.past({ years: 0.25 }).toISOString(),
    title: faker.lorem.words(Math.ceil(Math.random() * 3)),
    state: CourseStateFactory({
      priority: Priority.FUTURE_OPEN,
      datetime: faker.date.past({ years: 0.25 }).toISOString(),
      call_to_action: 'enroll now',
      text: CourseStateTextEnum.ENROLLMENT_OPENED,
    }).one(),
    languages: faker.helpers.multiple(faker.location.countryCode, { count: { min: 1, max: 5 } }),
  };
});

export const CourseRunWithCourseFactory = factory((): CourseRun => {
  return {
    ...CourseRunFactory().one(),
    course: CourseLightFactory().one(),
  };
});

export const CourseFactory = factory((): CourseListItem => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    created_on: faker.date.past().toISOString(),
    organizations: OrganizationFactory().many(1),
    selling_organizations: OrganizationFactory().many(3),
    title: FactoryHelper.sequence((counter) => `Course ${counter}`),
    products: CertificateCourseProductFactory().many(3),
    course_runs: CourseRunFactory().many(3),
    state: CourseStateFactory().one(),
    cover: JoanieFileFactory().one(),
  };
});

export const CourseProductRelationCourseFactory = factory((): CourseProductRelationCourse => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    title: FactoryHelper.sequence((counter) => `Course ${counter}`),
    cover: JoanieFileFactory().one(),
  };
});

export const CourseProductRelationFactory = factory((): CourseProductRelation => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past().toISOString(),
    course: CourseFactory().one(),
    product: ProductFactory().one(),
    organizations: OrganizationFactory().many(1),
  };
});

export const CourseListItemFactory = factory((): CourseListItem => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    created_on: faker.date.past().toISOString(),
    organizations: OrganizationFactory().many(1),
    selling_organizations: OrganizationFactory().many(1),
    products: ProductFactory().many(2),
    title: FactoryHelper.sequence((counter) => `Course list item ${counter}`),
    course_runs: [],
    state: CourseStateFactory().one(),
    cover: JoanieFileFactory().one(),
  };
});

export const CourseLightFactory = factory((): CourseLight => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    organizations: OrganizationLightFactory().many(1),
    title: FactoryHelper.sequence((counter) => `Course light ${counter}`),
    // do not use a ProductFactory here.
    // ProductFactory will call CourseLightFactory and create a infinit loop.
    // if we need a factory of course with a product, it should be a
    // different one than CourseLightFactory.
    products: [],
    course_runs: [],
    orders: [],
  };
});

export const OrderLiteFactory = factory((): OrderLite => {
  return {
    created_on: faker.date.past().toISOString(),
    enrollments: [],
    id: faker.string.uuid(),
    main_proforma_invoice: faker.string.uuid(),
    total: faker.number.int(),
    product: faker.string.uuid(),
    state: OrderState.VALIDATED,
  };
});

export const OrderFactory = factory((): Order => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past({ years: 1 }).toISOString(),
    owner: faker.internet.userName(),
    total: faker.number.int(),
    total_currency: faker.finance.currencyCode(),
    main_proforma_invoice: faker.string.uuid(),
    state: OrderState.VALIDATED,
    product: faker.string.uuid(),
    target_courses: TargetCourseFactory().many(5),
    course: CourseLightFactory().one(),
    enrollments: [],
  };
});

export const OrderWithFullCourseFactory = factory((): Order => {
  return {
    ...OrderFactory().one(),
    course: CourseLightFactory().one(),
  };
});

export const OrderWithPaymentFactory = factory((): OrderWithPaymentInfo => {
  return {
    ...OrderFactory().one(),
    payment_info: PaymentFactory().one(),
  };
});

export const OrderWithOneClickPaymentFactory = factory((): OrderWithPaymentInfo => {
  return {
    ...OrderFactory().one(),
    payment_info: {
      ...PaymentFactory().one(),
      is_paid: true,
    },
  };
});

export const AddressFactory = factory((): Address => {
  return {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.countryCode(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    id: faker.string.uuid(),
    is_main: false,
    postcode: faker.location.zipCode(),
    title: FactoryHelper.sequence((counter) => `Address ${counter}`),
  };
});

export const CreditCardFactory = factory((): CreditCard => {
  return {
    brand: CreditCardBrand.VISA,
    expiration_month: faker.date.future().getMonth(),
    expiration_year: faker.date.future().getFullYear(),
    id: faker.string.uuid(),
    is_main: false,
    last_numbers: faker.finance.creditCardNumber('visa').slice(-4),
    title: FactoryHelper.sequence((counter) => `Credit card ${counter}`),
  };
});

export const PaymentFactory = factory((): Payment => {
  return {
    payment_id: faker.finance.routingNumber(),
    provider: PaymentProviders.DUMMY,
    url: faker.internet.url(),
  };
});
