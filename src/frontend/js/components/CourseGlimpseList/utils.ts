import { CourseListItemMock as JoanieCourse } from 'api/mocks/joanie/courses';
import { Course as RichieCourse } from 'types/Course';
import { CourseGlimpseCourse, getCourseGlimpseProps } from 'components/CourseGlimpse';

export const getCourseGlimpseListProps = (
  courses: JoanieCourse[] | RichieCourse[],
): CourseGlimpseCourse[] => {
  return courses.map((course) => getCourseGlimpseProps(course));
};
