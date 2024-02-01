import { PropsWithChildren, useEffect, useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  ContractFactory,
  CourseProductRelationFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { isCourseProductRelation } from 'types/Joanie';
import { Props } from './AbstractContractFrame';
import { OrganizationContractFrame } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

// Mock AbstractContractFrame to just call all callbacks on render
// As we have to wait to get the invitation link to be able to call checkSignature,
// we fake this behavior through a combo useState/useEffect
const MockedAbstractContractFrame = (props: Props) => {
  const [hasGetInvitationLink, setHasGetInvitationLink] = useState(false);
  useEffect(() => {
    // Just trigger all
    props.getInvitationLink().then(() => setHasGetInvitationLink(true));
  }, []);

  useEffect(() => {
    if (hasGetInvitationLink) {
      props.checkSignature();
      props.onDone?.();
      props.onClose?.();
    }
  }, [hasGetInvitationLink]);

  return <div data-testid="AbstractContractFrame" data-is-open={props.isOpen} />;
};

jest.mock('./AbstractContractFrame', () => ({
  __esModule: true,
  ...jest.requireActual('./AbstractContractFrame'),
  default: (props: Props) => <MockedAbstractContractFrame {...props} />,
}));

describe('OrganizationContractFrame', () => {
  const Wrapper = ({ client, children }: PropsWithChildren<{ client: QueryClient }>) => {
    return (
      <QueryClientProvider client={client}>
        <IntlProvider locale="en">
          <JoanieSessionProvider>{children}</JoanieSessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // SessionProvider api calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.restore();
  });

  it.each([
    {
      label: 'contractList: undefined, courseProductRelation: undefined',
      contractList: undefined,
      courseProductRelation: undefined,
    },
    {
      label: 'contractList: 2 Contract, courseProductRelation: undefined',
      contractList: ContractFactory().many(2),
      courseProductRelation: undefined,
    },
    {
      label: 'contractList: undefined, courseProductRelation: one CourseProductRelation',
      contractList: undefined,
      courseProductRelation: CourseProductRelationFactory().one(),
    },
  ])(
    'should implement AbstractContractFrame for organization and $label',
    async ({ contractList, courseProductRelation }) => {
      const organization = OrganizationFactory().one();
      const contracts = contractList || ContractFactory().many(2);
      const isOpen = faker.datatype.boolean();

      const invitationLinkQueryString =
        courseProductRelation && isCourseProductRelation(courseProductRelation)
          ? `?course_product_relation_ids=${courseProductRelation.id}`
          : '';
      const expectedUrls = {
        getInvitationLink: `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts-signature-link/${invitationLinkQueryString}`,
        checkSignature: `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts/?id=${contracts[0].id}&id=${contracts[1].id}`,
      };

      fetchMock
        .get(expectedUrls.getInvitationLink, {
          invitation_link: faker.internet.url(),
          contract_ids: contracts.map((contract) => contract.id),
        })
        .get(expectedUrls.checkSignature, { results: [contracts] });

      const handleDone = jest.fn();
      const handleClose = jest.fn();

      const client = createTestQueryClient({
        user: true,
        queriesCallback: (queries) => {
          // Push contract and orders queries
          queries.push(QueryStateFactory(['user', 'organization_contracts'], { data: [] }));
        },
      });

      let contractsQueryState = client.getQueryState(['user', 'organization_contracts']);
      expect(contractsQueryState?.isInvalidated).toBe(false);

      await act(async () => {
        render(
          <Wrapper client={client}>
            <OrganizationContractFrame
              organizationId={organization.id}
              courseProductRelationIds={
                courseProductRelation ? [courseProductRelation.id] : undefined
              }
              isOpen={isOpen}
              onDone={handleDone}
              onClose={handleClose}
            />
          </Wrapper>,
        );
      });

      // isOpen should be passed down to AbstractContractFrame
      const contractFrame = screen.getByTestId('AbstractContractFrame');
      expect(contractFrame).toHaveAttribute('data-is-open', String(isOpen));

      // getInvitationLink should post on order/submit-for-signature endpoint
      expect(fetchMock.called(expectedUrls.getInvitationLink)).toBe(true);

      // checkSignature should get on order endpoint
      expect(fetchMock.called(expectedUrls.checkSignature)).toBe(true);

      // onDone should be tweaked to invalidate the user orders and contracts queries
      // and passed down to AbstractContractFrame
      contractsQueryState = client.getQueryState(['user', 'organization_contracts']);
      expect(contractsQueryState?.isInvalidated).toBe(true);
      expect(handleDone).toHaveBeenCalledTimes(1);

      // onClose should be passed down to AbstractContractFrame
      expect(handleClose).toHaveBeenCalledTimes(1);
    },
  );
});
