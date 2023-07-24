import { render, screen } from '@testing-library/react';
import { CourseRunFactory } from 'utils/test/factories/richie';
import { SyllabusSimpleCourseRunsList } from '.';

jest.mock('widgets/SyllabusCourseRunsList/components/CourseRunItem', () => ({
  __esModule: true,
  default: () => 'CourseRunItem',
}));

jest.mock('widgets/SyllabusCourseRunsList/components/CourseRunItemWithEnrollment', () => ({
  __esModule: true,
  default: () => 'CourseRunItemWithEnrollment',
}));

describe('SyllabusSimpleCourseRunsList', () => {
  it('should render CourseRunItemWithEnrollment when checkEnrollment is true', () => {
    const courseRun = CourseRunFactory().one();

    render(<SyllabusSimpleCourseRunsList courseRuns={[courseRun]} checkEnrollment />);

    screen.getByText('CourseRunItemWithEnrollment');
  });

  it('should not render CourseRunItemWithEnrollment when checkEnrollment is false', () => {
    const courseRun = CourseRunFactory().one();

    render(<SyllabusSimpleCourseRunsList courseRuns={[courseRun]} />);

    screen.getByText('CourseRunItem');
  });

  it('should not render CourseRunItemWithEnrollment when courseRun is a snapshot even if checkEnrollment is true', () => {
    const courseRun = CourseRunFactory({
      snapshot: 'https://example.com/snaphosts/1/',
    }).one();

    render(<SyllabusSimpleCourseRunsList courseRuns={[courseRun]} checkEnrollment />);

    screen.getByText('CourseRunItem');
  });
});
