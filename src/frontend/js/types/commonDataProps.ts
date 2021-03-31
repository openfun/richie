import { Nullable } from 'types/utils';
import { Backend as JoanieBackend } from 'types/Joanie';

/**
 * Common data properties that are passed by the backend to all React components as they are
 * instantiated.
 */
export interface LMSBackend {
  backend: string;
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
    lms_backends?: LMSBackend[];
    joanie_backend?: JoanieBackend;
    release: string;
    sentry_dsn: Nullable<string>;
  };
}
