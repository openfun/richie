import { Nullable } from 'utils/types';

/**
 * Common data properties that are passed by the backend to all React components as they are
 * instantiated.
 */
export interface CommonDataProps {
  context: {
    csrftoken: string;
    environment: string;
    release: string;
    sentry_dsn: Nullable<string>;
  };
}
