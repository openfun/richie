import debounce from 'lodash-es/debounce';

import { StaticFilterDefinitions } from 'types/filters';
import {
  SearchAutosuggestProps,
  SearchSuggestion,
  SearchSuggestionSection,
} from 'types/Suggestion';
import { handle } from 'utils/errors/handle';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { getSuggestionsSection } from './getSuggestionsSection';

/**
 * `react-autosuggest` callback to get a human string value from a Suggestion object.
 * @param suggestion The relevant suggestion object.
 */
export const getSuggestionValue: SearchAutosuggestProps['getSuggestionValue'] = (suggestion) =>
  suggestion.title;

/**
 * `react-autosuggest` callback to render one suggestion.
 * @param suggestion Either a resource suggestion with a model name & a machine name, or the default
 * suggestion with some text to render.
 */
export const renderSuggestion: SearchAutosuggestProps['renderSuggestion'] = (suggestion) => (
  <span>{suggestion.title}</span>
);

/**
 * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
 * interaction requires us to create or update that list.
 * @param filters The general filters object as returned by the API on a course search.
 * @param setSuggestions The suggestion setter method for the component using our helper.
 * @param incomingValue The current value of the search suggest form field.
 */
const onSuggestionsFetchRequested = async (
  filters: StaticFilterDefinitions,
  setSuggestions: (suggestions: SearchSuggestionSection[]) => void,
  incomingValue: string,
) => {
  if (incomingValue.length < 3) {
    return setSuggestions([]);
  }

  // Fetch the suggestions for each resource-based section to build out the sections
  let sections: SearchSuggestionSection[];
  try {
    sections = (await Promise.all(
      Object.values(await filters)
        .filter((filterdef) => filterdef.is_autocompletable)
        .map((filterdef) =>
          getSuggestionsSection(filterdef.name, filterdef.human_name, incomingValue),
        ),
      // We can assert this because of the catch below
    )) as SearchSuggestionSection[];
  } catch (error) {
    return handle(error);
  }

  setSuggestions(
    // Drop sections with no results as there's no use displaying them
    sections.filter((section) => !!section!.values.length),
  );
};

export const onSuggestionsFetchRequestedDebounced = debounce(
  onSuggestionsFetchRequested,
  HttpStatusCode.OK,
  {
    maxWait: 1000,
  },
);

/**
 * Helper to pick out the relevant filter for a suggestion from the general filters object.
 * @param filters The general filters object as returned by the API on a course search.
 * @param suggestion The suggestion with which we're doing some work (eg. the suggestion the user selected).
 */
export const getRelevantFilter = (
  filters: StaticFilterDefinitions,
  suggestion: SearchSuggestion,
) => {
  // Use the `kind` field on the suggestion to pick the relevant filter to update.
  return Object.values(filters).find((fltr) => fltr.name === suggestion.kind)!;
};
