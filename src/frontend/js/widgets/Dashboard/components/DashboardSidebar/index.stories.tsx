import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardSidebar } from '.';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: DashboardSidebar,
} as ComponentMeta<typeof DashboardSidebar>;

const Template: ComponentStory<typeof DashboardSidebar> = () => {
  const user = UserFactory.generate();
  const router = createMemoryRouter([
    {
      index: true,
      element: (
        <DashboardSidebar
          menuLinks={[
            { to: '/test', label: 'Menu link' },
            { to: '/test/again', label: 'An other menu link' },
          ]}
          header={{
            id: 'stories.Dashboard.header',
            description: 'Title of the dashboard sidebar',
            defaultMessage: 'Dashboard story header',
          }}
          subHeader={{
            id: 'stories.Dashboard.subHeader',
            description: 'Title of the dashboard story sidebar',
            defaultMessage: 'Dashboard story subHeader',
          }}
        />
      ),
    },
  ]);

  return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
};

export const Default = Template.bind({});
Default.args = {};
