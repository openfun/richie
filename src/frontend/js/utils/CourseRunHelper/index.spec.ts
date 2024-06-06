import { CourseRun, Priority } from 'types';
import { CourseRunHelper } from 'utils/CourseRunHelper/index';
import { CourseRunFactoryFromPriority } from 'utils/test/factories/richie';

describe('CourseRunHelper', () => {
  it('should return true if all course runs have the same languages', () => {
    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)({
        languages: ['en'],
      }).one(),
    ];
    expect(CourseRunHelper.IsAllCourseRunsWithSameLanguages(courseRuns)).toEqual(true);
  });

  it('should return false if all course runs have different languages', () => {
    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_OPEN)({
        languages: ['fr'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)({
        languages: ['it'],
      }).one(),
    ];
    expect(CourseRunHelper.IsAllCourseRunsWithSameLanguages(courseRuns)).toEqual(false);
  });
});
