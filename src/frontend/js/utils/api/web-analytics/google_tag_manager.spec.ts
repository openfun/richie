import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import WebAnalyticsAPIHandler from '.';
import GoogleTagManagerApi from './google_tag_manager';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    web_analytics_provider: 'google_tag_manager',
  }).generate(),
}));

describe('Web Analytics', () => {
  beforeAll(() => {
    // Mock the `windows.dataLayer` so the verification of the presence of the Google Tag Manager passes.
    window.dataLayer = [];
  });

  it('returns the Google Tag Manager API if provider is `google_tag_manager`', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeDefined();
    expect(api).toBeInstanceOf(GoogleTagManagerApi);
  });
});
