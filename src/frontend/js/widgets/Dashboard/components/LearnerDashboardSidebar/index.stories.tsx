import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: LearnerDashboardSidebar,
} as ComponentMeta<typeof LearnerDashboardSidebar>;

const Template: ComponentStory<typeof LearnerDashboardSidebar> = () => {
  const user = UserFactory.generate();
  const router = createMemoryRouter([
    {
      index: true,
      element: <LearnerDashboardSidebar />,
    },
  ]);

  return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
};

export const Learner = Template.bind({});
Learner.args = {};
