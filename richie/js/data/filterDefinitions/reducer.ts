import {
  FilterDefinition,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from '../../types/filters';
import initialState from './initialState';

// Hardcoded filter groups have all their data contained in this slice of state
type FilterDefinitionStateHardcoded = {
  [key in hardcodedFilterGroupName]: FilterDefinition
};

// Resource based filter groups are partly derived from other slice of states:
// - the parts that are their own are stored here
// - the derived parts are computed in mapStateToProps
type FilterDefinitionStateResourceBased = {
  [key in resourceBasedFilterGroupName]: {
    humanName: string;
    machineName: resourceBasedFilterGroupName;
  }
};

export type FilterDefinitionState = FilterDefinitionStateHardcoded &
  FilterDefinitionStateResourceBased;

// This reducer's only job is to set the initial value.
// It's also useful to to host the typings for its slice of the data.
export const filterDefinitions = (
  state: FilterDefinitionState = initialState,
  action: { type: '' },
) => {
  return state;
};

export default filterDefinitions;
