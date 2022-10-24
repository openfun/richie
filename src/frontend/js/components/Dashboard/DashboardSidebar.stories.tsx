import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories';
import { DashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: DashboardSidebar,
} as ComponentMeta<typeof DashboardSidebar>;

const Template: ComponentStory<typeof DashboardSidebar> = () => {
  const user = UserFactory.generate();
  const router = createMemoryRouter([
    {
      index: true,
      element: <DashboardSidebar />,
    },
  ]);

  return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
};

export const Default = Template.bind({});

Default.args = {};
