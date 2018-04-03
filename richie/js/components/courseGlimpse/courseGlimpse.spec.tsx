import '../../testSetup.spec';

import { render } from 'enzyme';
import * as React from 'react';

import Course from '../../types/Course';
import CourseGlimpse from './courseGlimpse';

describe('components/courseGlimpse', () => {
  it('renders a course glimpse with its data', () => {
    const course = {
      start_date: '2018-03-12T08:00:00Z',
      thumbnails: { small: '/thumbs/small.png' },
      title: 'Course 42',
    } as Course;
    const wrapper = render(<CourseGlimpse course={course} />);

    expect(wrapper.html()).toContain('Course 42');
    expect(wrapper.find('img').attr('src')).toContain('/thumbs/small.png');
    expect(wrapper.html()).toContain('Starts on Mar 12, 2018');
  });
});
