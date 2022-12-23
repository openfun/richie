import type { Priority, StateCTA, StateText } from 'types';
import type { Nullable } from 'types/utils';
import { Resource, ResourcesQuery } from 'hooks/useResources';

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

export interface QueryParameters extends PaginatedParameters {}

// - Course Run
export interface CourseRun {
  end: string;
  enrollment_end: string;
  enrollment_start: string;
  id: string;
  resource_link: string;
  start: string;
  state: {
    priority: Priority;
    datetime: Date;
    call_to_action: StateCTA;
    text: StateText;
  };
  title: string;
  course?: Course;
}

// - Certificate
export interface CertificateDefinition {
  id: number;
  title: string;
  description: string;
}

// - Organization
export interface Organization {
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
  type: ProductType;
  price: number;
  price_currency: string;
  call_to_action: string;
  certificate: CertificateDefinition;
  target_courses: Omit<Course, 'products'>[];
  orders: Order['id'][];
}

// - Course
export interface CourseProductTargetCourse {
  code: string;
  organization: Organization;
  title: string;
  course_runs: Array<CourseRun>;
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

export interface CourseProduct extends Product {
  order: Nullable<OrderLite>;
  target_courses: CourseProductTargetCourse[];
}

export interface Course {
  code: string;
  organization: Organization;
  title: string;
  products: CourseProduct[];
  course_runs: CourseRun[];
  orders?: OrderLite[];
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
}

// Order
export enum OrderState {
  CANCELED = 'canceled',
  FAILED = 'failed',
  PENDING = 'pending',
  VALIDATED = 'validated',
}

export interface Order {
  id: string;
  course?: Course;
  created_on: string;
  enrollments: Enrollment[];
  main_proforma_invoice: string;
  certificate?: string;
  owner: string;
  total: number;
  total_currency: string;
  state: OrderState;
  product: string;
  target_courses: Omit<Course, 'products'>[];
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

// - API
export interface AddressCreationPayload extends Omit<Address, 'id' | 'is_main'> {
  is_main?: boolean;
}

interface OrderCreationPayload {
  product: Product['id'];
  course: Course['code'];
  billing_address?: Omit<Address, 'id' | 'is_main'>;
  credit_card_id?: CreditCard['id'];
}

interface OrderAbortPayload {
  id: Order['id'];
  payment_id?: Payment['payment_id'];
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

export interface ApiResourceInterface<
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
> {
  get: (filters?: TResourceQuery) => any;
  create?: (payload: any) => Promise<TData>;
  update?: (payload: TData) => Promise<TData>;
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
    create(payload: OrderCreationPayload): Promise<OrderWithPaymentInfo>;
    get<Filters extends ResourcesQuery = ResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Nullable<Order>>
      : Promise<PaginatedResponse<Nullable<Order>>>;
    invoice: {
      download(payload: { order_id: Order['id']; invoice_reference: string }): Promise<File>;
    };
  };
  certificates: {
    download(id: string): Promise<File>;
  };
  enrollments: {
    create(payload: EnrollmentCreationPayload): Promise<any>;
    get<Filters extends ResourcesQuery = ResourcesQuery>(
      filters?: Filters,
    ): Filters extends { id: string }
      ? Promise<Enrollment>
      : Promise<PaginatedResponse<Enrollment>>;
    update(payload: EnrollmentUpdatePayload): Promise<any>;
  };
}

export interface API {
  user: APIUser;
  products: {
    get(filters?: ResourcesQuery): Promise<Nullable<Product>>;
  };
}

export interface Backend {
  endpoint: string;
}
