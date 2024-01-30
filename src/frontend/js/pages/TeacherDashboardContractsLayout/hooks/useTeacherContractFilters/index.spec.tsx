import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CourseProductRelationFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { ContractState } from 'types/Joanie';
import useTeacherContractFilters from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

interface WrapperProps {
  routePath: string;
  initialEntry: string;
}

describe('useTeacherContractFilters', () => {
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

  it('should return default filter when called in a route without parameters', async () => {
    const defaultOrganization = OrganizationFactory({ id: 'default' }).one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.test/api/v1.0/organizations/', [defaultOrganization]);
    const { result } = renderHook(useTeacherContractFilters, {
      wrapper: ({ children }) => (
        <Wrapper routePath="/" initialEntry="/">
          {children}
        </Wrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        contract_ids: [],
        organization_id: defaultOrganization.id,
        course_product_relation_id: undefined,
        signature_state: ContractState.SIGNED,
      });
      expect(result.current.filters).toStrictEqual({
        contract_ids: [],
        organization_id: defaultOrganization.id,
        course_product_relation_id: undefined,
        signature_state: ContractState.SIGNED,
      });
    });
  });

  it('should use route parameters values when given', async () => {
    const defaultOrganization = OrganizationFactory({ id: 'default' }).one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.test/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useTeacherContractFilters, {
      wrapper: ({ children }) => (
        <Wrapper
          routePath="/:organizationId/:courseProductRelationId"
          initialEntry={`/${routeOrganization.id}/${routeCourseProductRelation.id}?organization_id=${filteredOrganization.id}&signature_state=${ContractState?.UNSIGNED}&contract_ids=1&contract_ids=2`}
        >
          {children}
        </Wrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        contract_ids: ['1', '2'],
        organization_id: routeOrganization.id,
        course_product_relation_id: routeCourseProductRelation.id,
        signature_state: ContractState.UNSIGNED,
      });
      expect(result.current.filters).toStrictEqual({
        contract_ids: ['1', '2'],
        organization_id: routeOrganization.id,
        course_product_relation_id: routeCourseProductRelation.id,
        signature_state: ContractState.UNSIGNED,
      });
    });
  });

  it("should use organizationId from query parameters when it's not in route params", async () => {
    const defaultOrganization = OrganizationFactory({ id: 'default' }).one();
    const filteredOrganization = OrganizationFactory({ id: 'filtered' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory({ id: 'route' }).one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.test/api/v1.0/organizations/', [
      defaultOrganization,
      filteredOrganization,
    ]);
    const { result } = renderHook(useTeacherContractFilters, {
      wrapper: ({ children }) => (
        <Wrapper
          routePath="/:courseProductRelationId"
          initialEntry={`/${routeCourseProductRelation.id}/?organization_id=${filteredOrganization.id}&signature_state=${ContractState?.UNSIGNED}&contract_ids=1&contract_ids=2`}
        >
          {children}
        </Wrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual({
        contract_ids: ['1', '2'],
        organization_id: filteredOrganization.id,
        course_product_relation_id: routeCourseProductRelation.id,
        signature_state: ContractState.UNSIGNED,
      });
      expect(result.current.filters).toStrictEqual({
        contract_ids: ['1', '2'],
        organization_id: filteredOrganization.id,
        course_product_relation_id: routeCourseProductRelation.id,
        signature_state: ContractState.UNSIGNED,
      });
    });
  });

  it('setFilters should update filter state', async () => {
    const defaultOrganization = OrganizationFactory({ id: 'default' }).one();
    const routeOrganization = OrganizationFactory({ id: 'route' }).one();
    const routeCourseProductRelation = CourseProductRelationFactory().one();
    // fetching user's organizations to initialize default organizationId.
    fetchMock.get('https://joanie.test/api/v1.0/organizations/', [defaultOrganization]);
    const { result } = renderHook(useTeacherContractFilters, {
      wrapper: ({ children }) => (
        <Wrapper routePath="/" initialEntry="/">
          {children}
        </Wrapper>
      ),
    });

    const expectedInitialFilters = {
      contract_ids: [],
      organization_id: defaultOrganization.id,
      course_product_relation_id: undefined,
      signature_state: ContractState.SIGNED,
    };
    await waitFor(() => {
      expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
    });

    const newFilters = {
      contract_ids: ['1', '2'],
      organization_id: routeOrganization.id,
      course_product_relation_id: routeCourseProductRelation.id,
      signature_state: ContractState.UNSIGNED,
    };
    act(() => {
      result.current.setFilters(newFilters);
    });

    expect(result.current.filters).toStrictEqual(newFilters);
    expect(result.current.initialFilters).toStrictEqual(expectedInitialFilters);
  });
});
