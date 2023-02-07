/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Order } from '../models/Order';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class OrdersService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API view for a user to consult the orders he/she owns or create a new one.
   * GET /api/orders/
   * Return list of all orders for a user with pagination
   *
   * POST /api/orders/ with expected data:
   * - course: course code
   * - product: product id (product must be associated to the course. Otherwise,
   * a 400 error is returned)
   * Return new order just created
   * @param product
   * @param course
   * @param state
   * @param page A page number within the paginated result set.
   * @returns any
   * @throws ApiError
   */
  public ordersList(
    product?: string,
    course?: string,
    state?: string,
    page?: number,
  ): CancelablePromise<{
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Order>;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/orders/',
      query: {
        'product': product,
        'course': course,
        'state': state,
        'page': page,
      },
    });
  }

  /**
   * Try to create an order and a related payment if the payment is fee.
   * @param data
   * @returns Order
   * @throws ApiError
   */
  public ordersCreate(
    data: Order,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/orders/',
      body: data,
    });
  }

  /**
   * API view for a user to consult the orders he/she owns or create a new one.
   * GET /api/orders/
   * Return list of all orders for a user with pagination
   *
   * POST /api/orders/ with expected data:
   * - course: course code
   * - product: product id (product must be associated to the course. Otherwise,
   * a 400 error is returned)
   * Return new order just created
   * @param id
   * @returns Order
   * @throws ApiError
   */
  public ordersRead(
    id: string,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/orders/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Abort a pending order and the related payment if there is one.
   * @param id
   * @param data
   * @returns Order
   * @throws ApiError
   */
  public ordersAbort(
    id: string,
    data: Order,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/orders/{id}/abort/',
      path: {
        'id': id,
      },
      body: data,
    });
  }

  /**
   * Retrieve an invoice through its reference if it is related to
   * the order instance and owned by the authenticated user.
   * @param id
   * @returns Order
   * @throws ApiError
   */
  public ordersInvoice(
    id: string,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/orders/{id}/invoice/',
      path: {
        'id': id,
      },
    });
  }

}
