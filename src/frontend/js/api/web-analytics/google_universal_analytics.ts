/* eslint-disable class-methods-use-this */
import { BaseWebAnalyticsApi } from './base';

/**
 *
 * Google Analytics Richie Web Analytics API Implementation
 *
 * This implementation is used when web analytics is configured has `google_analytics`.
 * It will send events to the google analytics.
 *
 */
export default class GoogleAnalyticsApi extends BaseWebAnalyticsApi {
  ga: Exclude<typeof ga, undefined>;

  constructor() {
    super();
    if (ga === undefined) {
      throw new Error('Incorrect configuration on Google Analytics on Web Analytics.');
    }
    this.ga = ga;
  }

  sendEvent(
    eventName: string,
    category: string,
    action: string,
    label: string,
    value?: number,
  ): void {
    this.ga('send', 'event', category, action, label, value);
  }
}
