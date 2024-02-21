// Extend jest matchers with jest-dom's
import '@testing-library/jest-dom';
import { Request, Response } from 'node-fetch';
import { FactoryConfig } from 'utils/test/factories/factories';

// Mock Request & Reponse objects
global.Request = Request as any;
global.Response = Response as any;

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

beforeAll(() => {
  // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
  const modalExclude = document.createElement('div');
  modalExclude.setAttribute('id', 'modal-exclude');
  document.body.appendChild(modalExclude);
});

afterEach(() => {
  FactoryConfig.resetUniqueStore();
});
