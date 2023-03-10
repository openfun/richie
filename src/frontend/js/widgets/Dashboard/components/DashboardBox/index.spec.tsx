import { render, screen } from '@testing-library/react';
import { DashboardBox } from '.';

describe('<DashboardBox/>', () => {
  it('renders', () => {
    render(
      <DashboardBox header="Header" footer="Footer">
        Content
      </DashboardBox>,
    );
    screen.getByText('Header');
    screen.getByText('Content');
    screen.getByText('Footer');
  });
});
