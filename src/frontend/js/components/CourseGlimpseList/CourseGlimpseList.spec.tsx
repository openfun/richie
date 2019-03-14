import '../../testSetup';

import React from 'react';
import { cleanup, render } from 'react-testing-library';

import { Course } from '../../types/Course';
import { CourseGlimpseList } from './CourseGlimpseList';

describe('components/CourseGlimpseList', () => {
  afterEach(cleanup);

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
    const { getByText } = render(<CourseGlimpseList courses={courses} />);

    // Both courses' titles are shown
    getByText('Course 44');
    getByText('Course 45');
  });
});
