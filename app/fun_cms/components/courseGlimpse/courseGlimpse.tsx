import * as React from "react";

import { Course } from '../../types/Course';

interface CourseGlimpseState {}

export interface CourseGlimpseProps {
  course: Course;
}

export class CourseGlimpse extends React.Component<CourseGlimpseProps, CourseGlimpseState> {
  render () {
    const { course } = this.props;

    return <div className="course-glimpse-container">
      <div className="course-glimpse">
        <img className="course-glimpse__image" src={'https://www.fun-mooc.fr' + course.thumbnails.small} alt=""/>
        <div className="course-glimpse__body">
          <div className="course-glimpse__body__title">{course.title}</div>
          <div className="course-glimpse__body__org">{course.main_university.name}</div>
        </div>
        <div className="course-glimpse__date">Starts on {course.start_date_display}</div>
      </div>
    </div>
  }
}