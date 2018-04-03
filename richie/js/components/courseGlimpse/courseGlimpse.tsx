import * as moment from 'moment';
import * as React from 'react';

import Course from '../../types/Course';

export interface CourseGlimpseProps {
  course: Course;
}

export const CourseGlimpse = (props: CourseGlimpseProps) => {
  const { course } = props;

  return <div className="course-glimpse-container">
    <div className="course-glimpse">
      <img className="course-glimpse__image" src={'https://www.fun-mooc.fr' + course.thumbnails.small} alt=""/>
      <div className="course-glimpse__body">
        <div className="course-glimpse__body__title">{course.title}</div>
        {/* TODO: Replace this with the real organization name from the relevant organization record */}
        <div className="course-glimpse__body__org">Organization Name</div>
      </div>
      <div className="course-glimpse__date">Starts on {moment(course.start_date, moment.ISO_8601).format('ll')}</div>
    </div>
  </div>;
};

export default CourseGlimpse;
