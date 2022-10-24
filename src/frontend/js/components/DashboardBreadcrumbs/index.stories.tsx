import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, Outlet, RouteObject, RouterProvider } from 'react-router-dom';
import { defineMessages } from 'react-intl';
import { DashboardBreadcrumbs } from 'components/DashboardBreadcrumbs/index';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { DashboardBreadcrumbsProvider } from 'components/DashboardBreadcrumbs/DashboardBreadcrumbsProvider';

export default {
  title: 'Components/Dashboard/DashboardBreadcrumbs',
  component: DashboardBreadcrumbs,
} as ComponentMeta<typeof DashboardBreadcrumbs>;

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

const Template: ComponentStory<typeof DashboardBreadcrumbs> = () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/sub'] });
  return <RouterProvider router={router} />;
};

export const Default = Template.bind({});
