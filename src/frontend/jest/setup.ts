// Extend jest matchers with jest-dom's
import '@testing-library/jest-dom/extend-expect';

import { setLogger } from 'react-query';
import { noop } from 'utils';

/*
 * A little trick to prevent so package to be reset when using `jest.resetModules()`.
 * https://github.com/facebook/jest/issues/8987#issuecomment-584898030
 */
const RESET_MODULE_EXCEPTIONS = ['react', 'react-intl'];

const mockActualRegistry: Record<PropertyKey, any> = {};

RESET_MODULE_EXCEPTIONS.forEach((moduleName) => {
  jest.doMock(moduleName, () => {
    if (!mockActualRegistry[moduleName]) {
      mockActualRegistry[moduleName] = jest.requireActual(moduleName);
    }
    return mockActualRegistry[moduleName];
  });
});

/* Prevent log error during tests */
setLogger({
  // eslint-disable-next-line no-console
  log: console.log,
  warn: console.warn,
  error: noop,
});
