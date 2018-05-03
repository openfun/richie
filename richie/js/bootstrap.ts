import configureStore from './data/configureStore';
import { initialState as filterDefinitionsInitialState } from './data/filterDefinitions/initialState';
import { RootState } from './data/rootReducer';

export default function bootstrapStore() {
  return configureStore({
    filterDefinitions: filterDefinitionsInitialState,
    resources: {},
  });
}
