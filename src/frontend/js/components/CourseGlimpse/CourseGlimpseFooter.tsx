import React from 'react';
import { FormattedDate } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';

/**
 * <CourgeGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 */
export const CourseGlimpseFooter = ({
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
    {course.state.call_to_action ? (
      <div className="course-glimpse-footer__cta">
        <button className="button">
          {course.state.call_to_action.charAt(0).toUpperCase() +
            course.state.call_to_action.substr(1)}
        </button>
      </div>
    ) : null}
  </div>
);
