import { createIntl } from 'react-intl';
import { Course as RichieCourse, isRichieCourse } from 'types/Course';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import {
  CourseListItem as JoanieCourse,
  CourseProductRelation,
  isCourseProductRelation,
} from 'types/Joanie';
import { CourseGlimpseCourse } from '.';

const getCourseGlimpsePropsFromCourseProductRelation = (
  courseProductRelation: CourseProductRelation,
  locale: string = 'en',
  organizationId?: string,
): CourseGlimpseCourse => {
  const intl = createIntl({ locale });
  const getRoutePath = getDashboardRoutePath(intl);
  const courseRouteParams = {
    courseId: courseProductRelation.course.id,
    courseProductRelationId: courseProductRelation.id,
  };
  const courseRoute = organizationId
    ? getRoutePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT, {
        ...courseRouteParams,
        organizationId,
      })
    : getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT, courseRouteParams);
  return {
    ...getCourseGlimpsePropsFromJoanieCourse(courseProductRelation.course),
    id: courseProductRelation.id,
    title: courseProductRelation.product.title,
    product_id: courseProductRelation.product.id,
    course_route: courseRoute,
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
});

const getCourseGlimpsePropsFromJoanieCourse = (
  course: JoanieCourse,
  locale: string = 'en',
  organizationId?: string,
): CourseGlimpseCourse => {
  const intl = createIntl({ locale });
  const getRoutePath = getDashboardRoutePath(intl);
  const courseRouteParams = {
    courseId: course.id,
  };
  const courseRoute = organizationId
    ? getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION, {
        ...courseRouteParams,
        organizationId,
      })
    : getRoutePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION, courseRouteParams);
  return {
    id: course.id,
    code: course.code,
    course_route: courseRoute,
    cover_image: course.cover
      ? {
          src: course.cover.url,
        }
      : null,
    title: course.title,
    organization: {
      title: course.organizations[0].title,
      image: course.organizations[0].logo
        ? {
            src: course.organizations[0].logo.src,
          }
        : null,
    },
    state: course.state,
    nb_course_runs: course.course_runs.length,
  };
};

export const getCourseGlimpseProps = (
  course: RichieCourse | (JoanieCourse | CourseProductRelation),
  locale?: string,
  organizationId?: string,
): CourseGlimpseCourse => {
  if (isCourseProductRelation(course)) {
    return getCourseGlimpsePropsFromCourseProductRelation(course, locale, organizationId);
  }

  if (isRichieCourse(course)) {
    return getCourseGlimpsePropsFromRichieCourse(course);
  }

  return getCourseGlimpsePropsFromJoanieCourse(course, locale, organizationId);
};
