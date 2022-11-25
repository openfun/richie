import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Example } from './Example';

export const App = () => {
  const router = createMemoryRouter([
    {
      index: true,
      element: <Example />,
    },
    {
      path: '*',
      element: <h1>Not found.</h1>,
    },
  ]);
  return <RouterProvider router={router} />;
};
