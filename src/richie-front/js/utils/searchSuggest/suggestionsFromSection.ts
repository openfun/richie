import { modelName } from '../../types/models';
import {
  DefaultSuggestionSection,
  ResourceSuggestion,
  ResourceSuggestionSection,
  SearchSuggestionSection,
} from '../../types/searchSuggest';

/**
 *  Type guard. Determines the kind of section to pick the correct suggestions extractor.
 */
function isResourceSection(
  section: SearchSuggestionSection,
): section is ResourceSuggestionSection {
  return !!section.model;
}

/**
 * Handles the default section for the more general `suggestionsFromSection()`.
 */
function suggestionsFromDefaultSection(section: DefaultSuggestionSection) {
  return [
    {
      data: section.value,
      model: section.model,
    },
  ];
}

/**
 * Handles resource sections for the more general `suggestionsFromSection()`.
 */
function suggestionsFromResourceSection(
  section: ResourceSuggestionSection,
): ResourceSuggestion[] {
  // We have two issues here:
  // - the compiler can't understand `T[] | U[]` is necessarily an array. See this issue on call
  //   signatures of union types (https://github.com/Microsoft/TypeScript/issues/7294)
  // - contents of model on ResourceSuggestion input are merged which breaks down as they are not
  //   merged on the output
  // This leads us to this switch which solves both issues as neither the model name nor the values
  // are union types anymore.
  switch (section.model) {
    case modelName.COURSES:
      return section.values.map(value => ({
        data: value,
        model: section.model,
      }));
    case modelName.ORGANIZATIONS:
      return section.values.map(value => ({
        data: value,
        model: section.model,
      }));

    case modelName.SUBJECTS:
      return section.values.map(value => ({
        data: value,
        model: section.model,
      }));
  }
}

/**
 * Extract the search suggestions from a suggestions section object. Used as a `react-autosuggest` param
 * called internally by the library.
 * @param section The search suggestion section we need to extract the suggestions from.
 * @returns An array containing the suggestions themselves.
 */
export function suggestionsFromSection(section: SearchSuggestionSection) {
  if (isResourceSection(section)) {
    return suggestionsFromResourceSection(section);
  }
  return suggestionsFromDefaultSection(section);
}
