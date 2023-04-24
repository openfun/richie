import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  component: LearnerDashboardSidebar,
  render: () => {
    const user = UserFactory().one();
    const router = createMemoryRouter([
      {
        index: true,
        element: <LearnerDashboardSidebar />,
      },
    ]);

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof LearnerDashboardSidebar>;

type Story = StoryObj<typeof LearnerDashboardSidebar>;

export const Learner: Story = {};
