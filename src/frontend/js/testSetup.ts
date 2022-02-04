// Extend jest matchers with jest-dom's
import '@testing-library/jest-dom/extend-expect';

import { setLogger } from 'react-query';
import { noop } from 'utils';

/* Prevent log error during tests */
setLogger({
  // eslint-disable-next-line no-console
  log: console.log,
  warn: console.warn,
  error: noop,
});
