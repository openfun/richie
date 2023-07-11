import { defineMessages, FormattedMessage } from 'react-intl';
import React, { useState } from 'react';
import classNames from 'classnames';
import { CourseRun } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { DjangoCMSPluginCourseRun, DjangoCMSTemplate } from 'components/DjangoCMSTemplate';
import { StringHelper } from 'utils/StringHelper';

const messages = defineMessages({
  courseRunTitleWithDates: {
    id: 'components.SyllabusSimpleCourseRunsList.courseRunTitleWithDates',
    description: 'Course run details displayed on the syllabus',
    defaultMessage: '{title}, from {start} to {end}',
  },
  courseRunWithDates: {
    id: 'components.SyllabusSimpleCourseRunsList.courseRunWithDates',
    description: 'Course run details displayed on the syllabus when it has no title',
    defaultMessage: 'From {start} to {end}',
  },
  viewMore: {
    id: 'components.SyllabusSimpleCourseRunsList.viewMore',
    description: 'Button displayed on the syllabus when not all course runs are displayed',
    defaultMessage: 'View more',
  },
});

export const SyllabusSimpleCourseRunsList = ({
  courseRuns,
  maxCourseRuns,
}: {
  courseRuns: CourseRun[];
  maxCourseRuns?: number;
}) => {
  const [displayCount, setDisplayCount] = useState(maxCourseRuns ?? courseRuns.length);
  if (!courseRuns.length) {
    return null;
  }
  /**
   * Important point: here we use a class "is-hidden" to hide course runs, we could have instead decided
   * to just not render the course runs to be hidden, but this was on purpose. DjangoCMSTemplate renders
   * <template> tags the first time, and they are removed automatically after the first render when calling the init
   * method of DjangoCMS plugins. If we had simply decided to render hidden runs after the click on
   * "View more", the <template> tags would have been rendered after the call to plugins init, which would have
   * left empty <template> tags in the DOM resulting in non-loaded plugins.
   */

  return (
    <>
      <ul className="course-detail__run-list">
        {courseRuns.map((run, i) => (
          <DjangoCMSTemplate key={run.id} plugin={DjangoCMSPluginCourseRun(run)}>
            <li
              key={run.id}
              className={classNames('course-detail__run-list--course_and_search', {
                'is-hidden': i >= displayCount,
              })}
            >
              {run.snapshot ? (
                <a href={run.snapshot}>
                  <CourseRunItem item={run} />
                </a>
              ) : (
                <CourseRunItem item={run} />
              )}
            </li>
          </DjangoCMSTemplate>
        ))}
      </ul>
      {displayCount < courseRuns.length && (
        <button
          type="button"
          className="course-detail__view-more-runs"
          onClick={() => setDisplayCount(courseRuns.length)}
        >
          <FormattedMessage {...messages.viewMore} />
        </button>
      )}
    </>
  );
};

const CourseRunItem = ({ item }: { item: CourseRun }) => {
  const formatDate = useDateFormat();

  return item.title ? (
    <FormattedMessage
      {...messages.courseRunTitleWithDates}
      values={{
        start: item.start ? formatDate(item.start) : '...',
        end: item.end ? formatDate(item.end) : '...',
        title: StringHelper.capitalizeFirst(item.title),
      }}
    />
  ) : (
    <FormattedMessage
      {...messages.courseRunWithDates}
      values={{
        start: item.start ? formatDate(item.start) : '...',
        end: item.end ? formatDate(item.end) : '...',
      }}
    />
  );
};
