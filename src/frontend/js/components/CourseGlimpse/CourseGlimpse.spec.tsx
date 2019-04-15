import '../../testSetup';

import React from 'react';
import { IntlProvider } from 'react-intl';
import { cleanup, render } from 'react-testing-library';

import { Course } from '../../types/Course';
import { CourseGlimpse } from './CourseGlimpse';

describe('components/CourseGlimpse', () => {
  afterEach(cleanup);

  it('renders a course glimpse with its data', () => {
    const course = {
      cover_image: '/thumbs/small.png',
      organization_highlighted: 'Some Organization',
      state: {
        datetime: '2019-03-14T10:35:47.823Z',
        text: 'starts on',
      },
      title: 'Course 42',
    } as Course;
    const { getByAltText, getByText, getByTitle } = render(
      <IntlProvider locale="en">
        <CourseGlimpse course={course} />
      </IntlProvider>,
    );

    // The link that wraps the course glimpse has its title
    getByTitle('Details page for Course 42.');
    // The course glimpse shows the relevant information
    getByText('Course 42');
    getByText('Some Organization');
    // Matches on 'Starts on Mar 14, 2019', date is wrapped with intl <span>
    getByText(
      (_, element) =>
        element.innerHTML.startsWith('Starts on') &&
        element.innerHTML.includes('Mar 14, 2019'),
    );
    // The logo is rendered along with alternate text
    expect(getByAltText('Logo for Course 42')).toHaveAttribute(
      'src',
      '/thumbs/small.png',
    );
  });
});
