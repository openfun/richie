/**
 * @jest-environment jsdom
 */
import * as Sentry from '@sentry/browser';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import { handle } from './handle';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    sentry_dsn: 'https://sentry.local.test',
  }).generate(),
}));
jest.mock('@sentry/browser');

describe('handle', () => {
  it('should initialize sentry', () => {
    expect(Sentry.init).toBeCalledTimes(1);
    expect(Sentry.configureScope).toBeCalledTimes(1);
  });

  it('should report error to sentry', () => {
    handle(new Error('An error for test'));
    expect(Sentry.captureException).toBeCalledTimes(1);
  });
});
