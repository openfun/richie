import { CommonDataProps } from 'types/commonDataProps';
import { Nullable } from 'utils/types';
import { User } from 'types/User';
import { Enrollment } from 'types';
import BaseApiInterface from './base';
import OpenEdxApiInterface from './edx';

export interface ApiImplementation {
  user: {
    me: () => Promise<Nullable<User>>;
    login: () => void;
    register: () => void;
    logout: () => Promise<void>;
  };
  enrollment: {
    get: (url: string, user: Nullable<User>) => Promise<Nullable<Enrollment>>;
    isEnrolled: (url: string, user: Nullable<User>) => Promise<boolean>;
    set: (url: string, user: User) => Promise<boolean>;
  };
}

const context: CommonDataProps['context'] = (window as any).__richie_frontend_context__?.context;
if (!context) throw new Error('No context frontend context available');

const LMS_BACKENDS = context.lms_backends;
if (!LMS_BACKENDS) throw new Error('No LMS_BACKENDS sets in frontend context.');

const selectAPIWithUrl = (url: string) => {
  const API = LMS_BACKENDS.find((lms) => new RegExp(lms.selector_regexp).test(url));
  return API;
};

const LmsAPIHandler = (url: string): ApiImplementation => {
  const api = selectAPIWithUrl(url);

  switch (api?.backend) {
    case 'richie.apps.courses.lms.base.BaseLMSBackend':
      return BaseApiInterface(api);
    case 'richie.apps.courses.lms.edx.TokenEdXLMSBackend':
      return OpenEdxApiInterface(api);
    default:
      throw new Error(`No LMS Backend found for ${url}.`);
  }
};

export default LmsAPIHandler;
