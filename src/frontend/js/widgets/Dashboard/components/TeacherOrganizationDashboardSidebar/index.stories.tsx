import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherOrganizationDashboardSidebar } from 'widgets/Dashboard/components/TeacherOrganizationDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: TeacherOrganizationDashboardSidebar,
} as ComponentMeta<typeof TeacherOrganizationDashboardSidebar>;

const Template: ComponentStory<typeof TeacherOrganizationDashboardSidebar> = () => {
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
};

export const TeacherOrganization = Template.bind({});
TeacherOrganization.args = {};
