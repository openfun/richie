import fetchMock from 'fetch-mock';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseProductRelationFactory, OrganizationFactory } from 'utils/test/factories/joanie';
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
        course_product_relation_id: undefined,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: undefined,
        course_id: undefined,
        course_product_relation_id: undefined,
      });
    });
  });

  it('should use route parameters values when given', async () => {
    const defaultOrganization = OrganizationFactory().one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper
          routerOptions={{
            path: '/:organizationId/:courseId/:courseProductRelationId',
            initialEntries: [
              `/${routeOrganization.id}/${routeCourseProductRelation.course.id}/${routeCourseProductRelation.id}?organization_id=${filteredOrganization.id}`,
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
        course_id: routeCourseProductRelation.course.id,
        course_product_relation_id: routeCourseProductRelation.id,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: routeOrganization.id,
        course_id: routeCourseProductRelation.course.id,
        course_product_relation_id: routeCourseProductRelation.id,
      });
    });
  });

  it("should use organizationId from query parameters when it's not in route params", async () => {
    const defaultOrganization = OrganizationFactory().one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory({ id: 'route' }).one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useCourseLearnersFilters, {
      wrapper: ({ children }) => (
        <JoanieAppWrapper
          routerOptions={{
            path: '/:courseId/:courseProductRelationId',
            initialEntries: [
              `/${routeCourseProductRelation.course.id}/${routeCourseProductRelation.id}/?organization_id=${filteredOrganization.id}`,
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
        course_id: routeCourseProductRelation.course.id,
        course_product_relation_id: routeCourseProductRelation.id,
      });
      expect(result.current.filters).toStrictEqual({
        organization_id: filteredOrganization.id,
        course_id: routeCourseProductRelation.course.id,
        course_product_relation_id: routeCourseProductRelation.id,
      });
    });
  });

  it('setFilters should update filter state', async () => {
    const defaultOrganization = OrganizationFactory({ id: 'all' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory().one();
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
      organization_id: undefined,
      course_id: undefined,
      course_product_relation_id: undefined,
    };
    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
    });

    const newFilters = {
      organization_id: routeOrganization.id,
      course_id: routeCourseProductRelation.course.id,
      course_product_relation_id: routeCourseProductRelation.id,
    };
    act(() => {
      result.current.setFilters(newFilters);
    });

    expect(result.current.filters).toStrictEqual(newFilters);
    expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
  });
});
