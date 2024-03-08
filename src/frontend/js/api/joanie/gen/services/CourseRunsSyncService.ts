/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class CourseRunsSyncService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * View for the web hook to create or update course runs based on their resource link.
   *
   * - A new course run is created or the existing course run is updated
   *
   * Parameters
   * ----------
   * request : Type[django.http.request.HttpRequest]
   * The request on the API endpoint, it should contain a payload with course run fields.
   *
   * Returns
   * -------
   * Type[rest_framework.response.Response]
   * HttpResponse acknowledging the success or failure of the synchronization operation.
   * @returns any No response body
   * @throws ApiError
   */
  public courseRunsSyncCreate(): CancelablePromise<any> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/api/v1.0/course-runs-sync/',
    });
  }

}
