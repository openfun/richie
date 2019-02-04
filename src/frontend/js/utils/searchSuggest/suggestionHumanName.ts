import { modelName } from '../../types/models';
import { ResourceSuggestion } from '../../types/searchSuggest';

export const suggestionHumanName = (suggestion: ResourceSuggestion) => {
  return suggestion.data.title;
};
