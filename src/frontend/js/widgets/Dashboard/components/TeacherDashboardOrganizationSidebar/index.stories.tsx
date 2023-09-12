import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  component: TeacherDashboardOrganizationSidebar,
  render: () => {
    const user = UserFactory().one();
    const router = createMemoryRouter(
      [
        {
          index: true,
          path: ':organizationId',
          element: <TeacherDashboardOrganizationSidebar />,
        },
      ],
      { initialEntries: ['/OrganizationTestId'] },
    );

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof TeacherDashboardOrganizationSidebar>;

type Story = StoryObj<typeof TeacherDashboardOrganizationSidebar>;

export const TeacherOrganization: Story = {};
