import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    web_analytics_providers: ['unknown_provider'],
  }).generate(),
}));
describe('Web Analytics', () => {
  it('returns undefined when an unknown provider for the frontend code is activated', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeUndefined();
  });
});
