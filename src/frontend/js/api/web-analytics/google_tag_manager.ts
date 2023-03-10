/* eslint-disable class-methods-use-this */
import { BaseWebAnalyticsApi } from './base';

/**
 *
 * Google Tag Manager Richie Web Analytics API Implementation
 *
 * This implementation is used when web analytics is configured has `google_tag_manager`.
 * It will send events to the google tag manager.
 *
 */
export default class GoogleTagManagerApi extends BaseWebAnalyticsApi {
  dataLayer: Exclude<typeof window.dataLayer, undefined>;

  constructor() {
    super();
    if (window.dataLayer === undefined) {
      throw new Error('Incorrect configuration on Google Tag Manager on Web Analytics.');
    }
    this.dataLayer = window.dataLayer;
  }
  sendEvent(
    eventName: string,
    category: string,
    action: string,
    label: string,
    value?: number,
  ): void {
    this.dataLayer.push({
      event: eventName,
      eventProps: {
        category,
        action,
        label,
        value,
      },
    });
  }
}
