/**
 * @jest-environment jsdom
 */
import * as Sentry from '@sentry/browser';
import { ContextFactory } from 'utils/test/factories';

jest.mock('@sentry/browser');

describe('handle', () => {
  (window as any).__richie_frontend_context__ = {
    context: {
      sentry_dsn: 'https://sentry.richie',
      environment: 'test',
    },
  };

  const { handle } = require('./handle');

  it('should initialize sentry', () => {
    expect(Sentry.init).toBeCalledTimes(1);
    expect(Sentry.configureScope).toBeCalledTimes(1);
  });

  it('should report error to sentry', () => {
    handle('An error for test');
    expect(Sentry.captureException).toBeCalledTimes(1);
  });
});
