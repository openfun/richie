import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { capitalize } from 'lodash-es';
import { MemoryRouter } from 'react-router-dom';
import { CourseRunFactory } from 'utils/test/factories/joanie';
import CourseRunList from '.';

describe('pages/TeacherDashboardCourseLoader/CourseRunList', () => {
  it('should render', () => {
    const courseRuns = CourseRunFactory().many(2);
    render(
      <IntlProvider locale="en">
        <CunninghamProvider>
          <MemoryRouter>
            <CourseRunList courseRuns={courseRuns} />
          </MemoryRouter>
        </CunninghamProvider>
      </IntlProvider>,
    );
    const [courseRunOne, courseRunTwo] = courseRuns;
    expect(screen.getByTitle(capitalize(courseRunOne.title))).toBeInTheDocument();
    expect(screen.getByTitle(capitalize(courseRunTwo.title))).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Go to course area' }).length).toEqual(2);
  });
});
