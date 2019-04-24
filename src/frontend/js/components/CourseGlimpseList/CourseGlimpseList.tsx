import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { APIResponseListMeta } from '../../types/api';
import { Course } from '../../types/Course';
import { CourseGlimpse } from '../CourseGlimpse/CourseGlimpse';

const messages = defineMessages({
  courseCount: {
    defaultMessage:
      'Showing {courseCount, number} {courseCount, plural, one {course} other {courses}} matching your search',
    description:
      'Result count for course search. Appears right above search results',
    id: 'components.CourseGlimpseList.courseCount',
  },
});

interface CourseGlimpseListProps {
  courses: Course[];
  meta: APIResponseListMeta;
}

export const CourseGlimpseList = ({
  courses,
  meta,
}: CourseGlimpseListProps) => {
  return (
    <div className="course-glimpse-list">
      <div className="course-glimpse-list__count">
        <FormattedMessage
          {...messages.courseCount}
          values={{ courseCount: meta.total_count }}
        />
      </div>
      {courses.map(
        course => course && <CourseGlimpse course={course} key={course.id} />,
      )}
      {meta.total_count > 8 ? (
        <div className="course-glimpse-list__count">
          <FormattedMessage
            {...messages.courseCount}
            values={{ courseCount: meta.total_count }}
          />
        </div>
      ) : null}
    </div>
  );
};
