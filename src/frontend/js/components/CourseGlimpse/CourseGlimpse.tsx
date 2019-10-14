import React from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';

import { Course } from 'types/Course';

export interface CourseGlimpseProps {
  course: Course;
}

const messages = defineMessages({
  cover: {
    defaultMessage: 'Cover',
    description:
      'Placeholder text when the course we are glimpsing at is missing a cover image',
    id: 'components.CourseGlimpse.cover',
  },
});

export const CourseGlimpse = ({ course }: CourseGlimpseProps) => (
  <a className="course-glimpse course-glimpse--link" href={course.absolute_url}>
    <div className="course-glimpse__media">
      {course.cover_image ? (
        <img
          alt=""
          sizes={course.cover_image.sizes}
          src={course.cover_image.src}
          srcSet={course.cover_image.srcset}
        />
      ) : (
        <div className="course-glimpse__media__empty">
          <FormattedMessage {...messages.cover} />
        </div>
      )}
    </div>
    {course.icon ? (
      <div className="course-glimpse__icon">
        <div
          className="course-glimpse__icon__band"
          style={{ background: course.icon.color }}
        >
          {course.icon.title}
          <div
            className="course-glimpse__icon__band__end"
            style={{ borderLeftColor: course.icon.color }}
          ></div>
        </div>
        <img
          src={course.icon.src}
          srcSet={course.icon.srcset}
          sizes={course.icon.sizes}
          alt=""
        />
      </div>
    ) : null}
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
);
