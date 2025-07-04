import { IntlShape } from 'react-intl';
import { generatePath } from 'react-router';
import {
  CourseCertificateOffer,
  CourseOffer,
  Course as RichieCourse,
  isRichieCourse,
} from 'types/Course';
import {
  CourseListItem as JoanieCourse,
  OfferingLight,
  isOffering,
  ProductType,
} from 'types/Joanie';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';
import { CourseGlimpseCourse } from '.';

const getCourseGlimpsePropsFromOffering = (
  offering: OfferingLight,
  intl: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  const courseRouteParams = {
    courseId: offering.course.id,
    offeringId: offering.id,
  };
  const courseRoute = organizationId
    ? generatePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT, {
        ...courseRouteParams,
        organizationId,
      })
    : generatePath(TeacherDashboardPaths.COURSE_PRODUCT, courseRouteParams);
  return {
    id: offering.id,
    code: offering.course.code,
    title: offering.product.title,
    cover_image: offering.course.cover
      ? {
          src: offering.course.cover.src,
        }
      : null,
    organization: {
      title: offering.organizations[0].title,
      image: offering.organizations[0].logo || null,
    },
    product_id: offering.product.id,
    course_route: courseRoute,
    state: offering.product.state,
    certificate_offer:
      offering.product.type === ProductType.CERTIFICATE ? CourseCertificateOffer.PAID : null,
    offer: offering.product.type === ProductType.CREDENTIAL ? CourseOffer.PAID : null,
    certificate_price:
      offering.product.type === ProductType.CERTIFICATE ? offering.product.price : null,
    price: offering.product.type === ProductType.CREDENTIAL ? offering.product.price : null,
    price_currency: offering.product.price_currency,
    discounted_price: offering.product.discounted_price || null,
    discount: offering.product.discount || null,
    certificate_discounted_price: offering.product.certificate_discounted_price || null,
    certificate_discount: offering.product.certificate_discount || null,
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
  certificate_discounted_price: course.certificate_discounted_price,
  certificate_discount: course.certificate_discount,
  discounted_price: course.discounted_price,
  discount: course.discount,
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
    discounted_price: null,
    discount: null,
    certificate_discounted_price: null,
    certificate_discount: null,
  };
};

export const getCourseGlimpseProps = (
  course: RichieCourse | (JoanieCourse | OfferingLight),
  intl?: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  if (isOffering(course)) {
    return getCourseGlimpsePropsFromOffering(course, intl!, organizationId);
  }

  if (isRichieCourse(course)) {
    return getCourseGlimpsePropsFromRichieCourse(course);
  }

  return getCourseGlimpsePropsFromJoanieCourse(course, intl!, organizationId);
};
