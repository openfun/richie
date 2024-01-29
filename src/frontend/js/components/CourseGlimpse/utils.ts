import { IntlShape } from 'react-intl';
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
  intl: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
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
    id: courseProductRelation.id,
    code: courseProductRelation.course.code,
    title: courseProductRelation.product.title,
    cover_image: courseProductRelation.course.cover
      ? {
          src: courseProductRelation.course.cover.src,
        }
      : null,
    organization: {
      title: courseProductRelation.organizations[0].title,
      image: courseProductRelation.organizations[0].logo || null,
    },
    product_id: courseProductRelation.product.id,
    course_route: courseRoute,
    state: courseProductRelation.product.state,
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
});

const getCourseGlimpsePropsFromJoanieCourse = (
  course: JoanieCourse,
  intl: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
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
  };
};

export const getCourseGlimpseProps = (
  course: RichieCourse | (JoanieCourse | CourseProductRelation),
  intl?: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse => {
  if (isCourseProductRelation(course)) {
    return getCourseGlimpsePropsFromCourseProductRelation(course, intl!, organizationId);
  }

  if (isRichieCourse(course)) {
    return getCourseGlimpsePropsFromRichieCourse(course);
  }

  return getCourseGlimpsePropsFromJoanieCourse(course, intl!, organizationId);
};
