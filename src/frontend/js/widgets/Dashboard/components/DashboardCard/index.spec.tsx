import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '@openfun/cunningham-react';
import { DashboardCard } from '.';

describe('<DashboardCard/>', () => {
  it('opens and closes', async () => {
    render(
      <DashboardCard header="My header" footer={<Button color="primary">Update</Button>}>
        Content here
      </DashboardCard>,
    );

    screen.getByText('Content here');
    screen.getByRole('button', { name: 'Update' });

    expect(screen.getByTestId('dashboard-card__wrapper').style.height).not.toBe('0px');
    fireEvent.click(screen.getByTestId('dashboard-card__header__toggle'));
    expect(screen.getByTestId('dashboard-card__wrapper').style.height).toBe('0px');
  });
});
