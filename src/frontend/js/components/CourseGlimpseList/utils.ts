import { IntlShape } from 'react-intl';
import { CourseProductRelation, CourseListItem as JoanieCourse } from 'types/Joanie';
import { Course as RichieCourse } from 'types/Course';
import { CourseGlimpseCourse, getCourseGlimpseProps } from 'components/CourseGlimpse';

export const getCourseGlimpseListProps = (
  courses: RichieCourse[] | (JoanieCourse | CourseProductRelation)[],
  intl?: IntlShape,
  organizationId?: string,
): CourseGlimpseCourse[] => {
  return courses.map((course) => getCourseGlimpseProps(course, intl, organizationId));
};
