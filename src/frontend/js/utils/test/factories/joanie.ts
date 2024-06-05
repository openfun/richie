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
  OrderLite,
  OrderState,
  Organization,
  OrganizationLight,
  ProductType,
  TargetCourse,
  JoanieFile,
  Contract,
  OrderEnrollment,
  ContractDefinition,
  NestedCredentialOrder,
  NestedCertificateOrder,
  Order,
  CertificateOrder,
  CredentialOrder,
  CertificateOrderWithPaymentInfo,
  CredentialOrderWithPaymentInfo,
  EnrollmentLight,
  OrderGroup,
  CertificateProduct,
  CredentialProduct,
  NestedCourseOrder,
  UserLight,
  ContractLight,
  DefinitionResourcesProduct,
} from 'types/Joanie';
import { Payment, PaymentProviders } from 'components/PaymentInterfaces/types';
import { CourseStateFactory } from 'utils/test/factories/richie';
import { FactoryHelper } from 'utils/test/factories/helper';
import { JoanieUserApiAbilityActions, JoanieUserProfile } from 'types/User';
import { factory } from './factories';

export const UserLightFactory = factory((): UserLight => {
  return {
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    full_name: faker.person.fullName(),
    email: faker.internet.email(),
  };
});
export const JoanieUserProfileFactory = factory((): JoanieUserProfile => {
  return {
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    full_name: faker.person.fullName(),
    is_superuser: false,
    is_staff: false,
    abilities: {
      [JoanieUserApiAbilityActions.DELETE]: true,
      [JoanieUserApiAbilityActions.GET]: true,
      [JoanieUserApiAbilityActions.PATCH]: true,
      [JoanieUserApiAbilityActions.PUT]: true,
      [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: true,
      [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: true,
    },
  };
});

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
    product_relations: CourseProductRelationFactory().many(1),
    state: EnrollmentState.SET,
    was_created_by_order: false,
    created_on: faker.date.past({ years: 1 }).toISOString(),
    orders: [],
    certificate_id: null,
  };
});

export const EnrollmentLightFactory = factory((): EnrollmentLight => {
  return {
    id: faker.string.uuid(),
    course_run: CourseRunWithCourseFactory().one(),
    is_active: true,
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

export const ContractDefinitionFactory = factory((): ContractDefinition => {
  return {
    id: faker.string.uuid(),
    description: faker.lorem.paragraph(),
    language: faker.location.countryCode(),
    title: faker.lorem.sentence(),
  };
});

export const ContractFactory = factory((): Contract => {
  return {
    id: faker.string.uuid(),
    student_signed_on: faker.date.past().toISOString(),
    organization_signed_on: null,
    organization_signatory: null,
    created_on: faker.date.past().toISOString(),
    definition: ContractDefinitionFactory().one(),
    order: NestedCredentialOrderFactory().one(),
  };
});

export const ContractLightFactory = factory((): ContractLight => {
  return {
    id: faker.string.uuid(),
    student_signed_on: null,
    organization_signed_on: null,
  };
});

export const OrganizationFactory = factory((): Organization => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    title: FactoryHelper.unique(faker.lorem.words, { args: [1] }),
    logo: JoanieFileFactory().one(),
    contact_email: faker.internet.email(),
    dpo_email: faker.internet.email(),
    contact_phone: faker.phone.number(),
    address: AddressFactory().one(),
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
    order: NestedCredentialOrderFactory().one(),
    enrollment: null,
    issued_on: faker.date.past().toISOString(),
  };
});

export const CredentialProductFactory = factory((): CredentialProduct => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past().toISOString(),
    title: FactoryHelper.sequence((counter) => `Certificate Product ${counter}`),
    type: ProductType.CREDENTIAL,
    price: faker.number.int(),
    price_currency: faker.finance.currencyCode(),
    call_to_action: faker.lorem.words(3),
    certificate_definition: CertificationDefinitionFactory().one(),
    contract_definition: ContractDefinitionFactory().one(),
    target_courses: TargetCourseFactory().many(5),
    remaining_order_count: faker.number.int({ min: 1, max: 100 }),
    state: CourseStateFactory().one(),
    instructions: null,
  };
});

export const CertificateProductFactory = factory((): CertificateProduct => {
  return {
    ...CredentialProductFactory().one(),
    type: ProductType.CERTIFICATE,
    target_courses: [],
    instructions: faker.lorem.paragraphs(5),
  };
});

export const CertificateCourseProductFactory = factory((): CourseProduct => {
  return {
    ...CertificateProductFactory().one(),
    order: OrderLiteFactory().one(),
  };
});

// ProductFactory is an alias for CredentialProductFactory
// in the future we'll have differents types of products,
// factories.js need a feature that return a random factory from a list.
export const ProductFactory = CredentialProductFactory;

export const DefinitionResourcesProductFactory = factory((): DefinitionResourcesProduct => {
  return {
    id: faker.string.uuid(),
    certificate_definition_id: null,
    contract_definition_id: null,
  };
});

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
    product_ids: [faker.string.uuid()],
    course_run_ids: [faker.string.uuid()],
    state: CourseStateFactory().one(),
    cover: JoanieFileFactory().one(),
  };
});

export const CourseLightFactory = factory((): CourseLight => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    title: FactoryHelper.sequence((counter) => `Course ${counter}`),
    cover: JoanieFileFactory().one(),
  };
});

export const OrderGroupFactory = factory((): OrderGroup => {
  const seats = faker.number.int({ min: 5, max: 100 });
  return {
    id: faker.string.uuid(),
    is_active: true,
    nb_seats: seats,
    nb_available_seats: faker.number.int({ min: 2, max: seats }),
  };
});

export const OrderGroupFullFactory = factory((): OrderGroup => {
  return {
    id: faker.string.uuid(),
    is_active: true,
    nb_seats: faker.number.int({ min: 5, max: 100 }),
    nb_available_seats: 0,
  };
});

export const NestedCourseOrderFactory = factory((): NestedCourseOrder => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past().toISOString(),
    owner: UserLightFactory().one(),
    course_id: faker.string.uuid(),
    product_id: faker.string.uuid(),
    state: OrderState.VALIDATED,
    enrollment_id: faker.string.uuid(),
    organization: OrganizationFactory().one(),
    certificate_id: faker.string.uuid(),
    product: DefinitionResourcesProductFactory().one(),
    contract: ContractLightFactory().one(),
  };
});

export const CourseProductRelationFactory = factory((): CourseProductRelation => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past().toISOString(),
    course: CourseFactory().one(),
    product: ProductFactory().one(),
    organizations: OrganizationFactory().many(1),
    order_groups: [],
  };
});

export const CourseListItemFactory = factory((): CourseListItem => {
  return {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(5),
    created_on: faker.date.past().toISOString(),
    organizations: OrganizationFactory().many(1),
    selling_organizations: OrganizationFactory().many(1),
    product_ids: [faker.string.uuid()],
    title: FactoryHelper.sequence((counter) => `Course list item ${counter}`),
    course_run_ids: [],
    state: CourseStateFactory().one(),
    cover: JoanieFileFactory().one(),
  };
});

export const OrderEnrollmentFactory = factory((): OrderEnrollment => {
  return {
    id: faker.string.uuid(),
    product_id: faker.string.uuid(),
    state: OrderState.VALIDATED,
  };
});

export const OrderLiteFactory = factory((): OrderLite => {
  return {
    created_on: faker.date.past().toISOString(),
    target_enrollments: [],
    id: faker.string.uuid(),
    main_invoice_reference: faker.string.uuid(),
    total: faker.number.int(),
    product_id: faker.string.uuid(),
    state: OrderState.VALIDATED,
  };
});

export const NestedCertificateOrderFactory = factory((): NestedCertificateOrder => {
  return {
    id: faker.string.uuid(),
    course: undefined,
    enrollment: EnrollmentLightFactory().one(),
    organization: OrganizationFactory().one(),
    product_title: FactoryHelper.unique(faker.lorem.words, { args: [1] }),
    owner_name: faker.internet.userName(),
    state: OrderState.VALIDATED,
  };
});

export const NestedCredentialOrderFactory = factory((): NestedCredentialOrder => {
  return {
    id: faker.string.uuid(),
    course: CourseLightFactory().one(),
    enrollment: undefined,
    organization: OrganizationFactory().one(),
    product_title: FactoryHelper.unique(faker.lorem.words, { args: [1] }),
    owner_name: faker.internet.userName(),
    state: OrderState.VALIDATED,
  };
});

const AbstractOrderFactory = factory((): Order => {
  return {
    id: faker.string.uuid(),
    created_on: faker.date.past({ years: 1 }).toISOString(),
    owner: faker.internet.userName(),
    total: faker.number.int(),
    total_currency: faker.finance.currencyCode(),
    main_invoice_reference: faker.string.uuid(),
    state: OrderState.VALIDATED,
    product_id: faker.string.uuid(),
    target_courses: TargetCourseFactory().many(5),
    target_enrollments: [],
    enrollment: null,
    course: null,
    organization_id: faker.string.uuid(),
    organization: OrganizationFactory().one(),
  };
});

export const CredentialOrderFactory = factory((): CredentialOrder => {
  const order = {
    ...AbstractOrderFactory().one(),
    course: CourseLightFactory().one(),
    enrollment: null,
  };
  return order;
});

export const CredentialOrderWithPaymentFactory = factory((): CredentialOrderWithPaymentInfo => {
  return {
    ...CredentialOrderFactory().one(),
    payment_info: PaymentFactory().one(),
  };
});

export const CredentialOrderWithOneClickPaymentFactory = factory(
  (): CredentialOrderWithPaymentInfo => {
    return {
      ...CredentialOrderFactory().one(),
      payment_info: PaymentFactory().one(),
    };
  },
);

export const CertificateOrderFactory = factory((): CertificateOrder => {
  const order = {
    ...AbstractOrderFactory().one(),
    course: null,
    target_courses: [],
    enrollment: EnrollmentLightFactory().one(),
  };
  return order;
});

export const CertificateOrderWithPaymentFactory = factory((): CertificateOrderWithPaymentInfo => {
  return {
    ...CertificateOrderFactory().one(),
    payment_info: PaymentFactory().one(),
  };
});

export const CertificateOrderWithOneClickPaymentFactory = factory(
  (): CertificateOrderWithPaymentInfo => {
    return {
      ...CertificateOrderFactory().one(),
      payment_info: PaymentFactory().one(),
    };
  },
);

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
    provider_name: PaymentProviders.DUMMY,
    url: faker.internet.url(),
  };
});
