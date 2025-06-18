import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { PER_PAGE } from 'settings';
import { ContractResourceQuery, ContractState } from 'types/Joanie';
import { ContractFactory } from 'utils/test/factories/joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
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
  setupJoanieSession();

  beforeEach(() => {
    // useDefaultOrganization hook request organization list
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
  });

  it('should render a ContractNavLink with route and label when neither organizationId and offerId are given', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My contract navigation link',
    };

    render(<ContractNavLink link={link} />);

    expect(screen.getByRole('link', { name: 'My contract navigation link' })).toBeInTheDocument();
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  describe('without sign ability', () => {
    const contractAbilities = { [ContractActions.SIGN]: false };
    it.each([
      {
        organizationId: faker.string.uuid(),
        offerId: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        offerId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        offerId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        offerId: undefined,
      },
    ])(
      'should never render Badge for organizationId: $organizationId and courseProductId: $offerId',
      async ({ organizationId, offerId }) => {
        let contractQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (offerId) {
          contractQueryParams = {
            offer_id: offerId,
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
          <ContractNavLink
            link={{
              to: '/dummy/url/',
              label: 'My contract navigation link',
            }}
            organizationId={organizationId}
            offerId={offerId}
          />,
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
        offerId: undefined,
        nbContractsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: faker.string.uuid(),
        offerId: faker.string.uuid(),
        nbContractsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: undefined,
        offerId: faker.string.uuid(),
        nbContractsToSign: 1,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offerId: undefined,
        nbContractsToSign: 1,
        expectedBadgeCount: undefined,
      },

      // with 0 contracts to sign
      {
        organizationId: faker.string.uuid(),
        offerId: undefined,
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        offerId: faker.string.uuid(),
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offerId: faker.string.uuid(),
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offerId: undefined,
        nbContractsToSign: 0,
        expectedBadgeCount: undefined,
      },
    ])(
      'should render Badge (count: $expectedBadgeCount) for nb contracts to sign: $nbContractsToSign, organizationId: $organizationId and courseProductId: $offerId',
      async ({ nbContractsToSign, organizationId, offerId, expectedBadgeCount }) => {
        let contractQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (offerId) {
          contractQueryParams = {
            offer_id: offerId,
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
          <ContractNavLink
            link={{
              to: '/dummy/url/',
              label: 'My contract navigation link',
            }}
            organizationId={organizationId}
            offerId={offerId}
          />,
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
