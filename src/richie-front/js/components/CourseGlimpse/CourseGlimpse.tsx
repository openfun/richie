import * as React from 'react';
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
    defaultMessage: 'Logo for {courseTitle} course.',
    description: 'Alternate text for the course logo in a course glimpse.',
    id: 'components.CourseGlimpse.logoAltText',
  },
  date: {
    defaultMessage: 'Starts on {date}',
    description:
      "Shows the start date for a course in a course glimpse in a short format such as Sep 4, '1986'",
    id: 'components.CourseGlimpse.startsOn',
  },
});

export const CourseGlimpse = injectIntl(
  (props: CourseGlimpseProps & InjectedIntlProps) => {
    const { course, intl, organizationMain } = props;

    return (
      <a className="course-glimpse course-glimpse--link" href="#">
        <div className="course-glimpse__media">
          <img
            src={'https://www.fun-mooc.fr' + course.thumbnails.small}
            alt={intl.formatMessage(messages.altText, {
              courseTitle: course.title,
            })}
          />
        </div>
        <div className="course-glimpse__content">
          <div className="course-glimpse__content__wrapper">
            <p className="course-glimpse__content__title">{course.title}</p>
            <p>{(organizationMain && organizationMain.name) || ''}</p>
          </div>
        </div>
        <div className="course-glimpse__footer">
          <p className="course-glimpse__footer__date">
            <FormattedMessage
              {...messages.date}
              values={{
                date: (
                  <FormattedDate
                    value={new Date(course.start_date)}
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
    );
  },
);
