import { Button } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { CourseRun, CourseRunDisplayMode, PacedCourse } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { extractResourceId, isJoanieResourceLinkProduct } from 'api/lms/joanie';
import { findLmsBackend } from 'api/configuration';
import { StringHelper } from 'utils/StringHelper';
import { IntlHelper } from 'utils/IntlHelper';
import { DjangoCMSPluginCourseRun, DjangoCMSTemplate } from 'components/DjangoCMSTemplate';
import CourseRunEnrollment from '../CourseRunEnrollment';
import CourseProductItem from '../CourseProductItem';

const messages = defineMessages({
  enrollNow: {
    id: 'components.SyllabusCourseRunCompacted.enrollNow',
    description: 'CTA for users to enroll on ongoing of future open course.',
    defaultMessage: 'Enroll now',
  },
  studyNow: {
    id: 'components.SyllabusCourseRunCompacted.studyNow',
    description: 'CTA for users to enroll on archived course.',
    defaultMessage: 'Study now',
  },
  course: {
    id: 'components.SyllabusCourseRunCompacted.course',
    description: 'Title of the course dates section of an opened course run block',
    defaultMessage: 'Course',
  },
  languages: {
    id: 'components.SyllabusCourseRunCompacted.languages',
    description: 'Title of the languages section of an opened course run block',
    defaultMessage: 'Languages',
  },
  selfPaceRunPeriod: {
    id: 'components.SyllabusCourseRunCompacted.selfPaceCoursePeriod',
    description: 'Course date of an opened and self paced course run block',
    defaultMessage: 'Available until {endDate}',
  },
  selfPaceNoEndDate: {
    id: 'components.SyllabusCourseRunCompacted.selfPaceNoEndDate',
    description: 'Self paced course run block with no end date',
    defaultMessage: 'Available',
  },
  coursePrice: {
    id: 'components.SyllabusCourseRunCompacted.coursePrice',
    description: 'Title of the course enrollment section of an opened course run block',
    defaultMessage: 'Enrollment Price',
  },
  courseOffer: {
    id: 'components.SyllabusCourseRunCompacted.courseOffer',
    description: 'Title of the course enrollment section of an opened course run block',
    defaultMessage: 'Course offer',
  },
  certificationPrice: {
    id: 'components.SyllabusCourseRunCompacted.certificationPrice',
    description: 'Title of the course enrollment section of an opened course run block',
    defaultMessage: 'Certification Price',
  },
});

const OpenedSelfPacedCourseRun = ({
  courseRun,
  showLanguages,
}: {
  courseRun: CourseRun;
  showLanguages: boolean;
}) => {
  const formatDate = useDateFormat();
  const intl = useIntl();
  const end = courseRun.end ? formatDate(courseRun.end) : '...';
  const hasEndDate = end !== '...';
  const enrollmentPrice = courseRun?.price != null ? intl.formatNumber(courseRun.price, {
    style: 'currency',
    currency: courseRun.price_currency,
  }) : "";
  const certificatePrice = courseRun?.certificate_price != null ? intl.formatNumber(courseRun.certificate_price, {
    style: 'currency',
    currency: courseRun.price_currency,
  }) : "";
  const offer = (courseRun.offer ?? "NONE").toUpperCase().replaceAll(" ", "_");
  const certificationOffer = (courseRun.certificate_offer ?? "NONE").toUpperCase().replaceAll(" ", "_");

  const courseOfferMessage = {
    "PAID": "The course content is paid.",
    "FREE": "The course content is free.",
    "PARTIALLY_FREE": "The course content is free.",
    "SUBSCRIPTION": "Subscribe to access the course content.",
    "NONE": ""
  }[offer]

  const certificationOfferMessage = {
    "PAID": "The certification process is paid.",
    "FREE": "The certification process is free.",
    "SUBSCRIPTION": "The certification process is offered through subscription.",
    "NONE": ""
  }[certificationOffer]

  return (
    <>
      {courseRun.title && <h3>{StringHelper.capitalizeFirst(courseRun.title)}</h3>}
      <dl>
        {!showLanguages && (
          <dt>
            <FormattedMessage {...messages.course} />
          </dt>
        )}
        <dd>
          {hasEndDate ? (
            <FormattedMessage
              {...messages.selfPaceRunPeriod}
              values={{
                endDate: end,
              }}
            />
          ) : (
            <FormattedMessage {...messages.selfPaceNoEndDate} />
          )}
        </dd>
        {!showLanguages && (
          <>
            <dt>
              <FormattedMessage {...messages.languages} />
            </dt>
            <dd>{IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}</dd>
          </>
        )}
        {courseOfferMessage && (
          <>
            <dt>
              <FormattedMessage {...messages.coursePrice} />
            </dt>
            <dd>
              {`${courseOfferMessage}`}<br/>{`${enrollmentPrice}`}
            </dd>
          </>
        )}
        {certificationOfferMessage && (
          <>
            <dt>
              <FormattedMessage {...messages.certificationPrice} />
            </dt>
            <dd>{`${certificationOfferMessage}`}<br/>{`${certificatePrice}`}</dd>
          </>
        )}
      </dl>
      {findLmsBackend(courseRun.resource_link) ? (
        <CourseRunEnrollment courseRun={courseRun} />
      ) : (
        <Button className="course-run-enrollment__cta" href={courseRun.resource_link} fullWidth>
          {courseRun.state.call_to_action === 'enroll now' ? (
            <FormattedMessage {...messages.enrollNow} />
          ) : null}
          {courseRun.state.call_to_action === 'study now' ? (
            <FormattedMessage {...messages.studyNow} />
          ) : null}
        </Button>
      )}
    </>
  );
};

export const SyllabusCourseRunCompacted = ({
  courseRun,
  course,
  showLanguages,
}: {
  courseRun: CourseRun;
  course: PacedCourse;
  showLanguages: boolean;
}) => {
  return (
    <DjangoCMSTemplate plugin={DjangoCMSPluginCourseRun(courseRun)}>
      <div className="course-detail__run-descriptions course-detail__run-descriptions--course_and_search">
        {isJoanieResourceLinkProduct(courseRun.resource_link) ? (
          <CourseProductItem
            productId={extractResourceId(courseRun.resource_link, 'product')!}
            course={course}
            compact={courseRun.display_mode === CourseRunDisplayMode.COMPACT}
          />
        ) : (
          <OpenedSelfPacedCourseRun courseRun={courseRun} showLanguages={showLanguages} />
        )}
      </div>
    </DjangoCMSTemplate>
  );
};
