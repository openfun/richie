import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { PER_PAGE } from 'settings';
import { ContractResourceQuery, ContractState } from 'types/Joanie';
import { AgreementFactory } from 'utils/test/factories/joanie';
import { AgreementActions } from 'utils/AbilitiesHelper/types';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { MenuLink } from '../..';
import AgreementNavLink from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<AgreementNavLink />', () => {
  setupJoanieSession();

  beforeEach(() => {
    // useDefaultOrganization hook request organization list
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
  });

  it('should render a AgreementNavLink with route and label when neither organizationId and offeringId are given', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My agreement navigation link',
    };

    render(<AgreementNavLink link={link} />);

    expect(screen.getByRole('link', { name: 'My agreement navigation link' })).toBeInTheDocument();
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  describe('without sign ability', () => {
    const agreementAbilities = { [AgreementActions.SIGN]: false };
    it.each([
      {
        organizationId: faker.string.uuid(),
        offeringId: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        offeringId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        offeringId: faker.string.uuid(),
      },
      {
        organizationId: undefined,
        offeringId: undefined,
      },
    ])(
      'should never render Badge for organizationId: $organizationId and offeringId: $offeringId',
      async ({ organizationId, offeringId }) => {
        let agreementQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (offeringId) {
          agreementQueryParams = {
            offering_id: offeringId,
            ...agreementQueryParams,
          };
        }

        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organizationId}/agreements/?${queryString.stringify(
            agreementQueryParams,
            { sort: false },
          )}`,
          {
            count: 1,
            next: null,
            previous: null,
            results: [AgreementFactory({ abilities: agreementAbilities }).one()],
          },
        );

        render(
          <AgreementNavLink
            link={{
              to: '/dummy/url/',
              label: 'My agreement navigation link',
            }}
            organizationId={organizationId}
            offeringId={offeringId}
          />,
        );

        expect(
          screen.getByRole('link', { name: 'My agreement navigation link' }),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
      },
    );
  });

  describe('with sign ability', () => {
    const agreementAbilities = { [AgreementActions.SIGN]: true };
    it.each([
      // with 1 agreements to sign
      {
        organizationId: faker.string.uuid(),
        offeringId: undefined,
        nbAgreementsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: faker.string.uuid(),
        offeringId: faker.string.uuid(),
        nbAgreementsToSign: 1,
        expectedBadgeCount: 1,
      },
      {
        organizationId: undefined,
        offeringId: faker.string.uuid(),
        nbAgreementsToSign: 1,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offeringId: undefined,
        nbAgreementsToSign: 1,
        expectedBadgeCount: undefined,
      },

      // with 0 agreements to sign
      {
        organizationId: faker.string.uuid(),
        offeringId: undefined,
        nbAgreementsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: faker.string.uuid(),
        offeringId: faker.string.uuid(),
        nbAgreementsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offeringId: faker.string.uuid(),
        nbAgreementsToSign: 0,
        expectedBadgeCount: undefined,
      },
      {
        organizationId: undefined,
        offeringId: undefined,
        nbAgreementsToSign: 0,
        expectedBadgeCount: undefined,
      },
    ])(
      'should render Badge (count: $expectedBadgeCount) for nb agreements to sign: $nbAgreementsToSign, organizationId: $organizationId and offeringId: $offeringId',
      async ({ nbAgreementsToSign, organizationId, offeringId, expectedBadgeCount }) => {
        let agreementQueryParams: ContractResourceQuery = {
          signature_state: ContractState.LEARNER_SIGNED,
          page: 1,
          page_size: PER_PAGE.teacherContractList,
        };
        if (offeringId) {
          agreementQueryParams = {
            offering_id: offeringId,
            ...agreementQueryParams,
          };
        }

        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organizationId}/agreements/?${queryString.stringify(
            agreementQueryParams,
            { sort: false },
          )}`,
          {
            count: nbAgreementsToSign,
            next: null,
            previous: null,
            results: [AgreementFactory({ abilities: agreementAbilities }).one()],
          },
        );
        render(
          <AgreementNavLink
            link={{
              to: '/dummy/url/',
              label: 'My agreement navigation link',
            }}
            organizationId={organizationId}
            offeringId={offeringId}
          />,
        );

        expect(
          screen.getByRole('link', { name: 'My agreement navigation link' }),
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
