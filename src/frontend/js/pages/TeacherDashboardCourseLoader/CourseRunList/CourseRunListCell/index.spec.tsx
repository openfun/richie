import { render, screen } from '@testing-library/react';
import CourseRunListCell from '.';

describe('pages/TeacherDashboardCourseLoader/CourseRunListCell', () => {
  it('should render text', async () => {
    render(<CourseRunListCell textContent="CourseRunListCell button" />);
    expect(screen.getByText('CourseRunListCell button')).toBeInTheDocument();
  });
  it('should render children', async () => {
    render(
      <CourseRunListCell>
        <button>CourseRunListCell button</button>
      </CourseRunListCell>,
    );
    expect(screen.getByRole('button', { name: 'CourseRunListCell button' })).toBeInTheDocument();
  });
});
