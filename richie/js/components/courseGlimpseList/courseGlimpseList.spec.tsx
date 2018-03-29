import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import Course from '../../types/Course';
import CourseGlimpse from '../courseGlimpse/courseGlimpse';
import CourseGlimpseList from './courseGlimpseList';

describe('components/courseGlimpseList', () => {
  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [ { id: 42, title: 'course-42' }, { id: 42, title: 'course-43' } ] as Course[];
    const [ course42, course43 ] = courses;
    const wrapper = shallow(<CourseGlimpseList courses={courses} />);

    expect(wrapper.childAt(0).equals(<CourseGlimpse course={course42} />)).toBeTruthy();
    expect(wrapper.childAt(1).equals(<CourseGlimpse course={course43} />)).toBeTruthy();
  });
});
