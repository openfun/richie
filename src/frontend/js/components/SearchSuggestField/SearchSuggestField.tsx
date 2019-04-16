import React, { useContext, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { APICourseSearchResponse } from '../../types/api';
import { modelName } from '../../types/models';
import {
  ResourceSuggestion,
  ResourceSuggestionSection,
  SearchSuggestion,
  SearchSuggestionSection,
} from '../../types/searchSuggest';
import { commonMessages } from '../../utils/commonMessages';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/window';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionsFromSection } from '../../utils/searchSuggest/suggestionsFromSection';

const messages = defineMessages({
  searchFieldDefaultSearch: {
    defaultMessage: 'Search for {query} in courses...',
    description: `Default query in the main search field. Lets users run a full text search
      with whatever they have typed in.`,
    id: 'components.SearchSuggestField.searchFieldDefaultSearch',
  },
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses, organizations, categories',
    description:
      'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

/**
 * `react-autosuggest` callback to get a human string value from a Suggestion object.
 * @param suggestion The relevant suggestion object.
 */
const getSuggestionValue = (suggestion: SearchSuggestion) =>
  suggestion.model ? suggestion.data.title : suggestion.data;

/**
 * `react-autosuggest` callback to render one suggestion.
 * @param suggestion Either a resource suggestion with a model name & a machine name, or the default
 * suggestion with some text to render.
 */
const renderSuggestion = (suggestion: SearchSuggestion) => {
  // Default suggestion is just packing a message in its data field
  if (!suggestion.model) {
    return (
      <FormattedMessage
        {...messages.searchFieldDefaultSearch}
        values={{ query: <b>{suggestion.data}</b> }}
      />
    );
  }
  return <span>{suggestion.data.title}</span>;
};

interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

/**
 * Props shape for the SearchSuggestField component.
 */
export interface SearchSuggestFieldProps {
  filters: APICourseSearchResponse['filters'];
}

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 * @param filters Filter definitions for all the potential suggestable filters.
 */
export const SearchSuggestField = injectIntl(
  ({ filters, intl }: SearchSuggestFieldProps & InjectedIntlProps) => {
    // Setup our filters updates (for full-text-search and specific filters) directly through the
    // search parameters hook.
    const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
      CourseSearchParamsContext,
    );

    // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
    // the current list of suggestions and the input value.
    // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
    const [value, setValue] = useState(courseSearchParams.query || '');
    const [suggestions, setSuggestions] = useState<
      SearchSuggestFieldState['suggestions']
    >([]);

    const inputProps = {
      /**
       * Callback triggered on every user input.
       * @param _ Unused: change event.
       * @param params Incoming parameters related to the change event. Includes `newValue` as key
       * with the search suggest form field value.
       */
      onChange: (_: never, params?: { newValue: string }) =>
        params ? setValue(params.newValue) : null,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.keyCode === 13 /* enter */ && !value) {
          dispatchCourseSearchParamsUpdate({
            query: '',
            type: 'QUERY_UPDATE',
          });
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
    const onSuggestionSelected = (
      _: React.FormEvent,
      { suggestion }: { suggestion: SearchSuggestion },
    ) => {
      switch (suggestion.model) {
        case modelName.COURSES:
          // Behave like a link to the course run's page
          return (location.href = suggestion.data.absolute_url);

        case modelName.ORGANIZATIONS:
        case modelName.CATEGORIES:
          // Update the search with the newly selected filter
          // Pick the filter to update based on the payload's path: it contains the relevant filter's page path
          // (for eg. a meta-category or the "organizations" root page)
          const filter = Object.values(filters).find(
            fltr =>
              !!fltr.base_path &&
              String(suggestion.data.id)
                .substr(2)
                .startsWith(fltr.base_path),
          )!;
          // Dispatch the actual update on the relevant filter
          dispatchCourseSearchParamsUpdate({
            filter,
            payload: String(suggestion.data.id),
            type: 'FILTER_ADD',
          });
          // Reset the search field state: the task has been completed
          setValue('');
          setSuggestions([]);
          break;

        default:
          // Update the current query with the default suggestion data (the contents of the search query)
          dispatchCourseSearchParamsUpdate({
            query: suggestion.data,
            type: 'QUERY_UPDATE',
          });
          break;
      }
    };

    /**
     * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
     * interaction requires us to create or update that list.
     * @param value `value` as key to an anonymous object: the current value of the search suggest form field.
     */
    const onSuggestionsFetchRequested = async ({
      value: incomingValue,
    }: {
      value: string;
    }) => {
      if (incomingValue.length < 3) {
        return setSuggestions([]);
      }

      // List the resource-based sections we'll display and the models they're related to
      const sectionParams: Array<
        [ResourceSuggestionSection['model'], FormattedMessage.MessageDescriptor]
      > = [
        [modelName.COURSES, commonMessages.coursesHumanName],
        [modelName.ORGANIZATIONS, commonMessages.organizationsHumanName],
        [modelName.CATEGORIES, commonMessages.categoriesHumanName],
      ];

      // Fetch the suggestions for each resource-based section to build out the sections
      let sections: ResourceSuggestionSection[];
      try {
        sections = (await Promise.all(
          sectionParams.map(([model, message]) =>
            getSuggestionsSection(model, message, incomingValue),
          ),
        )) as ResourceSuggestionSection[]; // We can assert this because of the catch below
      } catch (error) {
        return handle(error);
      }

      setSuggestions([
        // Add the default section on top of the list
        {
          message: null,
          model: null,
          value: incomingValue,
        },
        // Drop sections with no results as there's no use displaying them
        ...sections.filter(section => !!section!.values.length),
      ]);
    };

    /**
     * `react-autosuggest` callback to render one suggestion section.
     * @param section A suggestion section based on a resource. renderSectionTitle() is never called with
     * the default section as that section has no title.
     */
    const renderSectionTitle = (section: SearchSuggestionSection) =>
      section.model ? <span>{intl.formatMessage(section.message)}</span> : null;

    return (
      // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
      // would be correct if we did not use sections, but is incorrect as it is.
      <Autosuggest
        getSectionSuggestions={suggestionsFromSection as any}
        getSuggestionValue={getSuggestionValue}
        highlightFirstSuggestion={value.length > 2}
        inputProps={inputProps}
        multiSection={true}
        onSuggestionsClearRequested={() => setSuggestions([])}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionSelected={onSuggestionSelected}
        renderSectionTitle={renderSectionTitle}
        renderSuggestion={renderSuggestion}
        shouldRenderSuggestions={val => val.length > 2}
        suggestions={suggestions as any}
      />
    );
  },
);
