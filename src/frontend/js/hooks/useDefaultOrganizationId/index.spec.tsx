import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { Organization } from 'types/Joanie';
import { JoanieAppWrapper, setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import useDefaultOrganizationId from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useDefaultOrganizationId', () => {
  setupJoanieSession();
  const organizations: {
    routeOrganization: Organization;
    queryOrganization: Organization;
    userOrganizationList: Organization[];
  } = {
    routeOrganization: OrganizationFactory().one(),
    queryOrganization: OrganizationFactory().one(),
    userOrganizationList: OrganizationFactory().many(2),
  };

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
        'https://joanie.endpoint/api/v1.0/organizations/',
        [...userOrganizationList, routeOrganization, queryOrganization].filter(
          (organization) => organization !== undefined,
        ),
      );
      const { result } = renderHook(useDefaultOrganizationId, {
        wrapper: ({ children }) => (
          <JoanieAppWrapper routerOptions={{ path: routePath, initialEntries: [initialEntry] }}>
            {children}
          </JoanieAppWrapper>
        ),
      });

      // when looking in organization list defaultOrganization will be updated when organizations are fetched.
      await waitFor(() => {
        expect(result.current).toBe(expectedOrganizationId);
      });
    },
  );
});
