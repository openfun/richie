import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import GoogleTagApi from './google_tag';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    web_analytics_providers: ['google_tag'],
  }).generate(),
}));

describe('Web Analytics', () => {
  beforeAll(() => {
    // Mock the `windows.dataLayer` so the verification of the presence of the Google Tag passes.
    window.dataLayer = [];
  });

  it('returns the Google Tag API if provider is `google_tag`', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeDefined();
    expect(api?.providers).toHaveLength(1);
    expect(api?.providers[0]).toBeInstanceOf(GoogleTagApi);
  });
});
