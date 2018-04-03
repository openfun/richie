import Course from '../../types/Course';

export interface CourseAdd {
  course: Course;
  type: 'COURSE_ADD';
}

export function addCourse(course: Course): CourseAdd {
  return {
    course,
    type: 'COURSE_ADD',
  };
}
