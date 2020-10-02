import { Nullable } from 'utils/types';

/**
 * Common data properties that are passed by the backend to all React components as they are
 * instantiated.
 */
export interface LMSBackend {
  backend: string;
  selector_regexp: RegExp | string;
  course_regexp: RegExp | string;
  endpoint: string;
}

export interface AuthenticationBackend {
  backend: string;
  endpoint: string;
}

export interface CommonDataProps {
  context: {
    authentication: AuthenticationBackend;
    csrftoken: string;
    environment: string;
    lms_backends: LMSBackend[];
    release: string;
    sentry_dsn: Nullable<string>;
  };
}
