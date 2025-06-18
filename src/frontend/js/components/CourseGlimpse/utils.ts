import { IntlShape } from 'react-intl';
import { generatePath } from 'react-router';
import {
  CourseCertificateOffer,
  CourseOffer,
  Course as RichieCourse,
  isRichieCourse,
} from 'types/Course';
import { CourseListItem as JoanieCourse, OfferLight, isOffer, ProductType } from 'types/Joanie';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';
import { CourseGlimpseCourse } from '.';

const getCourseGlimpsePropsFromOffer = (
  offer: OfferLight,
  intl: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  const courseRouteParams = {
    courseId: offer.course.id,
    offerId: offer.id,
  };
  const courseRoute = organizationId
    ? generatePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT, {
        ...courseRouteParams,
        organizationId,
      })
    : generatePath(TeacherDashboardPaths.COURSE_PRODUCT, courseRouteParams);
  return {
    id: offer.id,
    code: offer.course.code,
    title: offer.product.title,
    cover_image: offer.course.cover
      ? {
          src: offer.course.cover.src,
        }
      : null,
    organization: {
      title: offer.organizations[0].title,
      image: offer.organizations[0].logo || null,
    },
    product_id: offer.product.id,
    course_route: courseRoute,
    state: offer.product.state,
    certificate_offer:
      offer.product.type === ProductType.CERTIFICATE ? CourseCertificateOffer.PAID : null,
    offer: offer.product.type === ProductType.CREDENTIAL ? CourseOffer.PAID : null,
    certificate_price: offer.product.type === ProductType.CERTIFICATE ? offer.product.price : null,
    price: offer.product.type === ProductType.CREDENTIAL ? offer.product.price : null,
    price_currency: offer.product.price_currency,
  };
};

const getCourseGlimpsePropsFromRichieCourse = (course: RichieCourse): CourseGlimpseCourse => ({
  id: course.id,
  code: course.code,
  course_url: course.absolute_url,
  cover_image: course.cover_image,
  title: course.title,
  organization: {
    title: course.organization_highlighted,
    image: course.organization_highlighted_cover_image,
  },
  icon: course.icon,
  state: course.state,
  duration: course.duration,
  effort: course.effort,
  categories: course.categories,
  organizations: course.organizations,
  price: course.price,
  price_currency: course.price_currency,
  certificate_offer: course.certificate_offer,
  offer: course.offer,
  certificate_price: course.certificate_price,
});

const getCourseGlimpsePropsFromJoanieCourse = (
  course: JoanieCourse,
  intl: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  const courseRouteParams = {
    courseId: course.id,
  };
  const courseRoute = organizationId
    ? generatePath(TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION, {
        ...courseRouteParams,
        organizationId,
      })
    : generatePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION, courseRouteParams);
  return {
    id: course.id,
    code: course.code,
    course_route: courseRoute,
    cover_image: course.cover
      ? {
          src: course.cover.src,
        }
      : null,
    title: course.title,
    organization: {
      title: course.organizations[0].title,
      image: course.organizations[0].logo || null,
    },
    state: course.state,
    nb_course_runs: course.course_run_ids.length,
    price: null,
    price_currency: 'EUR',
    certificate_offer: null,
    offer: null,
    certificate_price: null,
  };
};

export const getCourseGlimpseProps = (
  course: RichieCourse | (JoanieCourse | OfferLight),
  intl?: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  if (isOffer(course)) {
    return getCourseGlimpsePropsFromOffer(course, intl!, organizationId);
  }

  if (isRichieCourse(course)) {
    return getCourseGlimpsePropsFromRichieCourse(course);
  }

  return getCourseGlimpsePropsFromJoanieCourse(course, intl!, organizationId);
};
