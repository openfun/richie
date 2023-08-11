import React, { memo } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { Nullable } from 'types/utils';
import { CommonDataProps } from 'types/commonDataProps';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseState } from 'types';
import { CourseGlimpseFooter } from './CourseGlimpseFooter';
import CourseLink from './CourseLink';

export interface CourseGlimpseCourse {
  id: string;
  product_id?: string;
  code: Nullable<string>;
  course_url?: string;
  course_route?: string;
  cover_image?: Nullable<{
    src: string;
    sizes?: string;
    srcset?: string;
  }>;
  title: string;
  organization: {
    title: string;
    image?: Nullable<{
      src: string;
      sizes?: string;
      srcset?: string;
    }>;
  };
  icon?: Nullable<{
    title: string;
    src: string;
    sizes?: string;
    srcset?: string;
  }>;
  state: CourseState;
  nb_course_runs?: number;
  organizations?: string[];
  duration?: string;
  effort?: string;
  categories?: string[];
}

export interface CourseGlimpseProps {
  course: CourseGlimpseCourse;
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
  categoryLabel: {
    defaultMessage: 'Category',
    description: 'Category label text for screen reader users',
    id: 'components.CourseGlimpse.categoryLabel',
  },
});

const CourseGlimpseBase = ({ context, course }: CourseGlimpseProps & CommonDataProps) => {
  const intl = useIntl();
  return (
    <div className="course-glimpse" data-testid="course-glimpse">
      {/* the media link is only here for mouse users, so hide it for keyboard/screen reader users.
      Keyboard/sr will focus the link on the title */}
      <div aria-hidden="true" className="course-glimpse__media">
        <CourseLink
          tabIndex={-1}
          className="course-glimpse__link"
          href={course.course_url}
          to={course.course_route}
        >
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
        </CourseLink>
      </div>
      <div className="course-glimpse__content">
        <div className="course-glimpse__wrapper">
          <h3 className="course-glimpse__title">
            <CourseLink
              className="course-glimpse__link"
              href={course.course_url}
              to={course.course_route}
            >
              <span className="course-glimpse__title-text">{course.title}</span>
            </CourseLink>
          </h3>
          {course.organization.image ? (
            <div className="course-glimpse__organization-logo">
              {/* alt forced to empty string because the organization name is rendered after */}
              <img
                alt=""
                sizes={course.organization.image.sizes}
                src={course.organization.image.src}
                srcSet={course.organization.image.srcset}
              />
            </div>
          ) : null}
          <div className="course-glimpse__metadata course-glimpse__metadata--organization">
            <Icon
              name={IconTypeEnum.ORG}
              title={intl.formatMessage(messages.organizationIconAlt)}
              size="small"
            />
            <span className="title">{course.organization.title}</span>
          </div>
          <div className="course-glimpse__metadata course-glimpse__metadata--code">
            <Icon
              name={IconTypeEnum.BARCODE}
              title={intl.formatMessage(messages.codeIconAlt)}
              size="small"
            />
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
              <span className="offscreen">
                <FormattedMessage {...messages.categoryLabel} />
              </span>
              <span className="category-badge__title">{course.icon.title}</span>
            </span>
          </div>
        ) : null}
        <CourseGlimpseFooter context={context} course={course} />
      </div>
    </div>
  );
};

const areEqual: (
  prevProps: Readonly<CourseGlimpseProps & CommonDataProps>,
  newProps: Readonly<CourseGlimpseProps & CommonDataProps>,
) => boolean = (prevProps, newProps) =>
  prevProps.context === newProps.context && prevProps.course.id === newProps.course.id;

export const CourseGlimpse = memo(CourseGlimpseBase, areEqual);
export { getCourseGlimpseProps } from './utils';
