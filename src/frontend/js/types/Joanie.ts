import type { CourseState } from 'types';
import type { Nullable } from 'types/utils';
import { Resource, ResourcesQuery } from 'hooks/useResources';
import { OrderResourcesQuery } from 'hooks/useOrders';
import { Course as RichieCourse } from 'types/Course';

// - Generic
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  prev: string | null;
  results: Array<T>;
}

export interface PaginatedParameters {
  page: number;
  offset: number;
}

export interface Organization {
  id: string;
  code: string;
  title: string;
  logo: JoanieFile;
}

export interface Contract {
  id: string;
  learner_name: string;
  product_title: string;
  sign_date: string;
}

export interface CourseListItem extends Resource {
  id: string;
  title: string;
  code: string;
  course_runs: CourseRun[];
  organizations: Organization[];
  selling_organizations: Organization[];
  cover: JoanieFile;
  products: Product[];
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
  order: Order;
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
  ENROLLMENT = 'enrollment',
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
}

export interface CourseProduct extends Product {
  order: Nullable<OrderLite>;
  target_courses: TargetCourse[];
}

export interface CourseProductRelation {
  id: string;
  course: CourseProductRelationCourse;
  organizations: Organization[];
  product: Product;
  created_on: string;
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
  cover?: JoanieFile;
}

export type CourseProductRelationCourse = Pick<AbstractCourse, 'id' | 'code' | 'title' | 'cover'>;

export interface TargetCourse extends AbstractCourse {
  is_graded: boolean;
  position: number;
}

export interface CourseLight extends AbstractCourse {
  products: CourseProduct[];
  orders?: OrderLite[];
}

export type OrderLite = Pick<
  Order,
  | 'id'
  | 'created_on'
  | 'state'
  | 'total'
  | 'enrollments'
  | 'product'
  | 'main_proforma_invoice'
  | 'certificate'
>;

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
  products: Product[];
}

// Order
export enum OrderState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  CANCELED = 'canceled',
  PENDING = 'pending',
  VALIDATED = 'validated',
}

export interface Order {
  id: string;
  course?: CourseLight['code'] | CourseLight;
  created_on: string;
  enrollments: Enrollment[];
  main_proforma_invoice: string;
  certificate?: string;
  owner: string;
  total: number;
  total_currency: string;
  state: OrderState;
  product: Product['id'];
  target_courses: TargetCourse[];
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
  provider: string;
  url: string;
}

export interface PaymentOneClick extends Payment {
  is_paid: boolean;
}

export interface OrderWithPaymentInfo extends Order {
  payment_info: Payment | PaymentOneClick;
}

export interface OrderPaymentInfo {
  payment_info: Payment | PaymentOneClick;
}

// - API
export interface AddressCreationPayload extends Omit<Address, 'id' | 'is_main'> {
  is_main?: boolean;
}

interface OrderCreationPayload {
  product: Product['id'];
  course: CourseLight['code'];
}

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
  was_created_by_order?: boolean;
}

interface EnrollmentCreationPayload {
  course_run: CourseRun['id'];
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
  organization_id?: Organization['id'];
  has_listed_course_runs?: Boolean;
}
export interface CourseProductQueryFilters extends ResourcesQuery {
  productId?: Product['id'];
}
export interface CourseProductRelationQueryFilters extends ResourcesQuery {
  organization_id?: Organization['id'];
}
export interface ContractFilters extends PaginatedResourceQuery {
  organization_id?: Organization['id'];
  course_id?: CourseListItem['id'];
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
    create(payload: OrderCreationPayload): Promise<Order>;
    get<Filters extends OrderResourcesQuery = OrderResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Nullable<Order>>
      : Promise<PaginatedResponse<Order>>;
    invoice: {
      download(payload: { order_id: Order['id']; invoice_reference: string }): Promise<File>;
    };
    submit(payload: OrderSubmitPayload): Promise<OrderPaymentInfo>;
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
  organizations: {
    get<Filters extends ResourcesQuery = ResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string } ? Promise<Nullable<Organization>> : Promise<Organization[]>;
  };
  contracts: {
    get(
      filters?: ContractFilters,
    ): ContractFilters extends { id: string }
      ? Promise<Nullable<Contract>>
      : Promise<PaginatedResponse<Contract[]>>;
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
}

export interface Backend {
  endpoint: string;
}
