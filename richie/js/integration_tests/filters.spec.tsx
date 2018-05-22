import '../testSetup.spec';

import { mount, ReactWrapper } from 'enzyme';
import * as fetchMock from 'fetch-mock';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, Store } from 'react-redux';

import bootstrapStore from '../bootstrap';
import { SearchFilter } from '../components/searchFilter/searchFilter';
import { SearchFilterGroupContainer } from '../components/searchFilterGroupContainer/searchFilterGroupContainer';
import { SearchFiltersPane } from '../components/searchFiltersPane/searchFiltersPane';
import { addMultipleResources } from '../data/genericReducers/resourceById/actions';
import { didGetResourceList } from '../data/genericSideEffects/getResourceList/actions';
import { RootState } from '../data/rootReducer';

describe('Integration tests - filters', () => {
  let store: Store<RootState>;
  let searchFiltersPane: ReactWrapper;

  beforeEach(() => {
    spyOn(window.history, 'pushState');

    // Create the store with the same initial state as in-app
    store = bootstrapStore();
    // Create some organizations, subjects and courses facets and put them in our store so we can
    // use them to test the filters
    const orgs = [
      {
        banner: null,
        code: 'org-3',
        id: 3,
        logo: null,
        name: 'Organization Three',
      },
      {
        banner: null,
        code: 'org-4',
        id: 4,
        logo: null,
        name: 'Organization Four',
      },
      {
        banner: null,
        code: 'org-5',
        id: 5,
        logo: null,
        name: 'Organization Five',
      },
    ];
    store.dispatch(addMultipleResources('organizations', orgs));
    store.dispatch(
      didGetResourceList(
        'organizations',
        {
          meta: { limit: 3, offset: 0, total_count: 3 },
          objects: orgs,
        },
        { limit: 0, offset: 3 },
      ),
    );
    const subjects = [
      { id: 31, image: null, name: 'Subject Thirty-One' },
      { id: 41, image: null, name: 'Subject Forty-One' },
      { id: 51, image: null, name: 'Subject Fifty-One' },
    ];
    store.dispatch(addMultipleResources('subjects', subjects));
    store.dispatch(
      didGetResourceList(
        'subjects',
        {
          meta: { limit: 3, offset: 0, total_count: 3 },
          objects: subjects,
        },
        { limit: 0, offset: 3 },
      ),
    );
    store.dispatch(
      didGetResourceList(
        'courses',
        {
          facets: {
            organizations: { 3: 12, 4: 87, 5: 56 },
            subjects: { 31: 1, 41: 3, 51: 9 },
          },
          meta: { limit: 0, offset: 0, total_count: 400 },
          objects: [],
        },
        { limit: 0, offset: 0 },
      ),
    );
    // Render and mount our whole filters pane
    searchFiltersPane = mount(
      <Provider store={store}>
        <SearchFiltersPane />
      </Provider>,
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('shows the values for the hardcoded filters in their groups', () => {
    const filterGroupNew = searchFiltersPane
      .find(SearchFilterGroupContainer)
      .filterWhere(wrapper => wrapper.prop('machineName') === 'new');
    expect(
      filterGroupNew.containsMatchingElement(
        <button className="search-filter ">First session</button>,
      ),
    ).toBeTruthy();
  });

  it('shows the values for the resource-based filters in their groups, ordered by facet count', () => {
    const filtersOrganizations = searchFiltersPane
      .find(SearchFilterGroupContainer)
      .filterWhere(wrapper => wrapper.prop('machineName') === 'organizations')
      .find(SearchFilter);
    expect(filtersOrganizations.at(0).html()).toContain(
      'Organization Four',
      '87',
    );
    expect(filtersOrganizations.at(1).html()).toContain(
      'Organization Five',
      '56',
    );
    expect(filtersOrganizations.at(2).html()).toContain(
      'Organization Three',
      '12',
    );
  });

  it('adds the value to the relevant filter when the user clicks on a filter value', async () => {
    // Return the same thing as what's already in state, we don't intend to modify the state
    fetchMock.get('/api/v1.0/courses/?limit=0&offset=0&organizations=5', {
      facets: {
        organizations: { 3: 12, 4: 87, 5: 56 },
        subjects: { 31: 1, 41: 3, 51: 9 },
      },
      meta: { limit: 0, offset: 0, total_count: 400 },
      objects: [],
    });

    // Simulate a click on the filter we wish to add
    searchFiltersPane
      .find(SearchFilter)
      .filterWhere(
        wrapper => wrapper.html().indexOf('Organization Five') !== -1,
      )
      .simulate('click');

    // Flush all promises (let data from our fetchMock reach the store)
    await new Promise(resolve => setImmediate(resolve));

    // Our newly active filter should be at the top
    const topOrgsFilter = searchFiltersPane
      .find(SearchFilterGroupContainer)
      .filterWhere(wrapper => wrapper.prop('machineName') === 'organizations')
      .render()
      .find('.search-filter')
      .first();

    // The correct filter is at the top and marked as active
    expect(topOrgsFilter.html()).toContain('Organization Five');
    expect(topOrgsFilter.hasClass('active')).toBeTruthy();

    // URL has been updated with the filter
    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      '',
      '?limit=0&offset=0&organizations=5',
    );
  });

  it('removes the filter value when the user clicks on an active filter', async () => {
    // Return the same thing as what's already in state, we don't intend to modify the state
    fetchMock.get('/api/v1.0/courses/?limit=0&offset=0', {
      facets: {
        organizations: { 3: 12, 4: 87, 5: 56 },
        subjects: { 31: 1, 41: 3, 51: 9 },
      },
      meta: { limit: 0, offset: 0, total_count: 400 },
      objects: [],
    });

    // Set the subjects filter to '41'
    store.dispatch(
      didGetResourceList(
        'courses',
        {
          facets: {
            organizations: { 3: 12, 4: 87, 5: 56 },
            subjects: { 31: 1, 41: 3, 51: 9 },
          },
          meta: { limit: 0, offset: 0, total_count: 400 },
          objects: [],
        },
        { limit: 0, offset: 0, subjects: '41' },
      ),
    );

    // Ensure the value is active before we go on to disable it
    expect(
      searchFiltersPane
        .render()
        .find('.search-filter.active')
        .html(),
    ).toContain('Subject Forty-One');

    // Simulate a click on the filter we want to disable
    searchFiltersPane
      .find(SearchFilter)
      .filterWhere(
        wrapper => wrapper.html().indexOf('Subject Forty-One') !== -1,
      )
      .simulate('click');

    // Flush all promises (let data from our fetchMock reach the store)
    await new Promise(resolve => setImmediate(resolve));

    // Our previously active filter is not at the top, instead it is the filter with the highest facet count
    expect(
      searchFiltersPane
        .find(SearchFilterGroupContainer)
        .filterWhere(wrapper => wrapper.prop('machineName') === 'subjects')
        .render()
        .find('.search-filter')
        .first()
        .html(),
    ).toContain('Subject Fifty-One');

    // Our previously active filter is not marked as active any more
    expect(
      searchFiltersPane
        .find(SearchFilter)
        .filterWhere(
          wrapper => wrapper.html().indexOf('Subject Forty-One') !== -1,
        )
        .render()
        .hasClass('active'),
    ).not.toBeTruthy();

    // URL has been updated to remove the filter
    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      '',
      '?limit=0&offset=0',
    );
  });
});
