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
): CourseGlimpseCourse => {
  const intl = createIntl({ locale });
  const getRoutePath = getDashboardRoutePath(intl);
  return {
    ...getCourseGlimpsePropsFromJoanieCourse(courseProductRelation.course),
    id: courseProductRelation.id,
    title: courseProductRelation.product.title,
    product_id: courseProductRelation.product.id,
    course_route: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT, {
      courseId: courseProductRelation.course.id,
      courseProductRelationId: courseProductRelation.id,
    }),
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
): CourseGlimpseCourse => {
  const intl = createIntl({ locale });
  const getRoutePath = getDashboardRoutePath(intl);
  return {
    id: course.id,
    code: course.code,
    course_route: getRoutePath(TeacherDashboardPaths.COURSE, { courseId: course.id }),
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
): CourseGlimpseCourse => {
  if (isCourseProductRelation(course)) {
    return getCourseGlimpsePropsFromCourseProductRelation(course, locale);
  }

  if (isRichieCourse(course)) {
    return getCourseGlimpsePropsFromRichieCourse(course);
  }

  return getCourseGlimpsePropsFromJoanieCourse(course, locale);
};
