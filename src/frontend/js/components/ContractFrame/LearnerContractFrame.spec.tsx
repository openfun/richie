import { PropsWithChildren, useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { QueryStateFactory } from 'utils/test/factories/reactQuery';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CredentialOrderFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { Props } from './AbstractContractFrame';
import { LearnerContractFrame } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

// Mock AbstractContractFrame to just call all callbacks on render
const MockedAbstractContractFrame = (props: Props) => {
  useEffect(() => {
    // Just trigger all
    props.getInvitationLink();
    props.checkSignature();
    props.onDone?.();
    props.onClose?.();
  }, []);

  return <div data-testid="AbstractContractFrame" data-is-open={props.isOpen} />;
};

jest.mock('./AbstractContractFrame', () => ({
  __esModule: true,
  ...jest.requireActual('./AbstractContractFrame'),
  default: (props: Props) => <MockedAbstractContractFrame {...props} />,
}));

describe('LearnerContractFrame', () => {
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

  it('should implement AbstractContractFrame for learner', async () => {
    const order = CredentialOrderFactory().one();
    const isOpen = faker.datatype.boolean();

    const expectedUrls = {
      getInvitationLink: `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      checkSignature: `https://joanie.endpoint/api/v1.0/orders/${order.id}/`,
    };

    fetchMock.post(expectedUrls.getInvitationLink, 200).get(expectedUrls.checkSignature, 200);

    const handleDone = jest.fn();
    const handleClose = jest.fn();

    const client = createTestQueryClient({
      user: true,
      queriesCallback: (queries) => {
        // Push contract and orders queries
        queries.push(QueryStateFactory(['user', 'contracts'], { data: [] }));
        queries.push(QueryStateFactory(['user', 'orders'], { data: [] }));
      },
    });

    let contractsQueryState = client.getQueryState(['user', 'contracts']);
    expect(contractsQueryState?.isInvalidated).toBe(false);
    let ordersQueryState = client.getQueryState(['user', 'orders']);
    expect(ordersQueryState?.isInvalidated).toBe(false);

    render(
      <Wrapper client={client}>
        <LearnerContractFrame
          order={order}
          isOpen={isOpen}
          onDone={handleDone}
          onClose={handleClose}
        />
      </Wrapper>,
    );

    // isOpen should be passed down to AbstractContractFrame
    const contractFrame = await screen.getByTestId('AbstractContractFrame');
    expect(contractFrame).toHaveAttribute('data-is-open', String(isOpen));

    // getInvitationLink should post on order/submit-for-signature endpoint
    expect(fetchMock.called(expectedUrls.getInvitationLink)).toBe(true);

    // checkSignature should get on order endpoint
    expect(fetchMock.called(expectedUrls.checkSignature)).toBe(true);

    // onDone should be tweaked to invalidate the user orders and contracts queries
    // and passed down to AbstractContractFrame
    contractsQueryState = client.getQueryState(['user', 'contracts']);
    expect(contractsQueryState?.isInvalidated).toBe(true);
    ordersQueryState = client.getQueryState(['user', 'orders']);
    expect(ordersQueryState?.isInvalidated).toBe(true);
    expect(handleDone).toHaveBeenCalledTimes(1);

    // onClose should be passed down to AbstractContractFrame
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
