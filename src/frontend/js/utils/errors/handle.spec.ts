/**
 * @jest-environment jsdom
 */
import * as Sentry from '@sentry/browser';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { handle } from './handle';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    sentry_dsn: 'https://sentry.local.test',
  }).one(),
}));
jest.mock('@sentry/browser', () => ({
  init: jest.fn(),
  configureScope: jest.fn(),
  captureException: jest.fn(),
}));

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
