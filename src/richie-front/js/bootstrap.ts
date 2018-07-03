import { parse } from 'query-string';

import { configureStore } from './data/configureStore';
import { RootState } from './data/rootReducer';
import { FILTERS_HARDCODED, FILTERS_RESOURCES } from './settings';

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
