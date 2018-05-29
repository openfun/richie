import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Course } from '../../types/Course';
import { CourseGlimpseContainer } from '../CourseGlimpseContainer/CourseGlimpseContainer';
import { CourseGlimpseList } from './CourseGlimpseList';

describe('components/CourseGlimpseList', () => {
  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      { id: 42, title: 'course-42' },
      { id: 42, title: 'course-43' },
    ] as Course[];
    const requestCourses = jasmine.createSpy('requestCourses');
    const wrapper = shallow(
      <CourseGlimpseList courses={courses} requestCourses={requestCourses} />,
    );

    const [course42, course43] = courses;
    expect(
      wrapper.childAt(0).equals(<CourseGlimpseContainer course={course42} />),
    ).toBeTruthy();
    expect(
      wrapper.childAt(1).equals(<CourseGlimpseContainer course={course43} />),
    ).toBeTruthy();
  });
});
