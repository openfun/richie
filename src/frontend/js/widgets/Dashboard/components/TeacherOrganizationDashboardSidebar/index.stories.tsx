import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherOrganizationDashboardSidebar } from 'widgets/Dashboard/components/TeacherOrganizationDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  component: TeacherOrganizationDashboardSidebar,
  render: () => {
    const user = UserFactory.generate();
    const router = createMemoryRouter(
      [
        {
          index: true,
          path: ':organizationId',
          element: <TeacherOrganizationDashboardSidebar />,
        },
      ],
      { initialEntries: ['/OrganizationTestId'] },
    );

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof TeacherOrganizationDashboardSidebar>;

type Story = StoryObj<typeof TeacherOrganizationDashboardSidebar>;

export const TeacherOrganization: Story = {};
