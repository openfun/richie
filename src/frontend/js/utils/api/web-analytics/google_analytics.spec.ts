/* eslint-disable @typescript-eslint/no-unused-vars */
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import WebAnalyticsAPIHandler from '.';
import GoogleAnalyticsApi from './google_analytics';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    web_analytics_provider: 'google_analytics',
  }).generate(),
}));

describe('Web Analytics', () => {
  beforeAll(() => {
    // Mock the `ga` function so the verification of the presence of the Google Analytics passes.
    (global as any).ga = jest.fn();
  });

  it('returns the Google Analytics API if provider is `google_analytics`', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeDefined();
    expect(api).toBeInstanceOf(GoogleAnalyticsApi);
  });
});
