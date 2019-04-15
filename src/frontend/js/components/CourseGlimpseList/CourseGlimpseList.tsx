import React from 'react';

import { Course } from '../../types/Course';
import { CourseGlimpse } from '../CourseGlimpse/CourseGlimpse';

interface CourseGlimpseListProps {
  courses: Course[];
}

export const CourseGlimpseList = ({ courses }: CourseGlimpseListProps) => {
  return (
    <div className="course-glimpse-list">
      {courses.map(
        course => course && <CourseGlimpse course={course} key={course.id} />,
      )}
    </div>
  );
};
