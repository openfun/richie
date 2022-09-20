import { render, screen } from '@testing-library/react';
import { DashboardItem, DEMO_IMAGE_URL } from 'components/DashboardItem/index';
import { DashboardSubItemsList } from 'components/DashboardItem/DashboardSubItemsList';
import { DashboardSubItem } from 'components/DashboardItem/DashboardSubItem';

describe('<DashboardItem />', () => {
  it('renders a basic DashboardItem', () => {
    render(
      <DashboardItem title="Become a React pro" headRef="Ref. 123" imageUrl={DEMO_IMAGE_URL} />,
    );

    screen.getByText('Become a React pro');
    screen.getByText('Ref. 123');
    expect(screen.getByTestId('dashboard-item__block__head__thumbnail')).toHaveStyle(
      'background-image: url(' + DEMO_IMAGE_URL + ')',
    );
  });
  it('renders a DashboardItem with children', () => {
    render(
      <DashboardItem title="Become a React pro" headRef="Ref. 123" imageUrl={DEMO_IMAGE_URL}>
        <DashboardSubItemsList
          subItems={[
            <DashboardSubItem title="Sub 1" />,
            <DashboardSubItem title="Sub 2" />,
            <DashboardSubItem title="Sub 3" />,
          ]}
        />
      </DashboardItem>,
    );

    screen.getByText('Sub 1');
    screen.getByText('Sub 2');
    screen.getByText('Sub 3');
  });
});
