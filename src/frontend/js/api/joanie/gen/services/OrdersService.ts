/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Order } from '../models/Order';
import type { OrderRequest } from '../models/OrderRequest';
import type { PaginatedOrderList } from '../models/PaginatedOrderList';
import type { PatchedOrderRequest } from '../models/PatchedOrderRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class OrdersService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API view for a user to consult the orders he/she owns or create a new one.
   *
   * GET /api/orders/
   * Return list of all orders for a user with pagination
   *
   * POST /api/orders/ with expected data:
   * - course: course code
   * - product: product id (product must be associated to the course. Otherwise,
   * a 400 error is returned)
   * Return new order just created
   *
   * POST /api/orders/:order_id/submit_for_signature/
   * Return an invitation link to sign the contract definition
   * @param courseCode
   * @param enrollmentId
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @param productId
   * @param productType * `credential` - Credential
   * * `enrollment` - Enrollment
   * * `certificate` - Certificate
   * @param productTypeExclude * `credential` - Credential
   * * `enrollment` - Enrollment
   * * `certificate` - Certificate
   * @param query
   * @param state * `draft` - Draft
   * * `submitted` - Submitted
   * * `pending` - Pending
   * * `canceled` - Canceled
   * * `validated` - Validated
   * @param stateExclude * `draft` - Draft
   * * `submitted` - Submitted
   * * `pending` - Pending
   * * `canceled` - Canceled
   * * `validated` - Validated
   * @returns PaginatedOrderList
   * @throws ApiError
   */
  public ordersList(
    courseCode?: string,
    enrollmentId?: string,
    page?: number,
    pageSize?: number,
    productId?: string,
    productType?: Array<'certificate' | 'credential' | 'enrollment'>,
    productTypeExclude?: Array<'certificate' | 'credential' | 'enrollment'>,
    query?: string,
    state?: Array<'canceled' | 'draft' | 'pending' | 'submitted' | 'validated'>,
    stateExclude?: Array<'canceled' | 'draft' | 'pending' | 'submitted' | 'validated'>,
  ): CancelablePromise<PaginatedOrderList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/orders/',
      query: {
        'course_code': courseCode,
        'enrollment_id': enrollmentId,
        'page': page,
        'page_size': pageSize,
        'product_id': productId,
        'product_type': productType,
        'product_type_exclude': productTypeExclude,
        'query': query,
        'state': state,
        'state_exclude': stateExclude,
      },
    });
  }

  /**
   * Try to create an order and a related payment if the payment is fee.
   * @param requestBody
   * @returns Order
   * @throws ApiError
   */
  public ordersCreate(
    requestBody: OrderRequest,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/orders/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API view for a user to consult the orders he/she owns or create a new one.
   *
   * GET /api/orders/
   * Return list of all orders for a user with pagination
   *
   * POST /api/orders/ with expected data:
   * - course: course code
   * - product: product id (product must be associated to the course. Otherwise,
   * a 400 error is returned)
   * Return new order just created
   *
   * POST /api/orders/:order_id/submit_for_signature/
   * Return an invitation link to sign the contract definition
   * @param id
   * @returns Order
   * @throws ApiError
   */
  public ordersRetrieve(
    id: string,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/orders/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Change the state of the order to pending
   * @param id
   * @param requestBody
   * @returns Order
   * @throws ApiError
   */
  public ordersAbortCreate(
    id: string,
    requestBody: OrderRequest,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/orders/{id}/abort/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Change the state of the order to cancelled
   * @param id
   * @param requestBody
   * @returns Order
   * @throws ApiError
   */
  public ordersCancelCreate(
    id: string,
    requestBody: OrderRequest,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/orders/{id}/cancel/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Retrieve an invoice through its reference if it is related to
   * the order instance and owned by the authenticated user.
   * @param id
   * @returns Order
   * @throws ApiError
   */
  public ordersInvoiceRetrieve(
    id: string,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/orders/{id}/invoice/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Submit a draft order if the conditions are filled
   * @param id
   * @param requestBody
   * @returns Order
   * @throws ApiError
   */
  public ordersSubmitPartialUpdate(
    id: string,
    requestBody?: PatchedOrderRequest,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/orders/{id}/submit/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Create the contract of a product's order that has a contract definition and submit
   * the contract to the signature provider. It returns a one-time use invitation link.
   * @param id
   * @returns Order
   * @throws ApiError
   */
  public ordersSubmitForSignatureCreate(
    id: string,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/orders/{id}/submit_for_signature/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Validate the order
   * @param id
   * @param requestBody
   * @returns Order
   * @throws ApiError
   */
  public ordersValidateUpdate(
    id: string,
    requestBody: OrderRequest,
  ): CancelablePromise<Order> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/orders/{id}/validate/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

}
