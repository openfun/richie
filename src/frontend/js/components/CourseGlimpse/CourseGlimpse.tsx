import React from 'react';
import {
  defineMessages,
  FormattedDate,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { Nullable } from '../../utils/types';

export interface CourseGlimpseProps {
  course: Course;
  organizationMain: Nullable<Organization>;
}

const messages = defineMessages({
  altText: {
    defaultMessage: 'Logo for {courseTitle}',
    description: 'Alternate text for the course logo in a course glimpse.',
    id: 'components.CourseGlimpse.logoAltText',
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
  ({
    course,
    intl,
    organizationMain,
  }: CourseGlimpseProps & InjectedIntlProps) => (
    <a
      className="course-glimpse course-glimpse--link"
      href={course.absolute_url}
      title={intl.formatMessage(messages.linkText, {
        courseTitle: course.title,
      })}
    >
      <div className="course-glimpse__media">
        <img
          src={course.cover_image}
          alt={intl.formatMessage(messages.altText, {
            courseTitle: course.title,
          })}
        />
      </div>
      <div className="course-glimpse__content">
        <div className="course-glimpse__content__wrapper">
          <p className="course-glimpse__content__title">{course.title}</p>
          <p>{(organizationMain && organizationMain.title) || ''}</p>
        </div>
      </div>
      <div className="course-glimpse__footer">
        <p className="course-glimpse__footer__date">
          <FormattedMessage
            {...messages.date}
            values={{
              date: (
                <FormattedDate
                  value={new Date(course.start)}
                  year="numeric"
                  month="short"
                  day="numeric"
                />
              ),
            }}
          />
        </p>
      </div>
    </a>
  ),
);
