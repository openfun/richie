import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { CourseGlimpse } from './CourseGlimpse';

describe('components/CourseGlimpse', () => {
  afterEach(cleanup);

  it('renders a course glimpse with its data', () => {
    const course = {
      cover_image: '/thumbs/small.png',
      start: '2018-03-12T08:00:00Z',
      title: 'Course 42',
    } as Course;
    const organization = {
      title: 'Some Organization',
    } as Organization;
    const { getByAltText, getByText, getByTitle } = render(
      <CourseGlimpse course={course} organizationMain={organization} />,
    );

    // The link that wraps the course glimpse has its title
    getByTitle('Details page for {courseTitle}.');
    // The course glimpse shows the relevant information
    getByText('Course 42');
    getByText('Some Organization');
    getByText('Starts on {date}');
    // The logo is rendered along with alternate text
    expect(getByAltText('Logo for {courseTitle}')).toHaveAttribute(
      'src',
      '/thumbs/small.png',
    );
  });
});
