import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
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
    id: 'components.SyllabusCourseRun.enrollNow',
    description: 'CTA for users to enroll on ongoing of future open course.',
    defaultMessage: 'Enroll now',
  },
  studyNow: {
    id: 'components.SyllabusCourseRun.studyNow',
    description: 'CTA for users to enroll on archived course.',
    defaultMessage: 'Study now',
  },
  enrollment: {
    id: 'components.SyllabusCourseRun.enrollment',
    description: 'Title of the enrollment dates section of an opened course run block',
    defaultMessage: 'Enrollment',
  },
  course: {
    id: 'components.SyllabusCourseRun.course',
    description: 'Title of the course dates section of an opened course run block',
    defaultMessage: 'Course',
  },
  languages: {
    id: 'components.SyllabusCourseRun.languages',
    description: 'Title of the languages section of an opened course run block',
    defaultMessage: 'Languages',
  },
  runPeriod: {
    id: 'components.SyllabusCourseRun.enrollmentPeriod',
    description: 'Enrollment date of an opened course run block',
    defaultMessage: 'From {startDate} {endDate, select, undefined {} other {to {endDate}}}',
  },
  coursePeriod: {
    id: 'components.SyllabusCourseRun.coursePeriod',
    description: 'Course date of an opened course run block',
    defaultMessage: 'From {startDate} {endDate, select, undefined {} other {to {endDate}}}',
  },
  coursePrice: {
    id: 'components.SyllabusCourseRun.coursePrice',
    description: 'Title of the course enrollment price section of an opened course run block',
    defaultMessage: 'Enrollment price',
  },
  certificationPrice: {
    id: 'components.SyllabusCourseRun.certificationPrice',
    description: 'Title of the certification price section of an opened course run block',
    defaultMessage: 'Certification price',
  },
  coursePaidOffer: {
    id: 'components.SyllabusCourseRun.coursePaidOffer',
    description: 'Message for the paid course offer of an opened course run block',
    defaultMessage: 'The course content is paid.',
  },
  courseFreeOffer: {
    id: 'components.SyllabusCourseRun.courseFreeOffer',
    description: 'Message for the free course offer of an opened course run block',
    defaultMessage: 'The course content is free.',
  },
  coursePartiallyFree: {
    id: 'components.SyllabusCourseRun.coursePartiallyFree',
    description: 'Message for the partially free course offer of an opened course run block',
    defaultMessage: 'The course content is free.',
  },
  courseSubscriptionOffer: {
    id: 'components.SyllabusCourseRun.courseSubscriptionOffer',
    description: 'Message for the subscription course offer of an opened course run block',
    defaultMessage: 'Subscribe to access the course content.',
  },
  certificatePaidOffer: {
    id: 'components.SyllabusCourseRun.certificatePaidOffer',
    description: 'Messagge for the paid certification offer of an opened course run block',
    defaultMessage: 'The certification process is paid.',
  },
  certificateFreeOffer: {
    id: 'components.SyllabusCourseRun.certificateFreeOffer',
    description: 'Message for the free certification offer of an opened course run block',
    defaultMessage: 'The certification process is free.',
  },
  certificateSubscriptionOffer: {
    id: 'components.SyllabusCourseRun.certificateSubscriptionOffer',
    description: 'Message for the subscription certification offer of an opened course run block',
    defaultMessage: 'The certification process is offered through subscription.',
  },
});

const OpenedCourseRun = ({
  courseRun,
  showLanguages,
}: {
  courseRun: CourseRun;
  showLanguages: boolean;
}) => {
  const formatDate = useDateFormat();
  const intl = useIntl();
  const enrollmentStart = courseRun.enrollment_start
    ? formatDate(courseRun.enrollment_start)
    : '...';
  const enrollmentEnd = courseRun.enrollment_end ? formatDate(courseRun.enrollment_end) : '...';
  const start = courseRun.start ? formatDate(courseRun.start) : '...';
  const end = courseRun.end ? formatDate(courseRun.end) : '...';
  let courseOfferMessage = null;
  let certificationOfferMessage = null;
  let enrollmentPrice = '';
  let certificatePrice = '';

  if (courseRun.offer) {
    const offer = courseRun.offer.toUpperCase().replaceAll(' ', '_');
    courseOfferMessage = {
      PAID: messages.coursePaidOffer,
      FREE: messages.courseFreeOffer,
      PARTIALLY_FREE: messages.coursePartiallyFree,
      SUBSCRIPTION: messages.courseSubscriptionOffer,
    }[offer];

    if ((courseRun.price ?? -1) >= 0) {
      enrollmentPrice = intl.formatNumber(courseRun.price!, {
        style: 'currency',
        currency: courseRun.price_currency,
      });
    }
  }

  if (courseRun.certificate_offer) {
    const certificationOffer = courseRun.certificate_offer.toUpperCase().replaceAll(' ', '');
    certificationOfferMessage = {
      PAID: messages.certificatePaidOffer,
      FREE: messages.certificateFreeOffer,
      SUBSCRIPTION: messages.certificateSubscriptionOffer,
    }[certificationOffer];

    if ((courseRun.certificate_price ?? -1) >= 0) {
      certificatePrice = intl.formatNumber(courseRun.certificate_price!, {
        style: 'currency',
        currency: courseRun.price_currency,
      });
    }
  }

  return (
    <>
      {courseRun.title && <h3>{StringHelper.capitalizeFirst(courseRun.title)}</h3>}
      <dl>
        <dt>
          <FormattedMessage {...messages.enrollment} />
        </dt>
        <dd>
          <FormattedMessage
            {...messages.runPeriod}
            values={{
              startDate: enrollmentStart,
              endDate: enrollmentEnd,
            }}
          />
        </dd>
        <dt>
          <FormattedMessage {...messages.course} />
        </dt>
        <dd>
          <FormattedMessage
            {...messages.runPeriod}
            values={{
              startDate: start,
              endDate: end,
            }}
          />
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
              <FormattedMessage {...courseOfferMessage} />
              <br />
              {enrollmentPrice}
            </dd>
          </>
        )}
        {certificationOfferMessage && (
          <>
            <dt>
              <FormattedMessage {...messages.certificationPrice} />
            </dt>
            <dd>
              <FormattedMessage {...certificationOfferMessage} />
              <br />
              {certificatePrice}
            </dd>
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

export const SyllabusCourseRun = ({
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
          <OpenedCourseRun courseRun={courseRun} showLanguages={showLanguages} />
        )}
      </div>
    </DjangoCMSTemplate>
  );
};
