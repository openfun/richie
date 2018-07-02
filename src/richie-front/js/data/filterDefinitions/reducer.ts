import { Settings } from '../../settings';
import settings from '../../settings.json';
import {
  FilterDefinition,
  FilterDefinitionWithValues,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from '../../types/filters';

const { FILTERS_HARDCODED, FILTERS_RESOURCES } = settings as Settings;

// Hardcoded filter groups have all their data contained in this slice of state
type FilterDefinitionStateHardcoded = {
  [key in hardcodedFilterGroupName]: FilterDefinitionWithValues
};

// Resource based filter groups are partly derived from other slice of states:
// - the parts that are their own are stored here
// - the derived parts are computed in mapStateToProps
type FilterDefinitionStateResourceBased = {
  [key in resourceBasedFilterGroupName]: FilterDefinition
};

export type FilterDefinitionState = FilterDefinitionStateHardcoded &
  FilterDefinitionStateResourceBased;

// This reducer's only job is to set the initial value.
// It's also useful to to host the typings for its slice of the data.
export const filterDefinitions = (
  state: FilterDefinitionState = { ...FILTERS_HARDCODED, ...FILTERS_RESOURCES },
  action: { type: '' },
) => {
  return state;
};
