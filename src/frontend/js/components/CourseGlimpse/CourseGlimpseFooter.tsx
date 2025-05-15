import { defineMessages, FormattedNumber, useIntl } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseGlimpseCourse } from 'components/CourseGlimpse/index';
import { CourseOffer } from 'types/Course';

const messages = defineMessages({
  dateIconAlt: {
    defaultMessage: 'Availability',
    description: 'Course date logo alternative text for screen reader users',
    id: 'components.CourseGlimpseFooter.dateIconAlt',
  },
  enrollmentOfferIconFreeAlt: {
    defaultMessage: 'All content is available for free',
    description: 'Course offers free alternative text',
    id: 'components.CourseGlimpseFooter.enrollmentOfferIconFreeAlt',
  },
  enrollmentOfferIconPartiallyFreeAlt: {
    defaultMessage: 'Most of the content is available for free',
    description: 'Course offers partially free alternative text',
    id: 'components.CourseGlimpseFooter.enrollmentOfferIconPartiallyFreeAlt',
  },
  enrollmentOfferIconPaidAlt: {
    defaultMessage: 'Access requires payment',
    description: 'Course offers paid alternative text',
    id: 'components.CourseGlimpseFooter.enrollmentOfferIconPaidAlt',
  },
  enrollmentOfferIconSubscriptionAlt: {
    defaultMessage: 'Access requires a subscription',
    description: 'Course offers subscription alternative text',
    id: 'components.CourseGlimpseFooter.enrollmentOfferIconSubscriptionAlt',
  },
  certificateOfferIconAlt: {
    defaultMessage: 'An exam is available',
    description: 'Course certificate offer alternative text',
    id: 'components.CourseGlimpseFooter.certificateOfferIconAlt',
  },
});

const courseOfferMessages = {
  [CourseOffer.FREE]: messages.enrollmentOfferIconFreeAlt,
  [CourseOffer.PARTIALLY_FREE]: messages.enrollmentOfferIconPartiallyFreeAlt,
  [CourseOffer.PAID]: messages.enrollmentOfferIconPaidAlt,
  [CourseOffer.SUBSCRIPTION]: messages.enrollmentOfferIconSubscriptionAlt,
};

type OfferIconType =
  | IconTypeEnum.OFFER_SUBSCRIPTION
  | IconTypeEnum.OFFER_PAID
  | IconTypeEnum.OFFER_PARTIALLY_FREE
  | IconTypeEnum.OFFER_FREE;

/**
 * <CourseGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 */
export const CourseGlimpseFooter: React.FC<{ course: CourseGlimpseCourse } & CommonDataProps> = ({
  course,
}) => {
  const intl = useIntl();
  const offer = course.offer ?? CourseOffer.FREE;
  const certificateOffer = course.certificate_offer ?? null;
  const hasCertificateOffer = certificateOffer !== null;
  const hasEnrollmentOffer = offer !== CourseOffer.FREE;
  const offerIcon = `icon-offer-${offer}` as OfferIconType;
  const offerCertificateIcon = hasCertificateOffer && IconTypeEnum.SCHOOL;
  const offerPrice = hasEnrollmentOffer && course.price;

  return (
    <div className="course-glimpse-footer">
      <div className="course-glimpse-footer__column course-glimpse-footer__date">
        <Icon
          name={IconTypeEnum.CALENDAR}
          title={intl.formatMessage(messages.dateIconAlt)}
          size="small"
        />
        <span>
          {course.state.text.charAt(0).toUpperCase() +
            course.state.text.substring(1) +
            (course.state.datetime
              ? ` ${intl.formatDate(new Date(course.state.datetime!), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`
              : '')}
        </span>
      </div>
      <div className="course-glimpse-footer__column course-glimpse-footer__price">
        {offerCertificateIcon && (
          <Icon
            className="offer-certificate__icon"
            name={offerCertificateIcon}
            title={intl.formatMessage(messages.certificateOfferIconAlt)}
          />
        )}
        <Icon
          className="offer__icon"
          name={offerIcon}
          title={intl.formatMessage(courseOfferMessages[offer])}
        />
        {offerPrice && (
          <span className="offer__price">
            <FormattedNumber value={offerPrice} currency={course.price_currency} style="currency" />
          </span>
        )}
      </div>
    </div>
  );
};
