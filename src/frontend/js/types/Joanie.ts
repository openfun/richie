import type { CourseState, OpenEdXEnrollment } from 'types';
import type { Maybe, Nullable } from 'types/utils';
import { Resource, ResourcesQuery } from 'hooks/useResources';
import { OrderResourcesQuery } from 'hooks/useOrders';
import { Course as RichieCourse } from 'types/Course';
import { JoanieUserProfile } from './User';

// - Generic
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<T>;
}

export interface PaginatedParameters {
  page: number;
  offset: number;
}

export interface UserLight {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

export interface Organization {
  id: string;
  code: string;
  title: string;
  logo: Nullable<JoanieFile>;
  contact_email: Nullable<string>;
  contact_phone: Nullable<string>;
  dpo_email: Nullable<string>;
  address?: Address;
}

export interface OrganizationResourceQuery extends ResourcesQuery {
  course_product_relation_id?: CourseProductRelation['id'];
}

export interface ContractDefinition {
  id: string;
  description: string;
  language: string;
  title: string;
}

type ContractAbilities = {
  sign: boolean;
};

export interface Contract {
  id: string;
  abilities?: ContractAbilities;
  created_on: string;
  student_signed_on: Nullable<string>;
  organization_signed_on: Nullable<string>;
  organization_signatory: Nullable<JoanieUserProfile>;
  definition: ContractDefinition;
  order: NestedCertificateOrder | NestedCredentialOrder;
}

export type ContractLight = Pick<Contract, 'id' | 'organization_signed_on' | 'student_signed_on'>;

export interface CourseListItem extends Resource {
  id: string;
  title: string;
  code: string;
  course_run_ids: string[];
  organizations: Organization[];
  selling_organizations: Organization[];
  cover: Nullable<JoanieFile>;
  product_ids: string[];
  state: CourseState;
  created_on: string;
}

// - Course Run
export interface CourseRun {
  end: string;
  enrollment_end: string;
  enrollment_start: string;
  id: string;
  resource_link: string;
  start: string;
  state: CourseState;
  title: string;
  course: CourseLight;
  languages: string[];
}

// - Certificate
export interface CertificateDefinition {
  id: string;
  title: string;
  description: string;
}

export interface Certificate {
  id: string;
  issued_on: string;
  certificate_definition: CertificateDefinition;
  order: NestedCertificateOrder | NestedCredentialOrder;
}

// - Organization
export interface OrganizationLight {
  code: string;
  title: string;
}

// - Product
export enum ProductType {
  CERTIFICATE = 'certificate',
  CREDENTIAL = 'credential',
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  type: ProductType;
  price: number;
  price_currency: string;
  call_to_action: string;
  certificate_definition: CertificateDefinition;
  target_courses: TargetCourse[];
  created_on: string;
  remaining_order_count?: number | null;
  state: CourseState;
  instructions: Nullable<string>;
  contract_definition?: ContractDefinition;
}

export interface CredentialProduct extends Product {
  type: ProductType.CREDENTIAL;
}

export interface CertificateProduct extends Product {
  type: ProductType.CERTIFICATE;
}
export const isCertificateProduct = (
  entity: Product | CertificateProduct | CredentialProduct,
): entity is CertificateProduct => {
  return entity.type === ProductType.CERTIFICATE;
};

export interface CourseProduct extends Product {
  order: Nullable<OrderLite>;
}

export interface DefinitionResourcesProduct {
  id: Product['id'];
  certificate_definition_id: Nullable<CertificateDefinition['id']>;
  contract_definition_id: Nullable<ContractDefinition['id']>;
}

export interface CourseProductRelation {
  id: string;
  course: CourseLight;
  organizations: Organization[];
  product: Product;
  created_on: string;
  order_groups: OrderGroup[];
}
export function isCourseProductRelation(
  entity: CourseListItem | CourseProductRelation | RichieCourse,
): entity is CourseProductRelation {
  return 'course' in entity && 'product' in entity;
}

export interface JoanieFile {
  filename: string;
  height: number;
  size: number;
  src: string;
  srcset: string;
  width: number;
}

// - Course
export interface AbstractCourse {
  id: string;
  code: string;
  organizations: OrganizationLight[];
  title: string;
  course_runs: CourseRun[];
}

export type CourseLight = Pick<AbstractCourse, 'id' | 'code' | 'title'> & {
  cover: Nullable<JoanieFile>;
};

export interface TargetCourse extends AbstractCourse {
  is_graded: boolean;
  position: number;
}

// Enrollment
export enum EnrollmentState {
  FAILED = 'failed',
  SET = 'set',
}

export interface Enrollment {
  id: string;
  is_active: boolean;
  state: EnrollmentState;
  course_run: CourseRun;
  was_created_by_order: boolean;
  created_on: string;
  orders: OrderEnrollment[];
  product_relations: CourseProductRelation[];
  certificate_id: Nullable<string>;
}
export const isEnrollment = (obj: unknown | Enrollment | OpenEdXEnrollment): obj is Enrollment => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return (
    'is_active' in obj &&
    'state' in obj &&
    'course_run' in obj &&
    'was_created_by_order' in obj &&
    'created_on' in obj &&
    'orders' in obj &&
    'product_relations' in obj &&
    'certificate_id' in obj
  );
};

export interface EnrollmentLight {
  id: string;
  is_active: boolean;
  state: EnrollmentState;
  course_run: CourseRun;
  was_created_by_order: boolean;
  created_on: string;
}

// Order
export enum OrderState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CANCELED = 'canceled',
  PENDING = 'pending',
  VALIDATED = 'validated',
}

export const ACTIVE_ORDER_STATES = [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED];

export interface Order {
  id: string;
  created_on: string;
  target_enrollments: Enrollment[];
  main_invoice_reference: string;
  certificate_id?: Certificate['id'];
  contract?: Contract;
  owner: string;
  total: number;
  total_currency: string;
  state: OrderState;
  product_id: Product['id'];
  target_courses: TargetCourse[];
  course: Maybe<CourseLight>;
  enrollment: Maybe<EnrollmentLight>;
  organization_id: Organization['id'];
  organization: Organization;
  order_group_id?: OrderGroup['id'];
}

export interface CredentialOrder extends Order {
  course: CourseLight;
  enrollment: undefined;
}

export interface CredentialOrderWithPaymentInfo extends CredentialOrder {
  payment_info: Payment | PaymentOneClick;
}

export interface CertificateOrder extends Order {
  course: undefined;
  enrollment: EnrollmentLight;
  target_courses: [];
}

export interface CertificateOrderWithPaymentInfo extends CertificateOrder {
  payment_info: Payment | PaymentOneClick;
}

export type OrderLite = Pick<
  Order,
  | 'id'
  | 'created_on'
  | 'state'
  | 'total'
  | 'target_enrollments'
  | 'product_id'
  | 'main_invoice_reference'
  | 'certificate_id'
>;

export interface AbstractNestedOrder {
  id: string;
  organization: Organization;
  product_title: string;
  owner_name: string;
}
export interface NestedCertificateOrder extends AbstractNestedOrder {
  course: undefined;
  enrollment: EnrollmentLight;
}
export const isNestedCredentialOrder = (
  obj: NestedCertificateOrder | NestedCredentialOrder,
): obj is NestedCredentialOrder => {
  return !obj.enrollment && !!obj.course;
};

export interface NestedCredentialOrder extends AbstractNestedOrder {
  course: CourseLight;
  enrollment: undefined;
}

export type OrderEnrollment = Pick<Order, 'id' | 'state' | 'product_id' | 'certificate_id'>;

export interface NestedCourseOrder {
  id: Order['id'];
  created_on: Order['created_on'];
  owner: UserLight;
  course_id: Order['id'];
  product_id: Order['id'];
  state: Order['state'];
  enrollment_id: Enrollment['id'];
  organization: Organization;
  certificate_id?: Order['certificate_id'];
  product: DefinitionResourcesProduct;
  contract: ContractLight;
}

export interface CourseOrderResourceQuery extends PaginatedResourceQuery {
  course_id?: CourseListItem['id'];
  course_product_relation_id?: CourseProductRelation['id'];
  organization_id?: Organization['id'];
  product_id?: Product['id'];
}

export interface OrderGroup {
  id: string;
  is_active: boolean;
  nb_seats: number;
  nb_available_seats: number;
}

export enum CreditCardBrand {
  MASTERCARD = 'Mastercard',
  MAESTRO = 'Maestro',
  VISA = 'Visa',
  CB = 'CB',
}

// Credit Card
export interface CreditCard {
  brand: CreditCardBrand;
  expiration_month: number;
  expiration_year: number;
  id: string;
  is_main: boolean;
  last_numbers: string;
  title?: string;
}

// Address
export interface Address {
  address: string;
  city: string;
  country: string;
  first_name: string;
  last_name: string;
  id: string;
  is_main: boolean;
  postcode: string;
  title: string;
}

// Wishlist
export interface CourseWish extends Resource {
  status: boolean;
}

export interface UserWishlistCreationPayload {
  course: CourseLight['code'];
}

// Payment
export enum PaymentProviders {
  DUMMY = 'dummy',
  PAYPLUG = 'payplug',
}

export interface Payment {
  payment_id: string;
  provider_name: string;
  url: string;
}

export interface PaymentOneClick extends Payment {
  is_paid: boolean;
}

export interface OrderPaymentInfo {
  payment_info: Payment | PaymentOneClick;
}

// - API
export interface AddressCreationPayload extends Omit<Address, 'id' | 'is_main'> {
  is_main?: boolean;
}

interface AbstractOrderProductCreationPayload {
  product_id: Product['id'];
  order_group_id?: OrderGroup['id'];
  has_consent_to_terms: boolean;
}

interface OrderCertificateCreationPayload extends AbstractOrderProductCreationPayload {
  enrollment_id: Enrollment['id'];
}
export interface OrderCredentialCreationPayload extends AbstractOrderProductCreationPayload {
  course_code: CourseLight['code'];
}

export type OrderCreationPayload = OrderCertificateCreationPayload | OrderCredentialCreationPayload;

interface OrderAbortPayload {
  id: Order['id'];
  payment_id?: Payment['payment_id'];
}

interface OrderSubmitPayload {
  id: Order['id'];
  billing_address: Omit<Address, 'id' | 'is_main'>;
  credit_card_id?: CreditCard['id'];
}

export interface PaginatedResourceQuery extends ResourcesQuery {
  page?: number;
  page_size?: number;
}

export interface EnrollmentsQuery extends PaginatedResourceQuery {
  course_run_id?: CourseRun['id'];
  was_created_by_order?: boolean;
}

interface EnrollmentCreationPayload {
  course_run_id: CourseRun['id'];
  is_active: boolean;
  order?: Order['id'];
  was_created_by_order: boolean;
}

interface EnrollmentUpdatePayload extends EnrollmentCreationPayload {
  id: Enrollment['id'];
}

export interface CourseRunFilters extends ResourcesQuery {
  course_id?: CourseListItem['id'];
}

export interface CourseQueryFilters extends ResourcesQuery {
  id?: CourseListItem['id'];
  organization_id?: Organization['id'];
  has_listed_course_runs?: Boolean;
  query?: string;
}
export interface CourseProductQueryFilters extends ResourcesQuery {
  id?: Product['id'];
  course_id?: CourseListItem['id'];
}
export interface CourseProductRelationQueryFilters extends PaginatedResourceQuery {
  id?: CourseProductRelation['id'];
  organization_id?: Organization['id'];
  product_type?: ProductType;
  query?: string;
}

export enum ContractState {
  UNSIGNED = 'unsigned',
  LEARNER_SIGNED = 'half_signed',
  SIGNED = 'signed',
}
export interface ContractResourceQuery extends PaginatedResourceQuery {
  organization_id?: Organization['id'];
  course_product_relation_id?: CourseProductRelation['id'];
  contract_ids?: Contract['id'][];
  signature_state?: ContractState;
}

export interface OrganizationContractSignatureLinksFilters {
  contracts_ids?: string[];
  organization_id: Organization['id'];
  course_product_relation_ids?: CourseProductRelation['id'][];
}

export interface ContractInvitationLinkResponse {
  invitation_link: string;
}

export interface OrganizationContractInvitationLinkResponse extends ContractInvitationLinkResponse {
  contract_ids: Contract['id'][];
}

export interface ApiResourceInterface<
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
> {
  get: (filters?: TResourceQuery) => any;
  create?: (payload: any) => Promise<TData>;
  update?: (payload: any) => Promise<TData>;
  delete?: (id: TData['id']) => Promise<void>;
}

interface APIUser {
  me: {
    get(): Promise<JoanieUserProfile>;
  };
  addresses: {
    create(payload: AddressCreationPayload): Promise<Address>;
    delete(id: Address['id']): Promise<void>;
    get(id: Address['id']): Promise<Address>;
    get(): Promise<Address[]>;
    update(payload: Address): Promise<Address>;
  };
  creditCards: {
    create(payload: Omit<CreditCard, 'id'>): Promise<CreditCard>;
    delete(id: CreditCard['id']): Promise<void>;
    get(filters?: ResourcesQuery): Promise<CreditCard>;
    get(): Promise<CreditCard[]>;
    update(payload: CreditCard): Promise<CreditCard>;
  };
  orders: {
    abort(payload: OrderAbortPayload): Promise<void>;
    create(payload: OrderCreationPayload): Promise<CredentialOrder | CertificateOrder>;
    get<Filters extends OrderResourcesQuery = OrderResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Nullable<CredentialOrder | CertificateOrder>>
      : Promise<PaginatedResponse<CredentialOrder | CertificateOrder>>;
    invoice: {
      download(payload: { order_id: Order['id']; invoice_reference: string }): Promise<File>;
    };
    submit(payload: OrderSubmitPayload): Promise<OrderPaymentInfo>;
    submit_for_signature(id: string): Promise<ContractInvitationLinkResponse>;
  };
  certificates: {
    download(id: string): Promise<File>;
    get<Filters extends PaginatedResourceQuery = PaginatedResourceQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Certificate>
      : Promise<PaginatedResponse<Certificate>>;
  };
  enrollments: {
    create(payload: EnrollmentCreationPayload): Promise<any>;
    get<Filters extends EnrollmentsQuery = EnrollmentsQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Enrollment>
      : Promise<PaginatedResponse<Enrollment>>;
    update(payload: EnrollmentUpdatePayload): Promise<any>;
  };
  wish: {
    get<Filters extends ResourcesQuery = ResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string } ? Promise<Nullable<CourseWish>> : Promise<CourseWish[]>;
    create(id: string): Promise<CourseWish>;
    delete(id: string): Promise<void>;
  };
  contracts: {
    get(
      filters?: ContractResourceQuery,
    ): ContractResourceQuery extends { id: string }
      ? Promise<Nullable<Contract>>
      : Promise<PaginatedResponse<Contract>>;
    download(id: string): Promise<File>;
    zip_archive: {
      check: (id: string) => Promise<Response>;
      create: ({ organization_id }: { organization_id: string }) => Promise<{ url: string }>;
      get: (id: string) => Promise<File>;
    };
  };
}

export interface API {
  user: APIUser;
  courses: {
    get<Filters extends PaginatedResourceQuery = PaginatedResourceQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Nullable<CourseListItem>>
      : Promise<PaginatedResponse<CourseListItem>>;
    products: {
      get(filters?: CourseProductQueryFilters): Promise<Nullable<CourseProductRelation>>;
    };
    orders: {
      get(
        filters?: CourseOrderResourceQuery,
      ): CourseOrderResourceQuery extends { id: string }
        ? Promise<Nullable<NestedCourseOrder>>
        : Promise<PaginatedResponse<NestedCourseOrder>>;
    };
  };
  organizations: {
    get<Filters extends ResourcesQuery = ResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string } ? Promise<Nullable<Organization>> : Promise<Organization[]>;
    contracts: {
      get(
        filters?: ContractResourceQuery,
      ): ContractResourceQuery extends { id: string }
        ? Promise<Nullable<Contract>>
        : Promise<PaginatedResponse<Contract>>;
      getSignatureLinks(
        filters?: OrganizationContractSignatureLinksFilters,
      ): Promise<OrganizationContractInvitationLinkResponse>;
    };
  };
  courseRuns: {
    get(
      filters?: CourseRunFilters,
    ): CourseRunFilters extends { id: string } ? Promise<Nullable<CourseRun>> : Promise<CourseRun>;
  };
  courseProductRelations: {
    get<Filters extends PaginatedResourceQuery = PaginatedResourceQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Nullable<CourseProductRelation>>
      : Promise<PaginatedResponse<CourseProductRelation>>;
  };
  contractDefinitions: {
    previewTemplate(id: string): Promise<File>;
  };
}

export interface Backend {
  endpoint: string;
}
