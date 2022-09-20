import { CourseStateFactory } from 'utils/test/factories';
import { Enrollment, EnrollmentState } from '../../types/Joanie';

export const enrollment: Enrollment = {
  id: '1',
  state: EnrollmentState.SET,
  is_active: true,
  course_run: {
    id: '1',
    title: '',
    end: '2022-10-01T01:23:37+00:00',
    enrollment_end: '2022-09-21T20:57:58+00:00',
    enrollment_start: '2022-08-11T20:39:46+00:00',
    start: '2022-09-09T12:02:44+00:00',
    resource_link: 'https://lms.fun-mooc.fr/courses/course-v1:supagro+120001+archive_ouvert/info',
    state: CourseStateFactory.generate(),
    course: {
      code: '09391',
      title: 'Learn disruptive technologies',
      products: [],
      course_runs: [],
      organization: {
        code: '111',
        title: '111',
      },
    },
  },
};
