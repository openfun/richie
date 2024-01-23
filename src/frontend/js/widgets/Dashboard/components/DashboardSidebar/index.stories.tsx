import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { StorybookHelper } from 'utils/StorybookHelper';
import MenuNavLink from './components/MenuNavLink';
import { DashboardSidebar } from '.';

export default {
  component: DashboardSidebar,
  render: () => {
    const user = UserFactory().one();
    const router = createMemoryRouter([
      {
        index: true,
        element: (
          <DashboardSidebar
            menuLinks={[
              { to: '/test', label: 'Menu link' },
              {
                to: '/test/again',
                label: 'An other menu link',
                component: (
                  <MenuNavLink
                    link={{ to: '/test/again', label: 'An other menu link' }}
                    badgeCount={999}
                  />
                ),
              },
            ]}
            header="Dashboard story header"
            subHeader="Dashboard story subHeader"
          />
        ),
      },
    ]);
    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof DashboardSidebar>;

type Story = StoryObj<typeof DashboardSidebar>;

export const Default: Story = {};
