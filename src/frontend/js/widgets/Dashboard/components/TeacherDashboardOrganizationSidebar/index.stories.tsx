import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import fetchMock from 'fetch-mock';
import { UserFactory } from 'utils/test/factories/richie';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { StorybookHelper } from 'utils/StorybookHelper';
import { ContractFactory, OrganizationFactory } from 'utils/test/factories/joanie';

export default {
  component: TeacherDashboardOrganizationSidebar,
  render: () => {
    const user = UserFactory().one();
    const organization = OrganizationFactory({ logo: null }).one();
    const router = createMemoryRouter(
      [
        {
          index: true,
          path: '/teacher/organizations/:organizationId/',
          element: <TeacherDashboardOrganizationSidebar />,
        },
      ],
      { initialEntries: [`/teacher/organizations/${organization.id}/`] },
    );

    fetchMock.get(`http://localhost:8071/api/v1.0/organizations/${organization.id}/`, organization);
    fetchMock.get(
      `http://localhost:8071/api/v1.0/organizations/${organization.id}/contracts/?signature_state=half_signed`,
      {
        results: ContractFactory({ abilities: { sign: true } }).many(3),
        count: 3,
        previous: null,
        next: null,
      },
    );

    return StorybookHelper.wrapInApp(<RouterProvider router={router} />, { user });
  },
} as Meta<typeof TeacherDashboardOrganizationSidebar>;

type Story = StoryObj<typeof TeacherDashboardOrganizationSidebar>;

export const TeacherOrganization: Story = {};
