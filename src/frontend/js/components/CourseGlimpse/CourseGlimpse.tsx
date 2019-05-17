import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import { Course } from '../../types/Course';

export interface CourseGlimpseProps {
  course: Course;
}

const messages = defineMessages({
  altText: {
    defaultMessage: 'Logo for {courseTitle}',
    description: 'Alternate text for the course logo in a course glimpse.',
    id: 'components.CourseGlimpse.logoAltText',
  },
  cover: {
    defaultMessage: 'Cover',
    description:
      'Placeholder text when the course we are glimpsing at is missing a cover image',
    id: 'components.CourseGlimpse.cover',
  },
  date: {
    defaultMessage: 'Starts on {date}',
    description:
      "Shows the start date for a course in a course glimpse in a short format such as Sep 4, '1986'",
    id: 'components.CourseGlimpse.startsOn',
  },
  linkText: {
    defaultMessage: 'Details page for {courseTitle}.',
    description: 'Accessibility title for links on course glimpses.',
    id: 'components.CourseGlimpse.linkText',
  },
});

export const CourseGlimpse = injectIntl(
  ({ course, intl }: CourseGlimpseProps & InjectedIntlProps) => (
    <a
      className="course-glimpse course-glimpse--link"
      href={course.absolute_url}
      title={intl.formatMessage(messages.linkText, {
        courseTitle: course.title,
      })}
    >
      <div className="course-glimpse__media">
        {course.cover_image ? (
          <img {...course.cover_image} />
        ) : (
          <div className="course-glimpse__media__empty">
            <FormattedMessage {...messages.cover} />
          </div>
        )}
      </div>
      <div className="course-glimpse__content">
        <div className="course-glimpse__content__wrapper">
          <p className="course-glimpse__content__title">{course.title}</p>
          <p>{course.organization_highlighted}</p>
        </div>
      </div>
      <div className="course-glimpse__footer">
        <p className="course-glimpse__footer__date">
          {course.state.text.charAt(0).toUpperCase() +
            course.state.text.substr(1)}
          {course.state.datetime ? (
            <React.Fragment>
              <br />
              <FormattedDate
                value={new Date(course.state.datetime)}
                year="numeric"
                month="short"
                day="numeric"
              />
            </React.Fragment>
          ) : null}
        </p>
        {course.state.call_to_action ? (
          <div className="course-glimpse__footer__cta">
            <button className="button">
              {course.state.call_to_action.charAt(0).toUpperCase() +
                course.state.call_to_action.substr(1)}
            </button>
          </div>
        ) : null}
      </div>
    </a>
  ),
);
