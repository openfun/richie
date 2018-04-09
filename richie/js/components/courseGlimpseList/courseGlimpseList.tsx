import * as React from 'react';

import { CourseListGet } from '../../data/course/actions';
import Course from '../../types/Course';
import CourseGlimpse from '../courseGlimpse/courseGlimpse';

export interface CourseGlimpseListProps {
  courses: Course[];
  requestCourses: () => CourseListGet;
}

export class CourseGlimpseList extends React.Component<CourseGlimpseListProps> {
  componentWillMount() {
    this.props.requestCourses();
  }

  render() {
    const { courses } = this.props;

    return <div className="course-glimpse-list">
      {courses.map((course) => <CourseGlimpse course={course} key={course.id} />)}
    </div>;
  }
}

export default CourseGlimpseList;
