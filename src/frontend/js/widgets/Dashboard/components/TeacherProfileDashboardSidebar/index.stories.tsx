import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  component: TeacherProfileDashboardSidebar,
  render: () => {
    const user = UserFactory().one();
    const router = createMemoryRouter([
      {
        index: true,
        element: <TeacherProfileDashboardSidebar />,
      },
    ]);

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof TeacherProfileDashboardSidebar>;

type Story = StoryObj<typeof TeacherProfileDashboardSidebar>;

export const TeacherProfile: Story = {};
