import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory().one(),
}));
describe('Web Analytics', () => {
  it('returns a concrete implementation when the web analytics module is activated', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeUndefined();
  });
});
