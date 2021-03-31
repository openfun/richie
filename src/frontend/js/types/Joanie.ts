// Course Run
export interface CourseRun {
  end: Date;
  enrollment_end: Date;
  enrollment_start: Date;
  position: number;
  resource_link: string;
  start: Date;
  title: string;
}

// Generic
export interface PaginatedResults<T> {
  count: number;
  next: string | null;
  prev: string | null;
  results: Array<T>;
}

interface PaginatedParams {
  page: number;
  offset: number;
}

interface ParamsOptions extends PaginatedParams {}

// Product
export interface Product {
  course_runs: CourseRun[];
  id: string;
  title: string;
  price: string;
  description: string;
  call_to_action: string;
}

// Order
export enum OrderState {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

export interface Order {
  id: string;
  creation_date: Date;
  state: OrderState;
  owner: string;
  product_id: string;
  course_runs: CourseRun[];
}

export interface OrderCreateBody {
  product_id: string;
  resource_link: string[];
}

type OrderCreationResponse = Promise<Order>;

type OrderResponse = Promise<Order | PaginatedResults<Order>>;

// type CourseProductResponse = Promise<PaginatedResults<Product>>;
export type CourseProductResponse = Promise<PaginatedResults<Product>>;

export interface Backend {
  endpoint: string;
}

export interface API {
  orders: {
    create: (
      product_id: string,
      resource_links: string[],
      options: ParamsOptions,
    ) => OrderCreationResponse;
    get: (orderId: string, options: ParamsOptions) => OrderResponse;
  };
  course: {
    products: {
      get: (courseId: string, options: ParamsOptions) => CourseProductResponse;
    };
  };
}
