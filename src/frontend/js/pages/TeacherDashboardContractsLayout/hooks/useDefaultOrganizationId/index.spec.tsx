import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { Organization } from 'types/Joanie';
import useDefaultOrganizationId from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

interface WrapperProps {
  routePath: string;
  initialEntry: string;
}

describe('useDefaultOrganizationId', () => {
  const organizations: {
    routeOrganization: Organization;
    queryOrganization: Organization;
    userOrganizationList: Organization[];
  } = {
    routeOrganization: OrganizationFactory().one(),
    queryOrganization: OrganizationFactory().one(),
    userOrganizationList: OrganizationFactory().many(2),
  };

  const Wrapper = ({ children, routePath, initialEntry }: PropsWithChildren<WrapperProps>) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <JoanieSessionProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <Routes>
                <Route path={routePath} element={children} />
              </Routes>
            </MemoryRouter>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    // Joanie provider's calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it.each([
    {
      testLabel: 'route organization before query',
      routeOrganization: organizations.routeOrganization,
      queryOrganization: organizations.queryOrganization,
      userOrganizationList: organizations.userOrganizationList,
      expectedOrganizationId: organizations.routeOrganization.id,
    },
    {
      testLabel: 'query organization before first element of list',
      routeOrganization: undefined,
      queryOrganization: organizations.queryOrganization,
      userOrganizationList: organizations.userOrganizationList,
      expectedOrganizationId: organizations.queryOrganization.id,
    },
    {
      testLabel: 'first element of list when nothing else is found',
      routeOrganization: undefined,
      queryOrganization: undefined,
      userOrganizationList: organizations.userOrganizationList,
      expectedOrganizationId: organizations.userOrganizationList[0].id,
    },
    {
      testLabel: 'undefined when user have no organization in his list',
      routeOrganization: undefined,
      queryOrganization: undefined,
      userOrganizationList: [],
      expectedOrganizationId: undefined,
    },
  ])(
    'should return $testLabel',
    async ({
      routeOrganization,
      queryOrganization,
      userOrganizationList,
      expectedOrganizationId,
    }) => {
      let routePath = '/';
      if (routeOrganization) {
        routePath += ':organizationId/';
      }
      let initialEntry = '/';
      if (routeOrganization) {
        initialEntry += `${routeOrganization.id}/`;
      }
      if (queryOrganization) {
        initialEntry += `?organization_id=${queryOrganization.id}`;
      }

      fetchMock.get(
        'https://joanie.test/api/v1.0/organizations/',
        [...userOrganizationList, routeOrganization, queryOrganization].filter(
          (organization) => organization !== undefined,
        ),
      );
      const { result } = renderHook(useDefaultOrganizationId, {
        wrapper: ({ children }) => (
          <Wrapper routePath={routePath} initialEntry={initialEntry}>
            {children}
          </Wrapper>
        ),
      });

      // when looking in organization list defaultOrganization will be updated when organizations are fetched.
      await waitFor(() => {
        expect(result.current).toBe(expectedOrganizationId);
      });
    },
  );
});
