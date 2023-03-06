/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Address } from '../models/Address';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class AddressesService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
   * @returns any
   * @throws ApiError
   */
  public addressesList(
    page?: number,
  ): CancelablePromise<{
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Address>;
  }> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/addresses/',
      query: {
        'page': page,
      },
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
   * @param data
   * @returns Address
   * @throws ApiError
   */
  public addressesCreate(
    data: Address,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/addresses/',
      body: data,
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
  public addressesRead(
    id: string,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/addresses/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
   * @param data
   * @returns Address
   * @throws ApiError
   */
  public addressesUpdate(
    id: string,
    data: Address,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/addresses/{id}/',
      path: {
        'id': id,
      },
      body: data,
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
   * @param data
   * @returns Address
   * @throws ApiError
   */
  public addressesPartialUpdate(
    id: string,
    data: Address,
  ): CancelablePromise<Address> {
    return this.httpRequest.request({
      method: 'PATCH',
      url: '/addresses/{id}/',
      path: {
        'id': id,
      },
      body: data,
    });
  }

  /**
   * API view allows to get all addresses or create or update a new one for a user.
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
   * @returns void
   * @throws ApiError
   */
  public addressesDelete(
    id: string,
  ): CancelablePromise<void> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/addresses/{id}/',
      path: {
        'id': id,
      },
    });
  }

}
