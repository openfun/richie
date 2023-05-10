import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { capitalize } from 'lodash-es';
import { CourseRunFactory } from 'utils/test/factories/joanie';
import CourseRunList from '.';

describe('pages/TeacherCourseDashboardLoader/CourseRunList', () => {
  it('should render', () => {
    const courseRuns = CourseRunFactory().many(2);
    render(
      <IntlProvider locale="en">
        <CunninghamProvider>
          <CourseRunList courseRuns={courseRuns} />
        </CunninghamProvider>
      </IntlProvider>,
    );
    const [courseRunOne, courseRunTwo] = courseRuns;
    expect(screen.getByTitle(capitalize(courseRunOne.title))).toBeInTheDocument();
    expect(screen.getByTitle(capitalize(courseRunTwo.title))).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'go to classroom' }).length).toEqual(2);
  });
});
