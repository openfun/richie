import { CourseListItemMock as JoanieCourse } from 'api/mocks/joanie/courses';
import { Course as RichieCourse } from 'types/Course';
import { CourseGlimpseCourse, getCourseGlimpsProps } from 'components/CourseGlimpse';

export const getCourseGlimpsListProps = (
  courses: JoanieCourse[] | RichieCourse[],
): CourseGlimpseCourse[] => {
  return courses.map((course) => getCourseGlimpsProps(course));
};
