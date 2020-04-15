import React from 'react';
import { FormattedDate } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';

/**
 * <CourseGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 */
export const CourseGlimpseFooter = ({
  context,
  course,
}: { course: Course } & CommonDataProps) => (
  <div className="course-glimpse-footer">
    <div className="course-glimpse-footer__date">
      {course.state.text.charAt(0).toUpperCase() +
        course.state.text.substr(1) +
        ' '}
      {course.state.datetime ? (
        <span>
          <FormattedDate
            value={new Date(course.state.datetime)}
            year="numeric"
            month="short"
            day="numeric"
          />
        </span>
      ) : null}
    </div>
  </div>
);
