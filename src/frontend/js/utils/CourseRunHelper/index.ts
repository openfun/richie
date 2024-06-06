import { CourseRun } from 'types';

export class CourseRunHelper {
  /**
   * Checks if all given runs of a course have the same languages.
   */
  static IsAllCourseRunsWithSameLanguages = (courseRuns: CourseRun[]) => {
    const languages = courseRuns[0].languages.sort().join();
    return courseRuns
      .map((courseRun) => courseRun.languages.sort().join())
      .every((runLanguages) => runLanguages === languages);
  };
}
