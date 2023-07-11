import { Priority } from 'types';
import { computeStates } from 'utils/CourseRuns/index';
import { CourseRunFactoryFromPriority } from 'utils/test/factories/richie';

describe('computeStates', () => {
  test.each([
    Priority.ONGOING_OPEN,
    Priority.ONGOING_CLOSED,
    Priority.ARCHIVED_OPEN,
    Priority.ARCHIVED_CLOSED,
    Priority.FUTURE_NOT_YET_OPEN,
    Priority.FUTURE_OPEN,
    Priority.FUTURE_CLOSED,
    Priority.TO_BE_SCHEDULED,
  ])('correctly computes priority = %p', (priority) => {
    const courseRun = computeStates([CourseRunFactoryFromPriority(priority)().one()])[0];
    expect(courseRun.state.priority).toEqual(priority);
  });
});
