import { Course as RichieCourse, isRichieCourse } from 'types/Course';
import { CourseListItemMock as JoanieCourse } from 'api/mocks/joanie/courses';
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

const getCourseGlimpsePropsFromJoanieCourse = (course: JoanieCourse): CourseGlimpseCourse => ({
  id: course.id,
  code: course.code,
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
});

export const getCourseGlimpseProps = (course: JoanieCourse | RichieCourse): CourseGlimpseCourse => {
  return isRichieCourse(course)
    ? getCourseGlimpsePropsFromRichieCourse(course)
    : getCourseGlimpsePropsFromJoanieCourse(course);
};
