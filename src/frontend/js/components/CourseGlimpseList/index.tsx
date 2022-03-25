import { defineMessages, FormattedMessage } from 'react-intl';

import { CourseGlimpse } from 'components/CourseGlimpse';
import { APIResponseListMeta } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';

const messages = defineMessages({
  courseCount: {
    defaultMessage:
      'Showing {start, number} to {end, number} of {courseCount, number} {courseCount, plural, one {course} other {courses}} matching your search',
    description:
      'Result count & pagination information for course search. Appears right above search results',
    id: 'components.CourseGlimpseList.courseCount',
  },
  offscreenCourseCount: {
    defaultMessage:
      '{courseCount, number} {courseCount, plural, one {course} other {courses}} matching your search',
    description: 'Short result count information for course search. Only for screen readers',
    id: 'components.CourseGlimpseList.offscreenCourseCount',
  },
});

interface CourseGlimpseListProps {
  courses: Course[];
  meta: APIResponseListMeta;
}

export const CourseGlimpseList = ({
  context,
  courses,
  meta,
}: CourseGlimpseListProps & CommonDataProps) => {
  return (
    <div className="course-glimpse-list">
      <div
        className="offscreen"
        data-testid="course-glimpse-sr-count"
        aria-live="polite"
        aria-atomic="true"
      >
        <FormattedMessage
          {...messages.offscreenCourseCount}
          values={{
            courseCount: meta.total_count,
          }}
        />
      </div>
      <div className="course-glimpse-list__count" aria-hidden="true">
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
        (course) => course && <CourseGlimpse context={context} course={course} key={course.id} />,
      )}
    </div>
  );
};
