import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from '../../types/Course';
import { SearchSuggestionSection } from '../../types/searchSuggest';
import * as errors from '../../utils/errors/handle';
import { location } from '../../utils/indirection/location';
import * as searchSuggestUtils from '../../utils/searchSuggest/getSuggestionsSection';
import * as searchSuggestField from './SearchSuggestField';

describe('components/SearchSuggestField', () => {
  let addFilter: jasmine.Spy;
  let that: { props: { addFilter: jasmine.Spy }; setState: jasmine.Spy };

  beforeEach(() => {
    spyOn(errors, 'handle');
    // addFilter is the method passed through the props
    addFilter = jasmine.createSpy('addFilter');
    // Stub the parts of the component instance we need to access
    that = { props: { addFilter }, setState: jasmine.createSpy('setState') };
  });

  it('renders', () => {
    const { SearchSuggestFieldBase } = searchSuggestField;
    const wrapper = shallow(
      <SearchSuggestFieldBase
        addFilter={addFilter}
        intl={{ formatMessage: (message: any) => message.defaultMessage } as any}
      />,
    );
    expect(wrapper.html()).toContain(
      'Search for courses, organizations, subjects',
    );
  });

  describe('renderSuggestion()', () => {
    it('renders a single suggestion', () => {
      expect(
        searchSuggestField.renderSuggestion({
          data: { title: 'Some course title' } as Course,
          model: 'courses',
        }),
      ).toEqual(<span>Some course title</span>);
    });
  });

  describe('renderSectionTitle()', () => {
    it('renders a section title', () => {
      expect(
        searchSuggestField.renderSectionTitle(
          { formatMessage: ({ defaultMessage }: any) => defaultMessage } as any,
          {
            message: {
              defaultMessage: 'Some section title',
              id: 'someMessage',
            },
          } as SearchSuggestionSection,
        ),
      ).toEqual(<span>Some section title</span>);
    });
  });

  describe('onChange', () => {
    it('updates the value in state', () => {
      searchSuggestField.onChange.bind(that)({}, { newValue: 'the new value' });
      expect(that.setState).toHaveBeenCalledWith({ value: 'the new value' });
    });

    it('does not update the state when it is handed no params', () => {
      searchSuggestField.onChange.bind(that)({});
      expect(that.setState).not.toHaveBeenCalled();
    });
  });

  describe('onSuggestionsClearRequested()', () => {
    it('cleans up the suggestions in state', () => {
      searchSuggestField.onSuggestionsClearRequested.bind(that)();
      expect(that.setState).toHaveBeenCalledWith({ suggestions: [] });
    });
  });

  describe('onSuggestionsFetchRequested', () => {
    let getSuggestionsSectionSpy: jasmine.Spy;

    beforeEach(() => {
      getSuggestionsSectionSpy = spyOn(
        searchSuggestUtils,
        'getSuggestionsSection',
      );
    });

    it('just resets the suggestions when the value is less than 3 characters long', () => {
      searchSuggestField.onSuggestionsFetchRequested.bind(that)({ value: 'c' });
      expect(that.setState).toHaveBeenCalledWith({ suggestions: [] });
      expect(getSuggestionsSectionSpy).not.toHaveBeenCalled();
      expect(errors.handle).not.toHaveBeenCalled();
    });

    it('uses getSuggestionsSection to get and build a SearchhSuggestionsSection', async () => {
      getSuggestionsSectionSpy.and.callFake(
        async (model: SearchSuggestionSection['model']) => {
          switch (model) {
            case 'courses':
              return {
                model: 'courses',
                title: 'Courses',
                values: [
                  { title: 'Course #1' } as Course,
                  { title: 'Course #2' } as Course,
                ],
              };
            case 'subjects':
              return { model: 'subjects', title: 'Subjects', values: [] };
            case 'organizations':
              return {
                model: 'organizations',
                title: 'Organizations',
                values: [],
              };
          }
        },
      );

      await searchSuggestField.onSuggestionsFetchRequested.bind(that)({
        value: 'some search',
      });

      expect(that.setState).toHaveBeenCalledWith({
        suggestions: [
          {
            model: 'courses',
            title: 'Courses',
            values: [{ title: 'Course #1' }, { title: 'Course #2' }],
          },
        ],
      });
    });

    it('reports the error when getSuggestionsSection fails', async () => {
      getSuggestionsSectionSpy.and.returnValue(
        new Promise((resolve, reject) =>
          reject(new Error('Failed to get Suggestions Section!')),
        ),
      );

      await searchSuggestField.onSuggestionsFetchRequested.bind(that)({
        value: 'some search',
      });

      expect(errors.handle).toHaveBeenCalledWith(
        new Error('Failed to get Suggestions Section!'),
      );
    });
  });

  describe('onSuggestionSelected', () => {
    beforeEach(() => {
      spyOn(location, 'setHref');
    });

    it('moves to the courses page when it is called with a course', () => {
      searchSuggestField.onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'courses', data: { id: 42 } as Course } },
      );
      expect(location.setHref).toHaveBeenCalledWith('https://42');
    });

    it('updates the filer and resets the suggestion state when it is called with an org or a subject', () => {
      searchSuggestField.onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'subjects', data: { id: 43 } } },
      );
      expect(addFilter).toHaveBeenCalledWith('subjects', '43');
      expect(location.setHref).not.toHaveBeenCalled();

      searchSuggestField.onSuggestionSelected.bind(that)(
        {},
        { suggestion: { model: 'organizations', data: { id: 44 } } },
      );
      expect(addFilter).toHaveBeenCalledWith('organizations', '44');
      expect(location.setHref).not.toHaveBeenCalled();
    });
  });
});
