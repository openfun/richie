import { CourseProductEvent, WebAnalyticsAPI } from 'types/web-analytics';

/**
 * Base implementation for each web analytics provider.
 */
export abstract class BaseWebAnalyticsApi implements WebAnalyticsAPI {
  /**
   * Abstract method to send events by the overridden web analytics API providers.
   * @param category the category of the event
   * @param action the action that the user has performed or the action of the event.
   * @param label additional info about specific elements to identify a product like the course run.
   * @param value
   */
  abstract sendEvent(
    eventName: string,
    category: string,
    action: string,
    label: string,
    value?: number,
  ): void;

  /**
   * Sends the enrolled user to a course event.
   * @param resourceLink the course link that the user have been enrolled
   */
  sendEnrolledEvent(resourceLink: string): void {
    return this.sendEvent('courseEnroll', 'courseEnroll', 'courseEnrollApi', resourceLink);
  }

  /**
   * Method to send all events related to interactions with a product.
   *
   * The product key is composed of the course code concatenated with the product id
   * `<course_code>+<product_id>`.
   */
  sendCourseProductEvent(category: CourseProductEvent, productKey: string): void {
    return this.sendEvent('courseProductEvent', category, '', productKey);
  }
}
