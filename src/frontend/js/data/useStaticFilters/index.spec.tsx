import { act, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { FilterDefinition } from 'types/filters';
import { Deferred } from 'utils/test/deferred';
import { useStaticFilters } from '.';

describe('data/useStaticFilters', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = ({ includeCoursesConfig = false }) => {
    const hookValues = useStaticFilters(includeCoursesConfig);
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  // Make some static filter definition to use throughout our tests
  const levels: FilterDefinition = {
    base_path: '00030002',
    human_name: 'Levels',
    is_autocompletable: false,
    is_searchable: false,
    name: 'levels',
    position: 0,
  };

  const organizations: FilterDefinition = {
    base_path: '0002',
    human_name: 'Organizations',
    is_autocompletable: true,
    is_searchable: true,
    name: 'organizations',
    position: 1,
  };

  const persons: FilterDefinition = {
    base_path: null,
    human_name: 'Persons',
    is_autocompletable: true,
    is_searchable: true,
    name: 'persons',
    position: 2,
  };

  const subjects: FilterDefinition = {
    base_path: '00030001',
    human_name: 'Subjects',
    is_autocompletable: true,
    is_searchable: true,
    name: 'subjects',
    position: 3,
  };

  const staticFilterDefinitions = {
    levels,
    organizations,
    persons,
    subjects,
  };

  beforeEach(() => fetchMock.restore());

  it('gets and returns the static filter definitions', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/v1.0/filter-definitions/', deferred.promise);

    render(<TestComponent />);
    // No request is made until we actually use the hook's return value
    expect(fetchMock.called('/api/v1.0/filter-definitions/')).toEqual(false);

    // useStaticFilters returns a promise for the static filter definitions
    let filters;
    await act(async () => {
      deferred.resolve(staticFilterDefinitions);
      filters = await getLatestHookValues()();
    });
    expect(filters).toEqual(staticFilterDefinitions);
    expect(fetchMock.calls('/api/v1.0/filter-definitions/').length).toEqual(1);
    fetchMock.restore();
    fetchMock.get('/api/v1.0/filter-definitions/', new Error('should not be called'));
    // More calls return the filter but don't request on the API again
    let filtersAgain;
    await act(async () => (filtersAgain = await getLatestHookValues()()));
    expect(filtersAgain).toEqual(staticFilterDefinitions);
    expect(fetchMock.calls('/api/v1.0/filter-definitions/').length).toEqual(0);
  });

  it('includes a course config when requested', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', staticFilterDefinitions);
    render(<TestComponent includeCoursesConfig={true} />);

    let filters;
    await act(async () => (filters = await getLatestHookValues()()));
    expect(filters).toEqual({
      ...staticFilterDefinitions,
      courses: {
        base_path: null,
        human_name: 'Courses',
        is_autocompletable: true,
        is_searchable: true,
        name: 'courses',
        position: 99,
      },
    });
  });
});
