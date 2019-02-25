import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { Category } from '../../types/Category';
import { Course } from '../../types/Course';
import { modelName } from '../../types/models';
import { Organization } from '../../types/Organization';
import {
  DefaultSuggestionSection,
  ResourceSuggestionSection,
} from '../../types/searchSuggest';
import { handle as mockHandle } from '../../utils/errors/handle';
import { location as mockLocation } from '../../utils/indirection/window';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
import { jestMockOf } from '../../utils/types';
import {
  getSuggestionValue,
  onChange,
  onSuggestionSelected,
  onSuggestionsFetchRequested,
  renderSectionTitle,
  renderSuggestion,
  SearchSuggestFieldBase,
} from './SearchSuggestField';

jest.mock('../../utils/errors/handle');
jest.mock('../../utils/indirection/window', () => ({ location: {} }));

const mockGetSuggestionsSection: jestMockOf<
  typeof getSuggestionsSection
> = getSuggestionsSection as any;
jest.mock('../../utils/searchSuggest/getSuggestionsSection');

const mockSuggestionHumanName: jestMockOf<
  typeof suggestionHumanName
> = suggestionHumanName as any;
jest.mock('../../utils/searchSuggest/suggestionHumanName');

describe('components/SearchSuggestField', () => {
  beforeEach(jest.resetAllMocks);
  afterEach(cleanup);

  it('renders', () => {
    const { getByPlaceholderText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchSuggestFieldBase
          filters={{}}
          intl={
            { formatMessage: (message: any) => message.defaultMessage } as any
          }
        />
      </CourseSearchParamsContext.Provider>,
    );

    // The placeholder text is shown in the input
    getByPlaceholderText('Search for courses, organizations, categories');
  });

  it('picks the query from the URL if there is one', () => {
    const { getByDisplayValue } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0', query: 'machine learning' },
          jest.fn(),
        ]}
      >
        <SearchSuggestFieldBase
          filters={{}}
          intl={
            { formatMessage: (message: any) => message.defaultMessage } as any
          }
        />
      </CourseSearchParamsContext.Provider>,
    );

    // The existing query is shown in the input
    getByDisplayValue('machine learning');
  });

  describe('getSuggestionValue()', () => {
    beforeEach(mockSuggestionHumanName.mockClear);

    it('returns the human name for a resource-based suggestion', () => {
      const suggestion = { data: '3', model: modelName.ORGANIZATIONS } as any;
      mockSuggestionHumanName.mockReturnValue('Some Human Name');
      expect(getSuggestionValue(suggestion)).toEqual('Some Human Name');
      expect(mockSuggestionHumanName).toHaveBeenCalledWith(suggestion);
    });

    it('returns the suggestion data directly for the default suggestion', () => {
      const suggestion = { data: 'Search for something', model: null } as any;
      expect(getSuggestionValue(suggestion)).toEqual('Search for something');
      expect(mockSuggestionHumanName).not.toHaveBeenCalled();
    });
  });

  describe('renderSuggestion()', () => {
    it('renders a single suggestion', () => {
      mockSuggestionHumanName.mockReturnValue('Some course title');
      expect(
        renderSuggestion({
          data: { title: 'Some course title' } as Course,
          model: modelName.COURSES,
        }),
      ).toEqual(<span>Some course title</span>);
    });
  });

  describe('renderSectionTitle()', () => {
    it('renders a section title for a resource suggestion section', () => {
      expect(
        renderSectionTitle(
          { formatMessage: ({ defaultMessage }: any) => defaultMessage } as any,
          {
            message: {
              defaultMessage: 'Some section title',
              id: 'someMessage',
            },
            model: modelName.ORGANIZATIONS,
          } as ResourceSuggestionSection,
        ),
      ).toEqual(<span>Some section title</span>);
    });

    it('returns null for the default suggestion section', () => {
      expect(
        renderSectionTitle(
          { formatMessage: ({ defaultMessage }: any) => defaultMessage } as any,
          {
            message: null,
            model: null,
          } as DefaultSuggestionSection,
        ),
      ).toEqual(null);
    });
  });

  describe('onChange', () => {
    const mockSetValue = jest.fn();

    it('updates the value in state', () => {
      onChange(mockSetValue)(undefined as any, { newValue: 'the new value' });
      expect(mockSetValue).toHaveBeenCalledWith('the new value');
    });

    it('does not update the value when it is handed no params', () => {
      onChange(mockSetValue)(undefined as any);
      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  describe('onSuggestionsFetchRequested', () => {
    const mockSetSuggestions = jest.fn();

    it('just resets the suggestions when the value is less than 3 characters long', () => {
      onSuggestionsFetchRequested(mockSetSuggestions)({ value: 'c' });
      expect(mockSetSuggestions).toHaveBeenCalledWith([]);
      expect(mockGetSuggestionsSection).not.toHaveBeenCalled();
      expect(mockHandle).not.toHaveBeenCalled();
    });

    it('uses getSuggestionsSection to get and build a SearchhSuggestionsSection', async () => {
      mockGetSuggestionsSection.mockImplementation(
        async (model: ResourceSuggestionSection['model']) => {
          switch (model) {
            case modelName.COURSES:
              return {
                message: { defaultMessage: 'Courses', id: 'courses' },
                model: modelName.COURSES,
                values: [
                  { title: 'Course #1' } as Course,
                  { title: 'Course #2' } as Course,
                ],
              };
            case modelName.CATEGORIES:
              return {
                message: { defaultMessage: 'Categories', id: 'categories' },
                model: modelName.CATEGORIES,
                values: [],
              };
            case modelName.ORGANIZATIONS:
              return {
                message: {
                  defaultMessage: 'Organizations',
                  id: 'organizations',
                },
                model: modelName.ORGANIZATIONS,
                values: [],
              };
          }
        },
      );

      await onSuggestionsFetchRequested(mockSetSuggestions)({
        value: 'some search',
      });

      expect(mockSetSuggestions).toHaveBeenCalledWith([
        {
          message: null,
          model: null,
          value: 'some search',
        },
        {
          message: { defaultMessage: 'Courses', id: 'courses' },
          model: modelName.COURSES,
          values: [{ title: 'Course #1' }, { title: 'Course #2' }],
        },
      ]);
    });

    it('reports the error when getSuggestionsSection fails', async () => {
      mockGetSuggestionsSection.mockReturnValue(
        new Promise((resolve, reject) =>
          reject(new Error('Failed to get Suggestions Section!')),
        ),
      );

      await onSuggestionsFetchRequested(mockSetSuggestions)({
        value: 'some search',
      });

      expect(mockHandle).toHaveBeenCalledWith(
        new Error('Failed to get Suggestions Section!'),
      );
    });
  });

  describe('onSuggestionSelected', () => {
    const [
      mockSetValue,
      mockSetSuggestions,
      mockAddFilter,
      mockUpdateFullTextSearch,
    ] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
    const curriedOnSuggestionSelected = onSuggestionSelected(
      mockSetValue,
      mockSetSuggestions,
      mockAddFilter,
      mockUpdateFullTextSearch,
    );

    beforeEach(() => {
      Object.keys(mockLocation).forEach(
        key => delete (mockLocation as any)[key],
      );
    });

    it('moves to the courses page when it is called with a course', () => {
      curriedOnSuggestionSelected({} as any, {
        suggestion: {
          data: {
            absolute_url: 'https://example.com/courses/42',
            id: 42,
          } as Course,
          model: modelName.COURSES,
        },
      });

      expect(mockLocation.href).toEqual('https://example.com/courses/42');
    });

    it('updates the filter and resets the suggestion state when it is called with a resource suggestion', () => {
      curriedOnSuggestionSelected({} as any, {
        suggestion: {
          data: { id: 43 } as Category,
          model: modelName.CATEGORIES,
        },
      });

      expect(mockAddFilter).toHaveBeenCalledWith(modelName.CATEGORIES, '43');
      expect(mockSetValue).toHaveBeenCalledWith('');
      expect(mockSetSuggestions).toHaveBeenCalledWith([]);
      expect(mockLocation.href).not.toBeDefined();

      jest.resetAllMocks();
      curriedOnSuggestionSelected({} as any, {
        suggestion: {
          data: { id: 44 } as Organization,
          model: modelName.ORGANIZATIONS,
        },
      });

      expect(mockAddFilter).toHaveBeenCalledWith(modelName.ORGANIZATIONS, '44');
      expect(mockSetValue).toHaveBeenCalledWith('');
      expect(mockSetSuggestions).toHaveBeenCalledWith([]);
      expect(mockLocation.href).not.toBeDefined();
    });

    it('updates the full text search when it is called with the default suggestion', () => {
      curriedOnSuggestionSelected({} as any, {
        suggestion: { model: null, data: 'my search' },
      });

      expect(mockUpdateFullTextSearch).toHaveBeenCalledWith('my search');
      expect(mockLocation.href).not.toBeDefined();
    });
  });
});
