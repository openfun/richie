import '../../testSetup';

import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from '../../types/Course';
import { CourseGlimpse } from './CourseGlimpse';

describe('components/CourseGlimpse', () => {
  afterEach(cleanup);

  it('renders a course glimpse with its data', () => {
    const course = {
      cover_image: {
        alt: 'Alt text for course 42 cover image',
        src: '/thumbs/small.png',
      },
      organization_highlighted: 'Some Organization',
      state: {
        call_to_action: 'Enroll now',
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
    getByText('Enroll now');
    // The logo is rendered along with alternate text
    expect(getByAltText('Alt text for course 42 cover image')).toHaveAttribute(
      'src',
      '/thumbs/small.png',
    );
  });

  it('works when there is no call to action or datetime on the state (eg. an archived course)', () => {
    const course = {
      cover_image: {
        alt: 'Alt text for course 42 cover image',
        src: '/thumbs/small.png',
      },
      organization_highlighted: 'Some Organization',
      state: {
        call_to_action: null,
        datetime: null,
        text: 'archived',
      },
      title: 'Course 42',
    } as Course;
    const { getByText, getByTitle } = render(
      <IntlProvider locale="en">
        <CourseGlimpse course={course} />
      </IntlProvider>,
    );

    // Make sure the component renders and shows the state
    getByTitle('Details page for Course 42.');
    getByText('Archived');
  });

  it('shows the "Cover" placeholder div when the course is missing a cover image', () => {
    const course = {
      cover_image: null,
      organization_highlighted: 'Some Organization',
      state: {
        call_to_action: 'Enroll now',
        datetime: '2019-03-14T10:35:47.823Z',
        text: 'starts on',
      },
      title: 'Course 42',
    } as Course;
    const { getByText, getByTitle } = render(
      <IntlProvider locale="en">
        <CourseGlimpse course={course} />
      </IntlProvider>,
    );

    getByTitle('Details page for Course 42.');
    getByText('Cover');
  });
});
