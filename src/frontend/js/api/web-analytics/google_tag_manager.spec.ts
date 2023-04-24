import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import GoogleTagManagerApi from './google_tag_manager';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    web_analytics_providers: ['google_tag_manager'],
  }).one(),
}));

describe('Web Analytics', () => {
  beforeAll(() => {
    // Mock the `windows.dataLayer` so the verification of the presence of the Google Tag Manager passes.
    window.dataLayer = [];
  });

  it('returns the Google Tag Manager API if provider is `google_tag_manager`', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeDefined();
    expect(api?.providers).toHaveLength(1);
    expect(api?.providers[0]).toBeInstanceOf(GoogleTagManagerApi);
  });
});
