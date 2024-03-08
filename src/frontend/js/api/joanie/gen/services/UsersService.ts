/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { User } from '../models/User';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class UsersService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * User ViewSet
   * @param id
   * @returns User
   * @throws ApiError
   */
  public usersRetrieve(
    id: string,
  ): CancelablePromise<User> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/users/{id}/',
      path: {
        'id': id,
      },
    });
  }

  /**
   * Return information on currently logged user
   * @returns User
   * @throws ApiError
   */
  public usersMeRetrieve(): CancelablePromise<User> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/api/v1.0/users/me/',
    });
  }

}
