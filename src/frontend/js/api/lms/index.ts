import { handle } from 'utils/errors/handle';
import { APIBackend, APILms } from 'types/api';

import { findLmsBackend } from '../configuration';
import DummyApiInterface from './dummy';
import OpenEdxDogwoodApiInterface from './openedx-dogwood';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

const LmsAPIHandler = (url: string): APILms => {
  const api = findLmsBackend(url);

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
