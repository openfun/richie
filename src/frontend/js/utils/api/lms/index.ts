import { handle } from 'utils/errors/handle';
import context from 'utils/context';
import { APIBackend, APILms } from 'types/api';
import DummyApiInterface from './dummy';
import OpenEdxDogwoodApiInterface from './openedx-dogwood';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

const LMS_BACKENDS = context.lms_backends || [];

const selectAPIWithUrl = (url: string) => {
  const API = LMS_BACKENDS.find((lms) => new RegExp(lms.course_regexp).test(url));
  return API;
};

const LmsAPIHandler = (url: string): APILms => {
  const api = selectAPIWithUrl(url);

  switch (api?.backend) {
    case APIBackend.DUMMY:
      return DummyApiInterface(api);
    case APIBackend.OPENEDX_DOGWOOD:
      return OpenEdxDogwoodApiInterface(api);
    case APIBackend.OPENEDX_HAWTHORN:
      return OpenEdxHawthornApiInterface(api);
  }

  const error = new Error(`No LMS Backend found for ${url}.`);
  handle(error);
  throw error;
};

export default LmsAPIHandler;
