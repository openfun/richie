import { CoursesHelper } from 'utils/CoursesHelper/index';
import { Order } from 'types/Joanie';
import { JoanieEnrollmentFactory, OrderFactory, TargetCourseFactory } from 'utils/test/factories';

describe('CourseHelper', () => {
  it('should find an active course enrollment in order', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      target_courses: TargetCourseFactory.generate(3),
    };
    order.enrollments = [
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[0],
        is_active: false,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[1].course_runs[0],
        is_active: true,
      },
    ];
    expect(CoursesHelper.findActiveCourseEnrollmentInOrder(order.target_courses[1], order)).toEqual(
      order.enrollments[1],
    );
  });
  it('should not find active course enrollment in an order containing only is_active=false enrollments', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      target_courses: TargetCourseFactory.generate(3),
    };
    order.enrollments = [
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[0],
        is_active: false,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[1].course_runs[0],
        is_active: false,
      },
    ];
    expect(
      CoursesHelper.findActiveCourseEnrollmentInOrder(order.target_courses[1], order),
    ).toBeUndefined();
  });
  it('should not find active course enrollment in an order without enrollment', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      target_courses: TargetCourseFactory.generate(3),
      enrollments: [],
    };
    expect(
      CoursesHelper.findActiveCourseEnrollmentInOrder(order.target_courses[0], order),
    ).toBeUndefined();
  });

  it('should find enrollments', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      target_courses: TargetCourseFactory.generate(3),
    };
    order.enrollments = [
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[0],
        is_active: false,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[1].course_runs[0],
        is_active: true,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[1],
        is_active: true,
      },
    ];
    expect(CoursesHelper.findCourseEnrollmentsInOrder(order.target_courses[0], order)).toEqual([
      order.enrollments[0],
      order.enrollments[2],
    ]);
  });
  it('should not find enrollments', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      target_courses: TargetCourseFactory.generate(3),
    };
    order.enrollments = [
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[0],
        is_active: false,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[1].course_runs[0],
        is_active: true,
      },
      {
        ...JoanieEnrollmentFactory.generate(),
        course_run: order.target_courses[0].course_runs[1],
        is_active: true,
      },
    ];
    expect(CoursesHelper.findCourseEnrollmentsInOrder(order.target_courses[2], order)).toEqual([]);
  });
});
