import { defineMessages } from 'react-intl';

import {
  FilterDefinition,
  FilterDefinitionWithValues,
  filterGroupName,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from './types/filters';
import { modelName } from './types/models';
import { commonMessages } from './utils/commonMessages';

export const API_ENDPOINTS = {
  [modelName.COURSES]: '/api/v1.0/courses/',
  [modelName.ORGANIZATIONS]: '/api/v1.0/organizations/',
  [modelName.SUBJECTS]: '/api/v1.0/subjects/',
};

export const API_LIST_DEFAULT_PARAMS = {
  limit: 20,
  offset: 0,
};

export const FILTERS_ACTIVE: filterGroupName[] = [
  'new',
  'availability',
  modelName.SUBJECTS,
  modelName.ORGANIZATIONS,
  'language',
];

export const FILTERS_HARDCODED: {
  [key in hardcodedFilterGroupName]: FilterDefinitionWithValues
} = {
  availability: {
    humanName: defineMessages({
      message: {
        defaultMessage: 'Availability',
        description:
          'Title for the "Availability" section of course filters (eg. Coming soon / Current session etc.)',
        id: 'settings.filters.availability.title',
      },
    }).message,
    isDrilldown: true,
    machineName: 'availability',
    values: [
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'Coming soon',
            description:
              'Possible value for the "Availability" filter for courses',
            id: 'settings.filters.availability.values.coming_soon',
          },
        }).message,
        primaryKey: 'coming_soon',
      },
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'Current session',
            description:
              'Possible value for the "Availability" filter for courses',
            id: 'settings.filters.availability.values.current',
          },
        }).message,
        primaryKey: 'current',
      },
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'Current session',
            description:
              'Possible value for the "Availability" filter for courses',
            id: 'settings.filters.availability.values.current',
          },
        }).message,
        primaryKey: 'open',
      },
    ],
  },
  language: {
    humanName: defineMessages({
      message: {
        defaultMessage: 'Language',
        description:
          'Title for the "Language" section of course filters (eg. FR / EN etc.)',
        id: 'settings.filters.language.title',
      },
    }).message,
    machineName: 'language',
    values: [
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'English',
            description: 'Language',
            id: 'settings.filters.language.en',
          },
        }).message,
        primaryKey: 'en',
      },
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'French',
            description: 'Language',
            id: 'settings.filters.language.fr',
          },
        }).message,
        primaryKey: 'fr',
      },
    ],
  },
  new: {
    humanName: defineMessages({
      message: {
        defaultMessage: 'New courses',
        description: 'Title for the "New" section of course filters',
        id: 'settings.filters.new.title',
      },
    }).message,
    machineName: 'new',
    values: [
      {
        humanName: defineMessages({
          message: {
            defaultMessage: 'First session',
            description: 'Possible balue for the "New" filter for courses',
            id: 'settings.filters.new.new',
          },
        }).message,
        primaryKey: 'new',
      },
    ],
  },
};

export const FILTERS_RESOURCES: {
  [key in resourceBasedFilterGroupName]: FilterDefinition
} = {
  organizations: {
    humanName: commonMessages.organizationsHumanName,
    machineName: modelName.ORGANIZATIONS,
  },
  subjects: {
    humanName: commonMessages.subjectsHumanName,
    machineName: modelName.SUBJECTS,
  },
};

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr'];
