import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { useCreditCard, useCreditCards } from 'hooks/useCreditCards/index';
import { SessionProvider } from 'contexts/SessionContext';
import { Deferred } from 'utils/test/deferred';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { CreditCard } from 'types/Joanie';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useCreditCards', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  it('retrieves all the credit cards', async () => {
    const creditCards = CreditCardFactory().many(5);
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', responseDeferred.promise);

    const { result } = renderHook(() => useCreditCards(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.items).toEqual([]);
    });
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.error).toBe(undefined);

    await act(async () => {
      responseDeferred.resolve(creditCards);
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
      expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(creditCards));
    });
    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });

  it('retrieves a specific credit card', async () => {
    const creditCards = CreditCardFactory().many(5);
    const creditCard: CreditCard = creditCards[3];
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', responseDeferred.promise);
    const { result } = renderHook(() => useCreditCard(creditCard.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.item).toEqual(undefined);
    });

    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.error).toBe(undefined);

    await act(async () => {
      responseDeferred.resolve(creditCards);
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
      expect(JSON.stringify(result.current.item)).toBe(JSON.stringify(creditCard));
    });

    expect(result.current.states.creating).toBe(false);
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });
});
