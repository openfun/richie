import { defineMessages, FormattedNumber, useIntl } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseGlimpseCourse } from 'components/CourseGlimpse/index';
import { CourseOffer } from 'types/Course';

const messages = defineMessages({
  dateIconAlt: {
    defaultMessage: 'Course date',
    description: 'Course date logo alternative text for screen reader users',
    id: 'components.CourseGlimpseFooter.dateIconAlt',
  },
  dateEnrollmentOfferAlt: {
    defaultMessage: 'Course enrollment offer',
    description: 'Course available offer',
    id: 'components.CourseGlimpseFooter.dateEnrollmentOfferAlt',
  },
  dateCertificateOffertAlt: {
    defaultMessage: 'Course certificate offer',
    description: 'Course available offer',
    id: 'components.CourseGlimpseFooter.dateCertificateOffertAlt',
  },
});

/**
 * <CourseGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 *
 * About offers, according if the course requires payment to enroll or has
 * a certificate, the price for enrollment or certification is displayed.
 * For a certificate, we display the school icon and for enrollment a money icon.
 * Then if the course has a free certification, we display the school icon only.
 */
export const CourseGlimpseFooter: React.FC<{ course: CourseGlimpseCourse } & CommonDataProps> = ({
  course,
}) => {
  const intl = useIntl();
  const hasCertificateOffer = course.offers?.certificate_offer !== null;
  const hasEnrollmentOffer = course.offers?.offer && course.offers.offer !== CourseOffer.FREE;
  const hasOffer = hasCertificateOffer || hasEnrollmentOffer;
  const offerPrice = hasEnrollmentOffer ? course.offers!.price : course.offers!.certificate_price;
  const offerIcon = hasEnrollmentOffer ? IconTypeEnum.MONEY : IconTypeEnum.SCHOOL;
  const offerAltText = hasEnrollmentOffer
    ? messages.dateEnrollmentOfferAlt
    : messages.dateCertificateOffertAlt;

  return (
    <div className="course-glimpse-footer">
      <div className="course-glimpse-footer__date">
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
      {hasOffer && (
        <div className="course-glimpse-footer__date">
          <Icon name={offerIcon} title={intl.formatMessage(offerAltText)} />
          {offerPrice && (
            <FormattedNumber
              value={offerPrice}
              currency={course.offers!.price_currency}
              style="currency"
            />
          )}
        </div>
      )}
    </div>
  );
};
