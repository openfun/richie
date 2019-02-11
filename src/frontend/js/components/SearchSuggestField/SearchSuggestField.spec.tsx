import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Category } from '../../types/Category';
import { Course } from '../../types/Course';
import { modelName } from '../../types/models';
import { Organization } from '../../types/Organization';
import {
  DefaultSuggestionSection,
  ResourceSuggestionSection,
} from '../../types/searchSuggest';
import { handle } from '../../utils/errors/handle';
import { getSearchParam } from '../../utils/indirection/getSearchParam';
import { location } from '../../utils/indirection/location';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
import { jestMockOf } from '../../utils/types';
import {
  getSuggestionValue,
  onChange,
  onSuggestionsClearRequested,
  onSuggestionSelected,
  onSuggestionsFetchRequested,
  renderSectionTitle,
  renderSuggestion,
  SearchSuggestFieldBase,
} from './SearchSuggestField';

const mockHandle: jestMockOf<typeof handle> = handle as any;
jest.mock('../../utils/errors/handle');

const mockGetSearchParam: jestMockOf<
  typeof getSearchParam
> = getSearchParam as any;
jest.mock('../../utils/indirection/getSearchParam');

const mockGetSuggestionsSection: jestMockOf<
  typeof getSuggestionsSection
> = getSuggestionsSection as any;
jest.mock('../../utils/searchSuggest/getSuggestionsSection');

const mockSuggestionHumanName: jestMockOf<
  typeof suggestionHumanName
> = suggestionHumanName as any;
jest.mock('../../utils/searchSuggest/suggestionHumanName');

describe('components/SearchSuggestField', () => {
  let addFilter: jest.SpyInstance;
  let fullTextSearch: jest.SpyInstance;
  let that: SearchSuggestFieldBase;

  beforeEach(() => {
    // addFilter & fullTextSearch are used to update the current search query
    addFilter = jest.fn();
    fullTextSearch = jest.fn();
    // Stub the parts of the component instance we need to access
    that = {
      props: { addFilter, fullTextSearch },
      setState: jasmine.createSpy('setState'),
    } as any;
  });

  it('renders', () => {
    const wrapper = shallow(
      <SearchSuggestFieldBase
        addFilter={addFilter as any}
        fullTextSearch={fullTextSearch as any}
        intl={
          { formatMessage: (message: any) => message.defaultMessage } as any
        }
      />,
    );
    expect(wrapper.html()).toContain(
      'Search for courses, organizations, categories',
    );
  });

  it('picks the query from the URL if there is one', () => {
    mockGetSearchParam.mockReturnValue('machine learning');
    const wrapper = shallow(
      <SearchSuggestFieldBase
        addFilter={addFilter as any}
        fullTextSearch={fullTextSearch as any}
        intl={
          { formatMessage: (message: any) => message.defaultMessage } as any
        }
      />,
    );
    expect(wrapper.html()).toContain('machine learning');
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
      );
    });
  });

  describe('onChange', () => {
    const formEvent = {} as any;

    it('updates the value in state', () => {
      onChange.bind(that)(formEvent, { newValue: 'the new value' });
      expect(that.setState).toHaveBeenCalledWith({ value: 'the new value' });
    });

    it('does not update the state when it is handed no params', () => {
      onChange.bind(that)(formEvent);
      expect(that.setState).not.toHaveBeenCalled();
    });
  });

  describe('onSuggestionsClearRequested()', () => {
    it('cleans up the suggestions in state', () => {
      onSuggestionsClearRequested.bind(that)();
      expect(that.setState).toHaveBeenCalledWith({ suggestions: [] });
    });
  });

  describe('onSuggestionsFetchRequested', () => {
    it('just resets the suggestions when the value is less than 3 characters long', () => {
      onSuggestionsFetchRequested.bind(that)({ value: 'c' });
      expect(that.setState).toHaveBeenCalledWith({ suggestions: [] });
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

      await onSuggestionsFetchRequested.bind(that)({
        value: 'some search',
      });

      expect(that.setState).toHaveBeenCalledWith({
        suggestions: [
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
        ],
      });
    });

    it('reports the error when getSuggestionsSection fails', async () => {
      mockGetSuggestionsSection.mockReturnValue(
        new Promise((resolve, reject) =>
          reject(new Error('Failed to get Suggestions Section!')),
        ),
      );

      await onSuggestionsFetchRequested.bind(that)({
        value: 'some search',
      });

      expect(mockHandle).toHaveBeenCalledWith(
        new Error('Failed to get Suggestions Section!'),
      );
    });
  });

  describe('onSuggestionSelected', () => {
    const formEvent = {} as any;
    const mockSetHref = jest.spyOn(location, 'setHref');

    beforeEach(() => mockSetHref.mockReset());

    it('moves to the courses page when it is called with a course', () => {
      onSuggestionSelected.bind(that)(formEvent, {
        suggestion: {
          data: {
            absolute_url: 'https://example.com/courses/42',
            id: 42,
          } as Course,
          model: modelName.COURSES,
        },
      });
      expect(location.setHref).toHaveBeenCalledWith(
        'https://example.com/courses/42',
      );
    });

    it('updates the filter and resets the suggestion state when it is called with a resource suggestion', () => {
      onSuggestionSelected.bind(that)(formEvent, {
        suggestion: {
          data: { id: 43 } as Category,
          model: modelName.CATEGORIES,
        },
      });
      expect(addFilter).toHaveBeenCalledWith(modelName.CATEGORIES, '43');
      expect(location.setHref).not.toHaveBeenCalled();

      onSuggestionSelected.bind(that)(formEvent, {
        suggestion: {
          data: { id: 44 } as Organization,
          model: modelName.ORGANIZATIONS,
        },
      });
      expect(addFilter).toHaveBeenCalledWith(modelName.ORGANIZATIONS, '44');
      expect(location.setHref).not.toHaveBeenCalled();
    });

    it('updates the full text search when it is called with the default suggestion', () => {
      onSuggestionSelected.bind(that)(formEvent, {
        suggestion: { model: null, data: 'my search' },
      });
      expect(fullTextSearch).toHaveBeenCalledWith('my search');
      expect(location.setHref).not.toHaveBeenCalled();
    });
  });
});
