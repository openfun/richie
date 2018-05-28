import * as React from 'react';

import { ResourceListGet } from '../../data/genericSideEffects/getResourceList/actions';
import { Course } from '../../types/Course';
import { CourseGlimpseContainer } from '../courseGlimpseContainer/courseGlimpseContainer';

export interface CourseGlimpseListProps {
  courses: Course[];
  requestCourses: () => ResourceListGet;
}

export class CourseGlimpseList extends React.Component<CourseGlimpseListProps> {
  componentWillMount() {
    this.props.requestCourses();
  }

  render() {
    const { courses } = this.props;

    return (
      <div className="course-glimpse-list">
        {courses.map(course => (
          <CourseGlimpseContainer course={course} key={course.id} />
        ))}
      </div>
    );
  }
}
