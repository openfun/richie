import { screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import userEvent from '@testing-library/user-event';
import { render } from 'utils/test/render';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import { DashboardSubItemsList } from './DashboardSubItemsList';
import { DashboardSubItem } from './DashboardSubItem';
import { DashboardItem, DEMO_IMAGE_URL } from '.';

describe('<DashboardItem />', () => {
  it('renders a DashboardItem in "full" mode', () => {
    render(
      <DashboardItem
        title="Become a React pro"
        code="Ref. 123"
        imageUrl={DEMO_IMAGE_URL}
        footer="Hi, i'm the footer"
      />,
      { wrapper: null },
    );

    expect(screen.getByText('Become a React pro')).toBeInTheDocument();
    expect(screen.getByText('Ref. 123')).toBeInTheDocument();
    expect(screen.getByText("Hi, i'm the footer")).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-item__block__head__thumbnail')).toHaveAttribute(
      'src',
      DEMO_IMAGE_URL,
    );
  });

  it('renders a DashboardItem in "compact" mode', () => {
    render(
      <DashboardItem
        title="Become a React pro"
        code="Ref. 123"
        imageUrl={DEMO_IMAGE_URL}
        footer="Hi, i'm the footer"
        mode="compact"
      />,
      { wrapper: null },
    );

    expect(screen.getByText("Hi, i'm the footer")).toBeInTheDocument();

    expect(screen.queryByText('Become a React pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Ref. 123')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-item__block__head__thumbnail')).not.toBeInTheDocument();
  });

  it('renders a DashboardItem with children', () => {
    render(
      <DashboardItem title="Become a React pro" code="Ref. 123" imageUrl={DEMO_IMAGE_URL}>
        <DashboardSubItemsList
          subItems={[
            <DashboardSubItem title="Sub 1" />,
            <DashboardSubItem title="Sub 2" />,
            <DashboardSubItem title="Sub 3" />,
          ]}
        />
      </DashboardItem>,
      { wrapper: null },
    );

    screen.getByText('Sub 1');
    screen.getByText('Sub 2');
    screen.getByText('Sub 3');
  });

  it('renders a DashboardItem with more dropdown', async () => {
    render(
      <DashboardItem
        title="Become a React pro"
        code="Ref. 123"
        imageUrl={DEMO_IMAGE_URL}
        more={
          <>
            <li>
              <div className="selector__list__link">Copy</div>
            </li>
            <li>
              <div className="selector__list__link">Duplicate</div>
            </li>
            <li>
              <div className="selector__list__link">Delete</div>
            </li>
          </>
        }
      />,
      {
        wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
      },
    );

    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    expect(screen.queryByText('Duplicate')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();

    const moreButton = screen.getByRole('combobox', {
      name: 'See additional options',
    });

    const user = userEvent.setup();
    await user.click(moreButton);

    screen.getByText('Copy');
    screen.getByText('Duplicate');
    screen.getByText('Delete');
  });
});
