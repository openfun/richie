import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { CourseGlimpse } from './CourseGlimpse';

describe('components/CourseGlimpse', () => {
  it('renders a course glimpse with its data', () => {
    const course = {
      cover_image: '/thumbs/small.png',
      start: '2018-03-12T08:00:00Z',
      title: 'Course 42',
    } as Course;
    const organization = {
      title: 'Some Organization',
    } as Organization;
    const wrapper = shallow(
      <CourseGlimpse course={course} organizationMain={organization} />,
    );

    expect(wrapper.html()).toContain('Course 42');
    expect(wrapper.html()).toContain('Details page for {courseTitle}');
    expect(wrapper.html()).toContain('Starts on {date}');
    expect(wrapper.html()).toContain('Some Organization');
    const img = wrapper.dive().find('img');
    expect(img.prop('src')).toEqual('/thumbs/small.png');
    expect(img.prop('alt')).toEqual('Logo for {courseTitle}');
  });
});
