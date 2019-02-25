import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { Course } from '../../types/Course';
import { CourseGlimpseList } from './CourseGlimpseList';

describe('components/CourseGlimpseList', () => {
  afterEach(cleanup);

  it('renders a list of Courses into a list of CourseGlimpses', () => {
    const courses = [
      { id: 44, title: 'Course 44' },
      { id: 45, title: 'Course 45' },
    ] as Course[];
    const { getByText } = render(<CourseGlimpseList courses={courses} />);

    // Both courses' titles are shown
    getByText('Course 44');
    getByText('Course 45');
  });
});
