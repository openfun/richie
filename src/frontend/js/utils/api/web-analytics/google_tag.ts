/* eslint-disable class-methods-use-this */
import { BaseWebAnalyticsApi } from './base';

/**
 *
 * Google Tag Richie Web Analytics API Implementation
 *
 * This implementation is used when web analytics is configured has `google_tag`.
 * It will send events to the google analytics.
 *
 */
export default class GoogleTagApi extends BaseWebAnalyticsApi {
  dataLayer: Exclude<typeof window.dataLayer, undefined>;

  constructor() {
    super();
    if (window.dataLayer === undefined) {
      throw new Error('Incorrect configuration on Google Tag on Web Analytics.');
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
