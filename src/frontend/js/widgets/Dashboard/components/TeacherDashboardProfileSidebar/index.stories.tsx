import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherDashboardProfileSidebar } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  component: TeacherDashboardProfileSidebar,
  render: () => {
    const user = UserFactory().one();
    const router = createMemoryRouter([
      {
        index: true,
        element: <TeacherDashboardProfileSidebar />,
      },
    ]);

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof TeacherDashboardProfileSidebar>;

type Story = StoryObj<typeof TeacherDashboardProfileSidebar>;

export const TeacherProfile: Story = {};
