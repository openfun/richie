import { QueryClientProvider } from 'react-query';
import { IntlProvider } from 'react-intl';
import { renderHook } from '@testing-library/react-hooks';
import { JSXElementConstructor, PropsWithChildren, ReactElement } from 'react';
import * as mockFactories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import useDashboardRoutes from './index';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('react-intl', () => {
  const originIntl = jest.requireActual('react-intl');
  return {
    ...originIntl,
    useIntl: () => ({
      formatMessage: (message: string) => {
        return message;
      },
    }),
  };
});

jest.mock('components/DashBoard/routes', () => [
  {
    element: 'whatever',
    intlPath: 'home',
    intlTitle: 'home',
    protected: false,
  },
  {
    element: '<h2>Whatever</h2>',
    intlPath: 'protected',
    intlTitle: 'protected',
    protected: true,
  },
]);

describe('useDashBoardRoutes', () => {
  const wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
    </IntlProvider>
  );

  it("returns an array of DashBoardRoute depending of the DasboardRouteDefinition's array given", async () => {
    const { result } = renderHook(() => useDashboardRoutes(), { wrapper });
    expect(result.current.routes).toHaveLength(3);
  });

  it('adds a 404 page', async () => {
    const x = renderHook(() => useDashboardRoutes(), { wrapper });
    const element = x.result.current.routes[2].element as ReactElement;
    expect(element.type).toEqual('h2');
    expect(element.props.children).toStrictEqual('404 Not Found');
    expect(x.result.current.routes[2].path).toStrictEqual('*');
  });

  it('returns a ProtectedRoute if the route is protected', async () => {
    const x = renderHook(() => useDashboardRoutes(), { wrapper });
    const element = x.result.current.routes[1].element as ReactElement;
    const type = element.type as JSXElementConstructor<any>;
    expect(type.name).toStrictEqual('ProtectedRoute');
  });
});
