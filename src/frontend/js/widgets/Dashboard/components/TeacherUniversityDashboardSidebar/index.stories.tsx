import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UserFactory } from 'utils/test/factories';
import { TeacherUniversityDashboardSidebar } from 'components/TeacherUniversityDashboardSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';

export default {
  title: 'Components/Dashboard/DashboardSidebar',
  component: TeacherUniversityDashboardSidebar,
} as ComponentMeta<typeof TeacherUniversityDashboardSidebar>;

const Template: ComponentStory<typeof TeacherUniversityDashboardSidebar> = () => {
  const user = UserFactory.generate();
  const router = createMemoryRouter(
    [
      {
        index: true,
        path: ':universityId',
        element: <TeacherUniversityDashboardSidebar />,
      },
    ],
    { initialEntries: ['/UniversityTestId'] },
  );

  return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
};

export const TeacherUniversity = Template.bind({});
TeacherUniversity.args = {};
