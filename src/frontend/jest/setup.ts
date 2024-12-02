// Extend jest matchers with jest-dom's
import '@testing-library/jest-dom';
import fetchMock from 'fetch-mock';
import { Request, Response } from 'node-fetch';
import { FactoryConfig } from 'utils/test/factories/factories';

// Mock Request & Reponse objects
global.Request = Request as any;
global.Response = Response as any;

// https://github.com/remix-run/react-router/issues/12363#issuecomment-2496226528
if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  const { TextDecoder, TextEncoder } = require('node:util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

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

let unmatchedCallMessage: string = '';
beforeAll(() => {
  // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
  const modalExclude = document.createElement('div');
  modalExclude.setAttribute('id', 'modal-exclude');
  document.body.appendChild(modalExclude);

  const originalWarn = console.warn;
  console.warn = (message) => {
    if (message.match(/^Unmatched /)) {
      unmatchedCallMessage = message;
    }

    return originalWarn(message);
  };
});

afterEach(() => {
  FactoryConfig.resetUniqueStore();
  fetchMock.restore();
  jest.clearAllMocks();

  if (unmatchedCallMessage) {
    throw new Error(unmatchedCallMessage);
  }
  unmatchedCallMessage = '';
});
