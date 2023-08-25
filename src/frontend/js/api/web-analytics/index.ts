import { Maybe } from 'types/utils';
import { CourseProductEvent, WebAnalyticsAPI, WebAnalyticsAPIBackend } from 'types/web-analytics';
import context from 'utils/context';
import { handle } from 'utils/errors/handle';
import GoogleTagManagerApi from './google_tag_manager';
import GoogleTagApi from './google_tag';
import GoogleUniversalAnalyticsApi from './google_universal_analytics';

const WEB_ANALYTICS_PROVIDERS = context?.web_analytics_providers;

/**
 * Delegate event calls to all configured web analytics providers.
 */
class WebAnalyticsAPIDelegator2Providers implements WebAnalyticsAPI {
  providers: WebAnalyticsAPI[];
  constructor(providers: WebAnalyticsAPI[]) {
    this.providers = providers;
  }

  sendEnrolledEvent(resourceLink: string): void {
    this.providers.forEach((provider) => provider.sendEnrolledEvent(resourceLink));
  }

  sendCourseProductEvent(category: CourseProductEvent, productKey: string): void {
    this.providers.forEach((provider) => provider.sendCourseProductEvent(category, productKey));
  }
}

const WebAnalyticsAPIHandler = (): Maybe<WebAnalyticsAPIDelegator2Providers> => {
  const providers: WebAnalyticsAPI[] = [];
  try {
    if (WEB_ANALYTICS_PROVIDERS?.includes(WebAnalyticsAPIBackend.GOOGLE_UNIVERSAL_ANALYTICS)) {
      providers.push(new GoogleUniversalAnalyticsApi());
    }
    if (WEB_ANALYTICS_PROVIDERS?.includes(WebAnalyticsAPIBackend.GOOGLE_TAG)) {
      providers.push(new GoogleTagApi());
    }
    if (WEB_ANALYTICS_PROVIDERS?.includes(WebAnalyticsAPIBackend.GOOGLE_TAG_MANAGER)) {
      providers.push(new GoogleTagManagerApi());
    }
  } catch (error) {
    handle(error);
  }
  return providers.length === 0 ? undefined : new WebAnalyticsAPIDelegator2Providers(providers);
};

export default WebAnalyticsAPIHandler;
