/**
 * Interface for every the Web Analytics API.
 * Each web analytics provider should implement this interface
 * to adapt the calls from React to the external JS.
 */
export interface WebAnalyticsAPI {
  /**
   * Sends the enrolled user to a course event.
   * @param resourceLink the course link that the user have been enrolled
   */
  sendEnrolledEvent(resourceLink: string): void;
}

export enum WebAnalyticsAPIBackend {
  GOOGLE_UNIVERSAL_ANALYTICS = 'google_universal_analytics',
  GOOGLE_TAG = 'google_tag',
  GOOGLE_TAG_MANAGER = 'google_tag_manager',
}
