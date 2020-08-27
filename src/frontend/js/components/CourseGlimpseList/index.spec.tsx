import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from 'types/Course';
import { CourseGlimpseList } from '.';

describe('components/CourseGlimpseList', () => {
  const commonDataProps = {
    assets: {
      icons: '/icons.svg',
    },
    csrftoken: 'the csrf token',
    environment: 'frontend_tests',
    release: '9.8.7',
    sentry_dsn: null,
  };

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
    render(
      <IntlProvider locale="en">
        <CourseGlimpseList
          context={commonDataProps}
          courses={courses}
          meta={{ count: 20, offset: 0, total_count: 45 }}
        />
      </IntlProvider>,
    );

    expect(
      screen.getAllByText('Showing 1 to 20 of 45 courses matching your search')
        .length,
    ).toEqual(1);
    // Both courses' titles are shown
    screen.getByText('Course 44');
    screen.getByText('Course 45');
  });
});
