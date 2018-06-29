import { parse } from 'query-string';

import { configureStore } from './data/configureStore';
import { RootState } from './data/rootReducer';
import { Settings } from './settings';
import settings from './settings.json';

const { FILTERS_HARDCODED, FILTERS_RESOURCES } = settings as Settings;

const params = parse(location.search);

export function bootstrapStore() {
  return configureStore({
    filterDefinitions: { ...FILTERS_HARDCODED, ...FILTERS_RESOURCES },
    resources: {
      courses: {
        byId: {},
        currentQuery: {
          facets: {},
          items: {},
          params,
          total_count: 0,
        },
      },
    },
  });
}
