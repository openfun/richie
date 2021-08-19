import * as Sentry from '@sentry/browser';
import { CaptureContext } from '@sentry/types';
import context from 'utils/context';

if (context?.sentry_dsn) {
  Sentry.init({
    dsn: context.sentry_dsn,
    environment: context.environment,
    release: RICHIE_VERSION,
  });
  Sentry.configureScope((scope) => scope.setExtra('application', 'frontend'));
}

/**
 * Generic error handler to be called whenever we need to do error reporting throughout the app.
 * Passes errors to Sentry if available, logs the error to the console otherwise.
 */
export const handle = (error: unknown, errorContext?: CaptureContext) => {
  if (context?.sentry_dsn) {
    Sentry.captureException(error, errorContext);
  } else {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
