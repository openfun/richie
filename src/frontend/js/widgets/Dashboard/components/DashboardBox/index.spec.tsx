import { screen } from '@testing-library/react';
import { render } from 'utils/test/render';
import { DashboardBox } from '.';

describe('<DashboardBox/>', () => {
  it('renders', () => {
    render(
      <DashboardBox header="Header" footer="Footer">
        Content
      </DashboardBox>,
      { wrapper: null },
    );
    screen.getByText('Header');
    screen.getByText('Content');
    screen.getByText('Footer');
  });
});
