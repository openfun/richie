import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { PER_PAGE } from 'settings';
import { ContractResourceQuery, ContractState } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import { MenuLink } from '../..';
import ContractNavLink from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<ContractNavLink />', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={createTestQueryClient({ user: true })}>
      <IntlProvider locale="en">
        <JoanieSessionProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </JoanieSessionProvider>
      </IntlProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    // JoanieSessionProvider queries
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should render a ContractNavLink with route and label when neither organizationId and courseProductRelationId are given', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My contract navigation link',
    };

    render(
      <Wrapper>
        <ContractNavLink link={link} />
      </Wrapper>,
    );

    expect(screen.getByRole('link', { name: 'My contract navigation link' })).toBeInTheDocument();
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  describe('without sign ability', () => {
    const contractAbilities = { [ContractActions.SIGN]: false };
    it.each([
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        courseProductRelationId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        courseProductRelationId: undefined,
      },
    ])(
      'should never render Badge for organizationId: $organizationId and courseProductId: $courseProductRelationId',
      async ({ organizationId, courseProductRelationId }) => {
        let contractQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (courseProductRelationId) {
          contractQueryParams = {
            course_product_relation_id: courseProductRelationId,
            ...contractQueryParams,
          };
        }

        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organizationId}/contracts/?${queryString.stringify(
            contractQueryParams,
            { sort: false },
          )}`,
          {
            count: 1,
            next: null,
            previous: null,
            results: [ContractFactory({ abilities: contractAbilities }).one()],
          },
        );
        render(
          <Wrapper>
            <ContractNavLink
              link={{
                to: '/dummy/url/',
                label: 'My contract navigation link',
              }}
              organizationId={organizationId}
              courseProductRelationId={courseProductRelationId}
            />
          </Wrapper>,
        );

        expect(
          screen.getByRole('link', { name: 'My contract navigation link' }),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      },
    );
  });

  describe('with sign ability', () => {
    const contractAbilities = { [ContractActions.SIGN]: true };
    it.each([
      // with 1 contracts to sign
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: undefined,
        nbContractsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: faker.string.uuid(),
        nbContractsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: undefined,
        courseProductRelationId: faker.string.uuid(),
        nbContractsToSign: 1,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        courseProductRelationId: undefined,
        nbContractsToSign: 1,
        expectedBadgeCount: undefined,
      },

      // with 0 contracts to sign
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: undefined,
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        courseProductRelationId: faker.string.uuid(),
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        courseProductRelationId: faker.string.uuid(),
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        courseProductRelationId: undefined,
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
    ])(
      'should render Badge (count: $expectedBadgeCount) for nb contracts to sign: $nbContractsToSign, organizationId: $organizationId and courseProductId: $courseProductRelationId',
      async ({
        nbContractsToSign,
        organizationId,
        courseProductRelationId,
        expectedBadgeCount,
      }) => {
        let contractQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (courseProductRelationId) {
          contractQueryParams = {
            course_product_relation_id: courseProductRelationId,
            ...contractQueryParams,
          };
        }

        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organizationId}/contracts/?${queryString.stringify(
            contractQueryParams,
            { sort: false },
          )}`,
          {
            count: nbContractsToSign,
            next: null,
            previous: null,
            results: [ContractFactory({ abilities: contractAbilities }).one()],
          },
        );
        render(
          <Wrapper>
            <ContractNavLink
              link={{
                to: '/dummy/url/',
                label: 'My contract navigation link',
              }}
              organizationId={organizationId}
              courseProductRelationId={courseProductRelationId}
            />
          </Wrapper>,
        );

        expect(
          screen.getByRole('link', { name: 'My contract navigation link' }),
        ).toBeInTheDocument();
        if (expectedBadgeCount === undefined) {
          expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
        } else {
          const $badge = await screen.findByTestId('badge');
          expect($badge).toBeInTheDocument();
          expect($badge).toHaveTextContent(`${expectedBadgeCount}`);
        }
      },
    );
  });
});
