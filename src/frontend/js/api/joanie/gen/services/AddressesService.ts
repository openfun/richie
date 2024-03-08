/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from '../models/Address';
import type { AddressRequest } from '../models/AddressRequest';
import type { PaginatedAddressList } from '../models/PaginatedAddressList';
import type { PatchedAddressRequest } from '../models/PatchedAddressRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class AddressesService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API view allows to get all addresses or create or update a new one for a user.
   *
   * GET /api/addresses/
   * Return list of all addresses for a user
   *
   * POST /api/addresses/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return new address just created
   *
   * PUT /api/addresses/<address_id>/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return address just updated
   *
   * DELETE /api/addresses/<address_id>/
   * Delete selected address
   * @param page A page number within the paginated result set.
   * @param pageSize Number of results to return per page.
   * @returns PaginatedAddressList
   * @throws ApiError
   */
  public addressesList(
    page?: number,
    pageSize?: number,
  ): CancelablePromise<PaginatedAddressList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/addresses/',
      query: {
        'page': page,
        'page_size': pageSize,
      },
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
   *
   * GET /api/addresses/
   * Return list of all addresses for a user
   *
   * POST /api/addresses/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return new address just created
   *
   * PUT /api/addresses/<address_id>/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return address just updated
   *
   * DELETE /api/addresses/<address_id>/
   * Delete selected address
   * @param requestBody
   * @returns Address
   * @throws ApiError
   */
  public addressesCreate(
    requestBody: AddressRequest,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/addresses/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
   *
   * GET /api/addresses/
   * Return list of all addresses for a user
   *
   * POST /api/addresses/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return new address just created
   *
   * PUT /api/addresses/<address_id>/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return address just updated
   *
   * DELETE /api/addresses/<address_id>/
   * Delete selected address
   * @param id
   * @returns Address
   * @throws ApiError
   */
  public addressesRetrieve(
    id: string,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/addresses/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
   *
   * GET /api/addresses/
   * Return list of all addresses for a user
   *
   * POST /api/addresses/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return new address just created
   *
   * PUT /api/addresses/<address_id>/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return address just updated
   *
   * DELETE /api/addresses/<address_id>/
   * Delete selected address
   * @param id
   * @param requestBody
   * @returns Address
   * @throws ApiError
   */
  public addressesUpdate(
    id: string,
    requestBody: AddressRequest,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/api/v1.0/addresses/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
   *
   * GET /api/addresses/
   * Return list of all addresses for a user
   *
   * POST /api/addresses/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return new address just created
   *
   * PUT /api/addresses/<address_id>/ with expected data:
   * - address: str
   * - city: str
   * - country: str, country code
   * - first_name: str, recipient first name
   * - last_name: str, recipient last name
   * - is_main?: bool, if True set address as main
   * - postcode: str
   * - title: str, address title
   * Return address just updated
   *
   * DELETE /api/addresses/<address_id>/
   * Delete selected address
   * @param id
   * @param requestBody
   * @returns Address
   * @throws ApiError
   */
  public addressesPartialUpdate(
    id: string,
    requestBody?: PatchedAddressRequest,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/api/v1.0/addresses/{id}/',
      path: {
        'id': id,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }

  /**
   * Delete an address for user authenticated. If the address is linked to
   * invoices it is not deleted but marked as not reusable.
   * @param id
   * @returns void
   * @throws ApiError
   */
  public addressesDestroy(
    id: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/api/v1.0/addresses/{id}/',
      path: {
        'id': id,
      },
    });
  }

}
