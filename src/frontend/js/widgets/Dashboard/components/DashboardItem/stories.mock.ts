import { CourseStateFactory } from 'utils/test/factories/richie';
import { Enrollment, EnrollmentState } from 'types/Joanie';

export const enrollment: Enrollment = {
  id: '99d9a14c-a05b-4dd4-b5bf-8a6922e9934a',
  state: EnrollmentState.SET,
  is_active: true,
  was_created_by_order: true,
  created_on: '2022-09-09T12:00:00+00:00',
  orders: [],
  course_run: {
    id: '18cede01-231e-4061-92d1-5716cd990e33',
    title: '',
    start: '2022-09-09T12:00:00+00:00',
    end: '2022-10-01T13:00:00+00:00',
    enrollment_end: '2022-09-21T20:57:58+00:00',
    enrollment_start: '2022-08-11T20:39:46+00:00',
    resource_link: 'https://lms.fun-mooc.fr/courses/course-v1:supagro+120001+archive_ouvert/info',
    state: CourseStateFactory().one(),
    course: {
      id: '1cc49d2b-fc08-46d2-9fb8-594d90494cd3',
      code: '09391',
      title: 'Learn disruptive technologies',
      cover: null,
    },
    languages: ['en'],
  },
  product_relations: [],
  certificate_id: null,
};
