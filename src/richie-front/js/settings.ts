import {
  FilterDefinition,
  FilterDefinitionWithValues,
  filterGroupName,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from './types/filters';

export type API_ENDPOINTS_KEYS = 'courses' | 'organizations' | 'subjects';

export interface Settings {
  API_ENDPOINTS: { [key in API_ENDPOINTS_KEYS]: string };
  API_LIST_DEFAULT_PARAMS: {
    limit: number;
    offset: number;
  };

  FILTERS_ACTIVE: filterGroupName[];
  FILTERS_HARDCODED: {
    [key in hardcodedFilterGroupName]: FilterDefinitionWithValues
  };
  FILTERS_RESOURCES: {
    [key in resourceBasedFilterGroupName]: FilterDefinition
  };

  SUPPORTED_LANGUAGES: string[];
}
