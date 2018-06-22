import * as moment from 'moment';
import * as React from 'react';

import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { Nullable } from '../../utils/types';

export interface CourseGlimpseProps {
  course: Course;
  organizationMain: Nullable<Organization>;
}

export const CourseGlimpse = (props: CourseGlimpseProps) => {
  const { course, organizationMain } = props;

  return (
    <div className="course-glimpse-container">
      <div className="course-glimpse">
        <img
          className="course-glimpse__image"
          src={'https://www.fun-mooc.fr' + course.thumbnails.small}
          alt=""
        />
        <div className="course-glimpse__body">
          <div className="course-glimpse__body__title">{course.title}</div>
          <div className="course-glimpse__body__org">
            {(organizationMain && organizationMain.name) || ''}
          </div>
        </div>
        <div className="course-glimpse__date">
          Starts on {moment(course.start_date, moment.ISO_8601).format('ll')}
        </div>
      </div>
    </div>
  );
};
