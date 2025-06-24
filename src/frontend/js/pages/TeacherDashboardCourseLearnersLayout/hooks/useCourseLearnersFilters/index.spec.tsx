import fetchMock from 'fetch-mock';
import { renderHook, waitFor, act } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OfferingFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { JoanieAppWrapper, setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import useCourseLearnersFilters from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useCourseLearnersFilters', () => {
  setupJoanieSession();

  it('should return default filter when called in a route without parameters', async () => {
    const defaultOrganization = OrganizationFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [defaultOrganization]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper routerOptions={{ path: '/', initialEntries: ['/'] }}>
          {children}
        </JoanieAppWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        organization_id: undefined,
        course_id: undefined,
        offering_id: undefined,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: undefined,
        course_id: undefined,
        offering_id: undefined,
      });
    });
  });

  it('should use route parameters values when given', async () => {
    const defaultOrganization = OrganizationFactory().one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeOffering = OfferingFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper
          routerOptions={{
            path: '/:organizationId/:courseId/:offeringId',
            initialEntries: [
              `/${routeOrganization.id}/${routeOffering.course.id}/${routeOffering.id}?organization_id=${filteredOrganization.id}`,
            ],
          }}
        >
          {children}
        </JoanieAppWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        organization_id: routeOrganization.id,
        course_id: routeOffering.course.id,
        offering_id: routeOffering.id,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: routeOrganization.id,
        course_id: routeOffering.course.id,
        offering_id: routeOffering.id,
      });
    });
  });

  it("should use organizationId from query parameters when it's not in route params", async () => {
    const defaultOrganization = OrganizationFactory().one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeOffering = OfferingFactory({ id: 'route' }).one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper
          routerOptions={{
            path: '/:courseId/:offeringId',
            initialEntries: [
              `/${routeOffering.course.id}/${routeOffering.id}/?organization_id=${filteredOrganization.id}`,
            ],
          }}
        >
          {children}
        </JoanieAppWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        organization_id: filteredOrganization.id,
        course_id: routeOffering.course.id,
        offering_id: routeOffering.id,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: filteredOrganization.id,
        course_id: routeOffering.course.id,
        offering_id: routeOffering.id,
      });
    });
  });

  it('setFilters should update filter state', async () => {
    const defaultOrganization = OrganizationFactory({ id: 'all' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeOffering = OfferingFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [defaultOrganization]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper routerOptions={{ path: '/', initialEntries: ['/'] }}>
          {children}
        </JoanieAppWrapper>
      ),
    });

    const expectedInitialFilters = {
      organization_id: defaultOrganization.id,
      course_id: undefined,
      offering_id: undefined,
    };
    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
    });

    const newFilters = {
      organization_id: routeOrganization.id,
      course_id: routeOffering.course.id,
      offering_id: routeOffering.id,
    };
    act(() => {
      result.current.setFilters(newFilters);
    });

    await waitFor(() => {
      expect(result.current.filters).toStrictEqual(newFilters);
      expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
    });
  });
});
