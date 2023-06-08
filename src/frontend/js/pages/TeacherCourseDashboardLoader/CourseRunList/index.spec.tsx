import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { capitalize } from 'lodash-es';
import { CourseFactory, CourseRunFactory } from 'utils/test/factories/joanie';
import CourseRunList from '.';

describe('pages/TeacherCourseDashboardLoader/CourseRunList', () => {
  it('should render', () => {
    const course = CourseFactory({
      course_runs: CourseRunFactory().many(2),
    }).one();
    render(
      <IntlProvider locale="en">
        <CunninghamProvider>
          <CourseRunList courseRuns={course.course_runs} courseCode={course.code} />
        </CunninghamProvider>
      </IntlProvider>,
    );
    const [courseRunOne, courseRunTwo] = course.course_runs;
    expect(screen.getByTitle(capitalize(courseRunOne.title))).toBeInTheDocument();
    expect(screen.getByTitle(capitalize(courseRunTwo.title))).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'go to classroom' }).length).toEqual(2);
  });
});
