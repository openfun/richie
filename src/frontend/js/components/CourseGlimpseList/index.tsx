import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpse } from 'components/CourseGlimpse';
import { APIResponseListMeta } from 'types/api';
import { Course } from 'types/Course';

const messages = defineMessages({
  courseCount: {
    defaultMessage:
      'Showing {start, number} to {end, number} of {courseCount, number} ' +
      '{courseCount, plural, one {course} other {courses}} matching your search',
    description:
      'Result count & pagination information for course search. Appears right above search results',
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
          values={{
            courseCount: meta.total_count,
            end: meta.offset + meta.count,
            start: meta.offset + 1,
          }}
        />
      </div>
      {courses.map(
        course => course && <CourseGlimpse course={course} key={course.id} />,
      )}
    </div>
  );
};
