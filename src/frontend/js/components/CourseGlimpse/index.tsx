import { memo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';
import { Icon } from 'components/Icon';
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
  organizationIconAlt: {
    defaultMessage: 'Organization',
    description: 'Organization logo alternative text for screen reader users',
    id: 'components.CourseGlimpse.organizationIconAlt',
  },
  codeIconAlt: {
    defaultMessage: 'Course code',
    description: 'Course code logo alternative text for screen reader users',
    id: 'components.CourseGlimpse.codeIconAlt',
  },
});

const CourseGlimpseBase = ({ context, course }: CourseGlimpseProps & CommonDataProps) => {
  const intl = useIntl();
  return (
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
        <div className="course-glimpse__wrapper">
          <h3 className="course-glimpse__title">{course.title}</h3>
          {course.organization_highlighted_cover_image ? (
            <div className="course-glimpse__organization-logo">
              {/* alt forced to empty string because the organization name is rendered after */}
              <img
                alt=""
                sizes={course.organization_highlighted_cover_image.sizes}
                src={course.organization_highlighted_cover_image.src}
                srcSet={course.organization_highlighted_cover_image.srcset}
              />
            </div>
          ) : null}
          <div className="course-glimpse__metadata course-glimpse__metadata--organization">
            <Icon name="icon-org" title={intl.formatMessage(messages.organizationIconAlt)} />
            <span className="title">{course.organization_highlighted}</span>
          </div>
          <div className="course-glimpse__metadata course-glimpse__metadata--code">
            <Icon name="icon-barcode" title={intl.formatMessage(messages.codeIconAlt)} />
            <span>{course.code || '-'}</span>
          </div>
        </div>
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
        <CourseGlimpseFooter context={context} course={course} />
      </div>
    </a>
  );
};

const areEqual: (
  prevProps: Readonly<CourseGlimpseProps & CommonDataProps>,
  newProps: Readonly<CourseGlimpseProps & CommonDataProps>,
) => boolean = (prevProps, newProps) =>
  prevProps.context === newProps.context && prevProps.course.id === newProps.course.id;

export const CourseGlimpse = memo(CourseGlimpseBase, areEqual);
