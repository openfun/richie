import debounce from 'lodash-es/debounce';
import { useCallback, useEffect, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, useIntl } from 'react-intl';

import { CourseSearchParamsAction, useCourseSearchParams } from 'hooks/useCourseSearchParams';
import { useStaticFilters } from 'hooks/useStaticFilters';
import { SearchInput } from 'components/SearchInput';
import { CommonDataProps } from 'types/commonDataProps';
import { SearchAutosuggestProps, SearchSuggestionSection } from 'types/Suggestion';
import {
  getRelevantFilter,
  getSuggestionValue,
  onSuggestionsFetchRequestedDebounced,
  renderSuggestion,
} from 'utils/search';

const messages = defineMessages({
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses, organizations, categories',
    description: 'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 * @param context General contextual app information as defined in common data props.
 */
const SearchSuggestField = ({ context }: CommonDataProps) => {
  const intl = useIntl();

  // We need static filter definitions to act as config for our suggestion sections & requests.
  const getFilters = useStaticFilters();

  // Setup our filters updates (for full-text-search and specific filters) directly through the
  // search parameters hook.
  const { courseSearchParams, dispatchCourseSearchParamsUpdate, lastDispatchActions } =
    useCourseSearchParams();

  // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
  // the current list of suggestions and the input value.
  // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
  const [value, setValue] = useState(courseSearchParams.query || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestionSection[]>([]);

  // Use current value of courseSearchParams and last dispatched actions to guess if the text query
  // has been removed by another component in the tree, and clear the field as well
  // NB: this will do nothing on the first render as there are then no last dispatched actions.
  useEffect(() => {
    if (
      !courseSearchParams.query &&
      lastDispatchActions
        ?.map((action) => action.type)
        .includes(CourseSearchParamsAction.filterReset) &&
      value
    ) {
      setValue('');
    }
  }, [lastDispatchActions]);

  /**
   * Helper to update the course search params when the user types. We needed to take it out of
   * the `onChange` handler to wrap it in a `debounce` (and therefore a `useRef` to make the
   * debouncing effective).
   *
   * This method should be memoized and updated only when courseSearchParams change.
   *
   * @param _ Unused: change event.
   * @param params Incoming parameters related to the change event.
   * - `method` is the way the value was updated.
   * - `newValue` is the search suggest form field value.
   */
  const searchAsTheUserTypes: SearchAutosuggestProps['inputProps']['onChange'] = useCallback(
    (_, { method, newValue }) => {
      if (
        method === 'type' &&
        // Check length against trimmed version as our backend API needs 3 non-space characters to
        // do a full-text search.
        (newValue.length === 0 || newValue.trim().length >= 3)
      ) {
        dispatchCourseSearchParamsUpdate({
          query: newValue,
          type: CourseSearchParamsAction.queryUpdate,
        });
      }
    },
    [courseSearchParams],
  );

  /**
   * Debounce the searchAsTheUserTypes method. We have to memoize it to prevent creation to a new
   * debounce timer at each render. We only update this function when searchAsTheUserTypes change.
   */
  const updateCourseSearchParamsDebounced = useCallback(
    debounce(searchAsTheUserTypes, 500, { maxWait: 1100 }),
    [searchAsTheUserTypes],
  );

  const inputProps: SearchAutosuggestProps['inputProps'] = {
    /**
     * Callback triggered on every user input.
     * @param _ Unused: change event.
     * @param params Incoming parameters related to the change event.
     * - `method` is the way the value was updated.
     * - `newValue` is the search suggest form field value.
     */
    onChange: (_, { method, newValue }) => {
      // Always update the state, delegate search-as-the-user-types to debounced function
      setValue(newValue);
      updateCourseSearchParamsDebounced(_, { method, newValue });
    },
    onKeyDown: (event) => {
      if (event.code === 'Enter' && !value) {
        dispatchCourseSearchParamsUpdate({
          query: '',
          type: CourseSearchParamsAction.queryUpdate,
        });
      }
    },
    placeholder: intl.formatMessage(messages.searchFieldPlaceholder),
    'aria-label': intl.formatMessage(messages.searchFieldPlaceholder),
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
    const filter = getRelevantFilter(await getFilters(), suggestion);

    // Dispatch the actual update on the relevant filter and clear the current search query as the
    // selected suggestion was generated from the same user input
    dispatchCourseSearchParamsUpdate(
      {
        query: '',
        type: CourseSearchParamsAction.queryUpdate,
      },
      {
        filter,
        payload: String(suggestion.id),
        type: CourseSearchParamsAction.filterAdd,
      },
    );
    // Reset the search field state: the task has been completed
    setValue('');
    setSuggestions([]);
  };

  return (
    // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
    // would be correct if we did not use sections, but is incorrect as it is.
    <Autosuggest
      getSectionSuggestions={(section) => section.values}
      getSuggestionValue={getSuggestionValue}
      inputProps={inputProps}
      multiSection={true}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={async ({ value: incomingValue }) =>
        onSuggestionsFetchRequestedDebounced(await getFilters(), setSuggestions, incomingValue)
      }
      onSuggestionSelected={onSuggestionSelected}
      renderInputComponent={(passthroughInputProps) => (
        <SearchInput context={context} inputProps={passthroughInputProps} />
      )}
      renderSectionTitle={(section) => section.title}
      renderSuggestion={renderSuggestion}
      shouldRenderSuggestions={(val) => val.length > 2}
      suggestions={suggestions as any}
    />
  );
};

export default SearchSuggestField;
