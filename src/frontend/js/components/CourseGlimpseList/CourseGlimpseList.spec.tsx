import '../../testSetup';

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from '../../types/Course';
import { CourseGlimpseList } from './CourseGlimpseList';

describe('components/CourseGlimpseList', () => {
  afterEach(cleanup);

  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      {
        id: '44',
        state: { datetime: '2019-03-14T10:35:47.823Z', text: '' },
        title: 'Course 44',
      },
      {
        id: '45',
        state: { datetime: '2019-03-14T10:35:47.823Z', text: '' },
        title: 'Course 45',
      },
    ] as Course[];
    const { getAllByText, getByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpseList
          courses={courses}
          meta={{ limit: 20, offset: 0, total_count: 5 }}
        />
      </IntlProvider>,
    );

    expect(
      getAllByText('Showing 5 courses matching your search').length,
    ).toEqual(1);
    // Both courses' titles are shown
    getByText('Course 44');
    getByText('Course 45');
  });

  it('shows the count twice if there are more than 8 courses to show', () => {
    const courses = [] as Course[];
    const { getAllByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpseList
          courses={courses}
          meta={{ limit: 20, offset: 0, total_count: 42 }}
        />
      </IntlProvider>,
    );

    expect(
      getAllByText('Showing 42 courses matching your search').length,
    ).toEqual(2);
  });
});
