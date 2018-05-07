import { parse } from 'query-string';

import configureStore from './data/configureStore';
import { initialState as filterDefinitionsInitialState } from './data/filterDefinitions/initialState';
import { RootState } from './data/rootReducer';

const params = parse(location.search);

export default function bootstrapStore() {
  return configureStore({
    filterDefinitions: filterDefinitionsInitialState,
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
