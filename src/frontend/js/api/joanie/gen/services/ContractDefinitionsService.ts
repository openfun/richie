/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class ContractDefinitionsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Return the contract definition in PDF in bytes.
   * @param id
   * @returns binary
   * @throws ApiError
   */
  public contractDefinitionsPreviewTemplateRetrieve(
    id: string,
  ): CancelablePromise<Blob> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/contract_definitions/{id}/preview_template/',
      path: {
        'id': id,
      },
    });
  }

}
