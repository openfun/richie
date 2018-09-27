import '../../testSetup';

import { render } from 'enzyme';
import * as React from 'react';

import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { CourseGlimpse } from './CourseGlimpse';

describe('components/CourseGlimpse', () => {
  it('renders a course glimpse with its data', () => {
    const course = {
      start_date: '2018-03-12T08:00:00Z',
      thumbnails: { small: '/thumbs/small.png' },
      title: 'Course 42',
    } as Course;
    const organization = {
      name: 'Some Organization',
    } as Organization;
    const wrapper = render(
      <CourseGlimpse course={course} organizationMain={organization} />,
    );

    expect(wrapper.html()).toContain('Course 42');
    expect(wrapper.find('img').attr('src')).toContain('/thumbs/small.png');
    expect(wrapper.html()).toContain('Starts on {date}');
    expect(wrapper.html()).toContain('Some Organization');
  });
});
