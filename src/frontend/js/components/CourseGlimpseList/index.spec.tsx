import 'testSetup';

import { render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from 'types/Course';
import { CourseGlimpseList } from '.';

describe('components/CourseGlimpseList', () => {
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
          meta={{ count: 20, offset: 0, total_count: 45 }}
        />
      </IntlProvider>,
    );

    expect(
      getAllByText('Showing 1 to 20 of 45 courses matching your search').length,
    ).toEqual(1);
    // Both courses' titles are shown
    getByText('Course 44');
    getByText('Course 45');
  });
});
