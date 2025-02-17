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
import { HttpStatusCode } from 'utils/errors/HttpError';
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
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
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
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', responseDeferred.promise, {
      overwriteRoutes: true,
    });

    const { result } = renderHook(() => useCreditCards(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.items).toEqual([]);
    });
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
    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });

  it('retrieves a specific credit card', async () => {
    const creditCards = CreditCardFactory().many(5);
    const creditCard: CreditCard = creditCards[3];
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', responseDeferred.promise, {
      overwriteRoutes: true,
    });
    const { result } = renderHook(() => useCreditCard(creditCard.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.item).toEqual(undefined);
    });

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

    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });

  it('tokenize a credit card', async () => {
    const responseDeferred = new Deferred();
    fetchMock.post(
      'https://joanie.endpoint/api/v1.0/credit-cards/tokenize-card/',
      responseDeferred.promise,
    );
    const { result } = renderHook(() => useCreditCards(undefined, { enabled: false }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    await act(async () => {
      result.current.methods.tokenize();
    });

    await waitFor(() => {
      expect(result.current.states.tokenizing).toBe(true);
    });

    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.updating).toBe(false);
    expect(result.current.states.fetching).toBe(false);
    expect(result.current.states.isFetched).toBe(true);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.error).toBe(undefined);

    await act(async () => {
      responseDeferred.resolve({});
    });

    await waitFor(() => {
      expect(result.current.states.tokenizing).toBe(false);
    });
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });

  it('manages error during credit card tokenization', async () => {
    fetchMock.post(
      'https://joanie.endpoint/api/v1.0/credit-cards/tokenize-card/',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
    const { result } = renderHook(() => useCreditCards(undefined, { enabled: true }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    await act(async () => {
      await expect(result.current.methods.tokenize()).rejects.toThrow('Internal Server Error');
    });

    expect(result.current.states.error).toBe(
      'An error occurred while adding a credit card. Please retry later.',
    );
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.tokenizing).toBe(false);
  });

  it('promotes a credit card', async () => {
    const responseDeferred = new Deferred();
    fetchMock.patch(
      'https://joanie.endpoint/api/v1.0/credit-cards/1/promote/',
      responseDeferred.promise,
    );
    const { result } = renderHook(() => useCreditCards(undefined, { enabled: false }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    await act(async () => {
      result.current.methods.promote('1');
    });

    await waitFor(() => {
      expect(result.current.states.updating).toBe(true);
    });

    expect(result.current.states.deleting).toBe(false);
    expect(result.current.states.tokenizing).toBe(false);
    expect(result.current.states.fetching).toBe(false);
    expect(result.current.states.isFetched).toBe(true);
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.error).toBe(undefined);

    await act(async () => {
      responseDeferred.resolve({});
    });
    await waitFor(() => {
      expect(result.current.states.updating).toBe(false);
    });
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBe(undefined);
  });

  it('manages error during credit card promotion', async () => {
    fetchMock.patch(
      'https://joanie.endpoint/api/v1.0/credit-cards/1/promote/',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
    const { result } = renderHook(() => useCreditCards(undefined, { enabled: true }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    await act(async () => {
      await expect(result.current.methods.promote('1')).rejects.toThrow('Internal Server Error');
    });

    expect(result.current.states.error).toBe('Cannot set the credit card as default');
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.updating).toBe(false);
  });

  it('has a specific error when credit card deletion fails because it is used', async () => {
    const creditCard = CreditCardFactory({
      id: '1',
      last_numbers: '1337',
    }).one();
    fetchMock.delete('https://joanie.endpoint/api/v1.0/credit-cards/1/', HttpStatusCode.CONFLICT);
    const { result } = renderHook(() => useCreditCards(undefined, { enabled: true }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });

    await act(async () => {
      result.current.methods.delete(creditCard);
    });

    expect(result.current.states.error).toBe(
      'Cannot delete the credit card •••• •••• •••• 1337 because it is used to pay at least one of your order.',
    );
  });
});
