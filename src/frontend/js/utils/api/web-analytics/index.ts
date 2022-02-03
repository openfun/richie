import { Maybe } from 'types/utils';
import { WebAnalyticsAPI, WebAnalyticsAPIBackend } from 'types/WebAnalytics';
import context from 'utils/context';
import { handle } from 'utils/errors/handle';
import GoogleAnalyticsApi from './google_analytics';
import GoogleTagManagerApi from './google_tag_manager';

const WEB_ANALYTICS_PROVIDER = context?.web_analytics_provider;

const WebAnalyticsAPIHandler = (): Maybe<WebAnalyticsAPI> => {
  try {
    switch (WEB_ANALYTICS_PROVIDER) {
      case WebAnalyticsAPIBackend.GOOGLE_ANALYTICS:
        return new GoogleAnalyticsApi();
      case WebAnalyticsAPIBackend.GOOGLE_TAG_MANAGER:
        return new GoogleTagManagerApi();
    }
  } catch (error) {
    handle(error);
  }
  return undefined;
};

export default WebAnalyticsAPIHandler;
