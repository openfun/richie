import { stringify } from 'query-string';
import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, useIntl } from 'react-intl';

import {
  getRelevantFilter,
  getSuggestionValue,
  onSuggestionsFetchRequested,
  renderSuggestion,
} from 'common/searchFields';
import { fetchList } from 'data/getResourceList';
import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APICourseSearchResponse, requestStatus } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { FilterDefinition } from 'types/filters';
import {
  isCourseSuggestion,
  SearchAutosuggestProps,
  SearchSuggestionSection,
} from 'types/Suggestion';
import { location } from 'utils/indirection/window';

const messages = defineMessages({
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses',
    description:
      'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

// Our search and autosuggestion pipeline operated based on filter definitions. Obviously, we can filters courses
// by courses, but we still need a filter-definition-like config to run courses autocompletion.
const coursesConfig: FilterDefinition = {
  base_path: null,
  has_more_values: false,
  human_name: 'Courses',
  is_autocompletable: true,
  is_searchable: true,
  name: 'courses',
  values: [],
};

// We don't want to systematically load the filter on page load, when we render <RootSearchSuggestField />
// Instead, we can create a promise for those filters, and only actually fetch them *once* the first time
// we actually need them.
let filtersPromise: Promise<APICourseSearchResponse['filters']>;
let hasInitiatedRequest: boolean = false;
const filters: () => Promise<APICourseSearchResponse['filters']> = async () => {
  if (hasInitiatedRequest) {
    return await filtersPromise;
  }
  hasInitiatedRequest = true;
  const response = await fetchList('courses', {
    limit: '1',
    offset: '0',
    scope: 'filters',
  });
  if (response.status === requestStatus.SUCCESS) {
    return (filtersPromise = new Promise(resolve =>
      resolve({ ...response.content.filters, courses: coursesConfig }),
    ));
  } else {
    throw new Error(response.error);
  }
};

interface RootSearchSuggestFieldProps {
  courseSearchPageUrl: string;
}

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 */
export const RootSearchSuggestField = ({
  courseSearchPageUrl,
}: RootSearchSuggestFieldProps & CommonDataProps) => {
  const intl = useIntl();

  // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
  // the current list of suggestions and the input value.
  // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionSection[]>([]);

  // Helper to know if the user is currently highlighting a suggestion. This is necessary to make sure we do not
  // override default `Autosuggest` behavior when we receive the ENTER keycode that triggers text search.
  const [hasHighlightedSuggestion, setHasHighlightedSuggestion] = useState(
    false,
  );

  const inputProps: SearchAutosuggestProps['inputProps'] = {
    /**
     * Callback triggered on every user input.
     * @param _ Unused: change event.
     * @param params Incoming parameters related to the change event.
     * - `newValue` is the search suggest form field value.
     */
    onChange: (_, { newValue }) => {
      // Always update the state
      setValue(newValue);
    },
    onKeyDown: event => {
      // When ther user presses enter from the search field, move to the course search view with
      // whatever is currently in the field as a text query.
      // Unless they are currently highlighting a suggestion, in which case we let Autosuggest handle it.
      if (event.keyCode === 13 /* enter */ && !hasHighlightedSuggestion) {
        location.assign(
          `${courseSearchPageUrl}?${stringify({
            ...API_LIST_DEFAULT_PARAMS,
            query: value,
          })}`,
        );
      }
    },
    placeholder: intl.formatMessage(messages.searchFieldPlaceholder),
    value,
  };

  /**
   * `react-autosuggest` callback triggered when the user picks a suggestion, to handle the interaction.
   * Different interactions have different expected outcomes:
   * - picking a course directs to the course detailed page (as this is a course search);
   * - picking another resource suggestion adds that resource as a filter;
   * - the default suggestion runs a full-text search on the content of the search suggest form field.
   * @param _ Unused: selection event.
   * @param suggestion `suggestion` as key to an anonymous object: the suggestion the user picked.
   */
  const onSuggestionSelected: SearchAutosuggestProps['onSuggestionSelected'] = async (
    _,
    { suggestion },
  ) => {
    // Course suggestions are treated differently: when the user finds a course they're interested in,
    // we're just sending them to that's course page instead of the course search page.
    if (isCourseSuggestion(suggestion)) {
      return location.assign(suggestion.absolute_url);
    }

    // Get the relevant filter and move to the course search view with the selected suggestion as an
    // active filter value.
    const filter = getRelevantFilter(await filters(), suggestion);
    location.assign(
      `${courseSearchPageUrl}?${stringify({
        ...API_LIST_DEFAULT_PARAMS,
        [filter.name]: suggestion.id,
      })}`,
    );
  };

  return (
    // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
    // would be correct if we did not use sections, but is incorrect as it is.
    <Autosuggest
      getSectionSuggestions={section => section.values}
      getSuggestionValue={getSuggestionValue}
      inputProps={inputProps}
      multiSection={true}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={async ({ value: incomingValue }) =>
        onSuggestionsFetchRequested(
          await filters(),
          setSuggestions,
          incomingValue,
        )
      }
      onSuggestionHighlighted={({ suggestion }) =>
        setHasHighlightedSuggestion(!suggestion)
      }
      onSuggestionSelected={onSuggestionSelected}
      renderSectionTitle={section => section.title}
      renderSuggestion={renderSuggestion}
      shouldRenderSuggestions={val => val.length > 2}
      suggestions={suggestions as any}
    />
  );
};
