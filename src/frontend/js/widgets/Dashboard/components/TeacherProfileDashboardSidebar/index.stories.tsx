import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: TeacherProfileDashboardSidebar,
} as ComponentMeta<typeof TeacherProfileDashboardSidebar>;

const Template: ComponentStory<typeof TeacherProfileDashboardSidebar> = () => {
  const user = UserFactory.generate();
  const router = createMemoryRouter([
    {
      index: true,
      element: <TeacherProfileDashboardSidebar />,
    },
  ]);

  return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
};

export const TeacherProfile = Template.bind({});
TeacherProfile.args = {};
