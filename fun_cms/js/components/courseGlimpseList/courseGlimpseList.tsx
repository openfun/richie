import * as React from 'react';

import CourseGlimpse from '../courseGlimpse/courseGlimpse';
import Course from '../../types/Course';

interface CourseGlimpseListState {}

export interface CourseGlimpseListProps {
  courses: Course[];
}

export class CourseGlimpseList extends React.Component<CourseGlimpseListProps, CourseGlimpseListState> {
  render () {
    const { courses } = this.props;

    return <div className="course-glimpse-list">
      {courses.map(course => <CourseGlimpse course={course} />)}
    </div>    
  }
}

export default CourseGlimpseList;
