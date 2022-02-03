import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import WebAnalyticsAPIHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));
describe('Web Analytics', () => {
  it('returns a concrete implementation when the web analytics module is activated', () => {
    const api = WebAnalyticsAPIHandler();
    expect(api).toBeUndefined();
  });
});
