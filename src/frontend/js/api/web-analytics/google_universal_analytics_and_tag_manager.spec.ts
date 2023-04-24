/* eslint-disable @typescript-eslint/no-unused-vars */
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import GoogleAnalyticsApi from './google_universal_analytics';
import GoogleTagManagerApi from './google_tag_manager';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    web_analytics_providers: ['google_universal_analytics', 'google_tag_manager'],
  }).one(),
}));

describe('Web Analytics', () => {
  beforeAll(() => {
    // Mock the `ga` function so the verification of the presence of the Google Analytics passes.
    (global as any).ga = jest.fn();

    // Mock the `windows.dataLayer` so the verification of the presence of the Google Tag Manager passes.
    window.dataLayer = [];
  });

  it('returns the Google Analytics API if provider is `google_universal_analytics`', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeDefined();
    expect(api?.providers).toHaveLength(2);
    expect(api?.providers[0]).toBeInstanceOf(GoogleAnalyticsApi);
    expect(api?.providers[1]).toBeInstanceOf(GoogleTagManagerApi);
  });
});
