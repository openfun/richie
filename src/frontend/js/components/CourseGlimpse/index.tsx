import { memo } from 'react';
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
    description: 'Placeholder text when the course we are glimpsing at is missing a cover image',
    id: 'components.CourseGlimpse.cover',
  },
});

const CourseGlimpseBase = ({ context, course }: CourseGlimpseProps & CommonDataProps) => (
  <a className="course-glimpse course-glimpse--link" href={course.absolute_url}>
    <div className="course-glimpse__media">
      {/* alt forced to empty string because it's a decorative image */}
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
          <span className="category-badge">
            {/* alt forced to empty string because it's a decorative image */}
            <img
              alt=""
              className="category-badge__icon"
              sizes={course.icon.sizes}
              src={course.icon.src}
              srcSet={course.icon.srcset}
            />
            <span className="category-badge__title">{course.icon.title}</span>
          </span>
        </div>
      ) : null}
      <div className="course-glimpse__wrapper">
        <h3 className="course-glimpse__title" title={course.title}>
          {course.title}
        </h3>
        {course.organization_highlighted_cover_image ? (
          <div className="course-glimpse__organization-logo">
            {/* alt forced to empty string because it's a decorative image */}
            <img
              alt=""
              sizes={course.organization_highlighted_cover_image.sizes}
              src={course.organization_highlighted_cover_image.src}
              srcSet={course.organization_highlighted_cover_image.srcset}
            />
          </div>
        ) : null}
        <div className="course-glimpse__metadata course-glimpse__metadata--organization">
          <svg aria-hidden={true} role="img" className="icon">
            <use xlinkHref="#icon-org" />
          </svg>
          <span className="title" title={course.organization_highlighted}>
            {course.organization_highlighted}
          </span>
        </div>
        <div className="course-glimpse__metadata course-glimpse__metadata--code">
          <svg aria-hidden={true} role="img" className="icon">
            <use xlinkHref="#icon-barcode" />
          </svg>
          <span>{course.code || '-'}</span>
        </div>
      </div>
      <CourseGlimpseFooter context={context} course={course} />
    </div>
  </a>
);

const areEqual: (
  prevProps: Readonly<CourseGlimpseProps & CommonDataProps>,
  newProps: Readonly<CourseGlimpseProps & CommonDataProps>,
) => boolean = (prevProps, newProps) =>
  prevProps.context === newProps.context && prevProps.course.id === newProps.course.id;

export const CourseGlimpse = memo(CourseGlimpseBase, areEqual);
