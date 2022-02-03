import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    web_analytics_provider: 'unknown_provider',
  }).generate(),
}));
describe('Web Analytics', () => {
  it('returns undefined when an unknown provider for the frontend code is activated', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeUndefined();
  });
});
