import { modelName } from './types/models';

export const API_ENDPOINTS = {
  autocomplete: {
    [modelName.COURSES]: '/api/v1.0/courses/autocomplete/',
    [modelName.ORGANIZATIONS]: '/api/v1.0/organizations/autocomplete/',
    [modelName.CATEGORIES]: '/api/v1.0/categories/autocomplete/',
  },
  search: {
    [modelName.COURSES]: '/api/v1.0/courses/',
    [modelName.ORGANIZATIONS]: '/api/v1.0/organizations/',
    [modelName.CATEGORIES]: '/api/v1.0/categories/',
  },
};

export const API_LIST_DEFAULT_PARAMS = {
  limit: '999',
  offset: '0',
};
