import { Meta, StoryObj } from '@storybook/react';
import { createMemoryRouter, Outlet, RouteObject, RouterProvider } from 'react-router-dom';
import { defineMessages } from 'react-intl';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { DashboardBreadcrumbs } from '.';

const messages = defineMessages({
  root: {
    id: '',
    description: '',
    defaultMessage: 'Root',
  },
  sub: {
    id: '',
    description: '',
    defaultMessage: 'Sub "{value}"',
  },
});

const Root = () => {
  return (
    <DashboardBreadcrumbsProvider>
      <DashboardBreadcrumbs />
      <Outlet />
    </DashboardBreadcrumbsProvider>
  );
};

const Sub = () => {
  useBreadcrumbsPlaceholders({
    value: 'Hello world',
  });
  return <div />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Root />,
    handle: {
      crumbLabel: messages.root,
    },
    children: [
      {
        path: '/sub',
        element: <Sub />,
        handle: {
          crumbLabel: messages.sub,
        },
      },
    ],
  },
];

export default {
  component: DashboardBreadcrumbs,
  render: () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/sub'] });
    return <RouterProvider router={router} />;
  },
} as Meta<typeof DashboardBreadcrumbs>;

type Story = StoryObj<typeof DashboardBreadcrumbs>;

export const Default: Story = {};
