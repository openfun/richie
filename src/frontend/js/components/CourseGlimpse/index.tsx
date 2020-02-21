import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';
import { CourseGlimpseFooter } from './CourseGlimpseFooter';

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

export const CourseGlimpse = ({
  context,
  course,
}: CourseGlimpseProps & CommonDataProps) => (
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
    <div className="course-glimpse__content">
      {course.icon ? (
        <div className="course-glimpse__icon">
          <div
            className="course-glimpse__band"
            style={{ background: course.icon.color }}
          >
            {course.icon.title}
          </div>
          <img
            src={course.icon.src}
            srcSet={course.icon.srcset}
            sizes={course.icon.sizes}
            alt=""
          />
        </div>
      ) : null}
      <div className="course-glimpse__wrapper">
        <p className="course-glimpse__title">{course.title}</p>
        <div className="course-glimpse__excerpt">
          Lorem ipsum dolor sit amet consectetur adipiscim elit
        </div>
        <div className="course-glimpse__organization">
          {course.organization_highlighted}
        </div>
      </div>
      <CourseGlimpseFooter context={context} course={course} />
    </div>
  </a>
);
