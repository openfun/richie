import * as React from 'react';

import Course from '../../types/Course';
import CourseGlimpse from '../courseGlimpse/courseGlimpse';

export interface CourseGlimpseListProps {
  courses: Course[];
}

export const CourseGlimpseList = (props: CourseGlimpseListProps) => {
  const { courses } = props;

  return <div className="course-glimpse-list">
    {courses.map((course) => <CourseGlimpse course={course} />)}
  </div>;
};

export default CourseGlimpseList;
