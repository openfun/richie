import {
  FilterDefinition,
  FilterDefinitionWithValues,
  filterGroupName,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from './types/filters';

export const API_ENDPOINTS = {
  courses: '/api/v1.0/courses/',
  organizations: '/api/v1.0/organizations/',
  subjects: '/api/v1.0/subjects/',
};

export const API_LIST_DEFAULT_PARAMS = {
  limit: 20,
  offset: 0,
};

export const FILTERS_ACTIVE: filterGroupName[] = [
  'new',
  'availability',
  'subjects',
  'organizations',
  'language',
];

export const FILTERS_HARDCODED: {
  [key in hardcodedFilterGroupName]: FilterDefinitionWithValues
} = {
  availability: {
    humanName: 'Availability',
    isDrilldown: true,
    machineName: 'availability',
    values: [
      { primaryKey: 'coming_soon', humanName: 'Coming soon' },
      { primaryKey: 'current', humanName: 'Current session' },
      { primaryKey: 'open', humanName: 'Open, no session' },
    ],
  },
  language: {
    humanName: 'Language',
    machineName: 'language',
    values: [
      { primaryKey: 'en', humanName: 'English' },
      { primaryKey: 'fr', humanName: 'French' },
    ],
  },
  new: {
    humanName: 'New courses',
    machineName: 'new',
    values: [{ primaryKey: 'new', humanName: 'First session' }],
  },
};

export const FILTERS_RESOURCES: {
  [key in resourceBasedFilterGroupName]: FilterDefinition
} = {
  organizations: {
    humanName: 'Organizations',
    machineName: 'organizations',
  },
  subjects: {
    humanName: 'Subjects',
    machineName: 'subjects',
  },
};

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr'];
