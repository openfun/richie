/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreditCard } from '../models/CreditCard';
import type { CreditCardRequest } from '../models/CreditCardRequest';
import type { PaginatedCreditCardList } from '../models/PaginatedCreditCardList';
import type { PatchedCreditCardRequest } from '../models/PatchedCreditCardRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CreditCardsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API views allows to get all credit cards, update or delete one
   * for the authenticated user.
   *
   * GET /api/credit-cards/
   * Return the list of all credit cards owned by the authenticated user
   *
   * PUT /api/credit-cards/<credit_card_id> with expected data:
   * - title: str
   * - is_main?: bool
   *
   * DELETE /api/credit-cards/<credit_card_id>
   * Delete the selected credit card
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedCreditCardList
   * @throws ApiError
   */
  public creditCardsList(
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedCreditCardList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/credit-cards/',
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API views allows to get all credit cards, update or delete one
   * for the authenticated user.
   *
   * GET /api/credit-cards/
   * Return the list of all credit cards owned by the authenticated user
   *
   * PUT /api/credit-cards/<credit_card_id> with expected data:
   * - title: str
   * - is_main?: bool
   *
   * DELETE /api/credit-cards/<credit_card_id>
   * Delete the selected credit card
   * @param id
   * @returns CreditCard
   * @throws ApiError
   */
  public creditCardsRetrieve(
    id: string,
  ): CancelablePromise<CreditCard> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/credit-cards/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * API views allows to get all credit cards, update or delete one
   * for the authenticated user.
   *
   * GET /api/credit-cards/
   * Return the list of all credit cards owned by the authenticated user
   *
   * PUT /api/credit-cards/<credit_card_id> with expected data:
   * - title: str
   * - is_main?: bool
   *
   * DELETE /api/credit-cards/<credit_card_id>
   * Delete the selected credit card
   * @param id
   * @param requestBody
   * @returns CreditCard
   * @throws ApiError
   */
  public creditCardsUpdate(
    id: string,
    requestBody?: CreditCardRequest,
  ): CancelablePromise<CreditCard> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/credit-cards/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API views allows to get all credit cards, update or delete one
   * for the authenticated user.
   *
   * GET /api/credit-cards/
   * Return the list of all credit cards owned by the authenticated user
   *
   * PUT /api/credit-cards/<credit_card_id> with expected data:
   * - title: str
   * - is_main?: bool
   *
   * DELETE /api/credit-cards/<credit_card_id>
   * Delete the selected credit card
   * @param id
   * @param requestBody
   * @returns CreditCard
   * @throws ApiError
   */
  public creditCardsPartialUpdate(
    id: string,
    requestBody?: PatchedCreditCardRequest,
  ): CancelablePromise<CreditCard> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/credit-cards/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API views allows to get all credit cards, update or delete one
   * for the authenticated user.
   *
   * GET /api/credit-cards/
   * Return the list of all credit cards owned by the authenticated user
   *
   * PUT /api/credit-cards/<credit_card_id> with expected data:
   * - title: str
   * - is_main?: bool
   *
   * DELETE /api/credit-cards/<credit_card_id>
   * Delete the selected credit card
   * @param id
   * @returns void
   * @throws ApiError
   */
  public creditCardsDestroy(
    id: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/credit-cards/{id}/',
      path: {
        'id': id,
      },
    });
  }

}
