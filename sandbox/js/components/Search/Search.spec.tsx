import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { CourseGlimpseListContainer } from '../CourseGlimpseListContainer/CourseGlimpseListContainer';
import { SearchFiltersPane } from '../SearchFiltersPane/SearchFiltersPane';
import { Search } from './Search';

describe('components/Search', () => {
  it('renders the filters pane and the list of courses', () => {
    const orgSpy = jasmine.createSpy('OrganizationSpy');
    const subjSpy = jasmine.createSpy('SubjectsSpy');
    const wrapper = shallow(
      <Search requestOrganizations={orgSpy} requestSubjects={subjSpy} />,
    );

    expect(wrapper.find(CourseGlimpseListContainer).length).toEqual(1);
    expect(wrapper.find(SearchFiltersPane).length).toEqual(1);
    expect(orgSpy).toHaveBeenCalled();
    expect(subjSpy).toHaveBeenCalled();
  });
});
