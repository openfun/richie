import { WebAnalyticsAPI } from 'types/WebAnalytics';

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
  abstract sendEvent(category: string, action: string, label: string, value?: number): void;

  /**
   * Sends the enrolled user to a course event.
   * @param resourceLink the course link that the user have been enrolled
   */
  sendEnrolledEvent(resourceLink: string): void {
    return this.sendEvent('courseEnroll', 'courseEnrollApi', resourceLink);
  }
}
