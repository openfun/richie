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

enum FEATURES {
  REACT_DASHBOARD = 'REACT_DASHBOARD',
  WISHLIST = 'WISHLIST',
}

export interface RichieContext {
  authentication: AuthenticationBackend;
  csrftoken: string;
  environment: string;
  features: Partial<Record<FEATURES, boolean>>;
  joanie_backend?: JoanieBackend;
  lms_backends?: LMSBackend[];
  release: string;
  sentry_dsn: Nullable<string>;
  web_analytics_providers?: Nullable<string[]>;
  site_urls: {
    terms_and_conditions: Nullable<string>;
  };
}

export interface CommonDataProps {
  context: RichieContext;
}
