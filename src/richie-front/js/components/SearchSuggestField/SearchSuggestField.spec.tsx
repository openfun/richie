import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Course } from '../../types/Course';
import {
  DefaultSuggestionSection,
  ResourceSuggestionSection,
} from '../../types/searchSuggest';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/location';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
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

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('../../utils/errors/handle');

const mockGetSuggestionsSection: jest.Mock<
  typeof getSuggestionsSection
> = getSuggestionsSection as any;
jest.mock('../../utils/searchSuggest/getSuggestionsSection');

const mockSuggestionHumanName: jest.Mock<
  typeof suggestionHumanName
> = suggestionHumanName as any;
jest.mock('../../utils/searchSuggest/suggestionHumanName');

describe('components/SearchSuggestField', () => {
  let addFilter: jest.SpyInstance;
  let fullTextSearch: jest.SpyInstance;
  let that: {
    props: {
      addFilter: typeof addFilter;
      fullTextSearch: typeof fullTextSearch;
    };
    setState: jasmine.Spy;
  };

  beforeEach(() => {
    // addFilter & fullTextSearch are used to update the current search query
    addFilter = jest.fn();
    fullTextSearch = jest.fn();
    // Stub the parts of the component instance we need to access
    that = {
      props: { addFilter, fullTextSearch },
      setState: jasmine.createSpy('setState'),
    };
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
      'Search for courses, organizations, subjects',
    );
  });

  describe('getSuggestionValue()', () => {
    beforeEach(mockSuggestionHumanName.mockClear);

    it('returns the human name for a resource-based suggestion', () => {
      const suggestion = { data: '3', model: 'organizations' } as any;
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
          model: 'courses',
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
            model: 'organizations',
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
    it('updates the value in state', () => {
      onChange.bind(that)({}, { newValue: 'the new value' });
      expect(that.setState).toHaveBeenCalledWith({ value: 'the new value' });
    });

    it('does not update the state when it is handed no params', () => {
      onChange.bind(that)({});
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
            case 'courses':
              return {
                message: 'Courses',
                model: 'courses',
                values: [
                  { title: 'Course #1' } as Course,
                  { title: 'Course #2' } as Course,
                ],
              };
            case 'subjects':
              return { message: 'Subjects', model: 'subjects', values: [] };
            case 'organizations':
              return {
                message: 'Organizations',
                model: 'organizations',
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
            message: 'Courses',
            model: 'courses',
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
    const mockSetHref = jest.spyOn(location, 'setHref');

    beforeEach(() => mockSetHref.mockReset());

    it('moves to the courses page when it is called with a course', () => {
      onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'courses', data: { id: 42 } as Course } },
      );
      expect(location.setHref).toHaveBeenCalledWith('https://42');
    });

    it('updates the filter and resets the suggestion state when it is called with a resource suggestion', () => {
      onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'subjects', data: { id: 43 } } },
      );
      expect(addFilter).toHaveBeenCalledWith('subjects', '43');
      expect(location.setHref).not.toHaveBeenCalled();

      onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'organizations', data: { id: 44 } } },
      );
      expect(addFilter).toHaveBeenCalledWith('organizations', '44');
      expect(location.setHref).not.toHaveBeenCalled();
    });

    it('updates the full text search when it is called with the default suggestion', () => {
      onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: null, data: 'my search' } },
      );
      expect(fullTextSearch).toHaveBeenCalledWith('my search');
      expect(location.setHref).not.toHaveBeenCalled();
    });
  });
});
