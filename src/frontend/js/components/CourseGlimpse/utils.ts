import { createIntl } from 'react-intl';
import { Course as RichieCourse, isRichieCourse } from 'types/Course';
import { CourseListItemMock as JoanieCourse } from 'api/mocks/joanie/courses';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { CourseGlimpseCourse } from '.';

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
    course_route: getRoutePath(TeacherDashboardPaths.COURSE, { courseCode: course.code }),
    cover_image: course.cover
      ? {
          src: course.cover.url,
        }
      : null,
    title: course.title,
    organization: {
      title: course.organization.title,
      image: course.organization.logo
        ? {
            src: course.organization.logo.url,
          }
        : null,
    },
    state: course.state,
  };
};

export const getCourseGlimpseProps = (
  course: JoanieCourse | RichieCourse,
  locale?: string,
): CourseGlimpseCourse => {
  return isRichieCourse(course)
    ? getCourseGlimpsePropsFromRichieCourse(course)
    : getCourseGlimpsePropsFromJoanieCourse(course, locale);
};
