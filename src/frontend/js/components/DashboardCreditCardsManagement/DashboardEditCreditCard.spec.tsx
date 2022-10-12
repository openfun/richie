import { act } from '@testing-library/react-hooks';
import { fireEvent, getByText, queryByText, render, screen } from '@testing-library/react';
import { hydrate, QueryClientProvider } from 'react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { findByText } from '@storybook/testing-library';
import * as mockFactories from 'utils/test/factories';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { DashboardPaths } from 'utils/routers/dashboard';
import createQueryClient from 'utils/react-query/createQueryClient';
import { expectFetchCall } from 'utils/test/expectFetchCall';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

describe('<DahsboardEditCreditCard/>', () => {
  const createQueryClientWithUser = (isAuthenticated: Boolean) => {
    const user = isAuthenticated ? mockFactories.UserFactory.generate() : null;
    const { clientState } = mockFactories.PersistedClientFactory({
      queries: [mockFactories.QueryStateFactory('user', { data: user })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    return client;
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('updates a credit card name', async () => {
    const creditCard = mockFactories.CreditCardFactory.generate();
    const creditCards = [...mockFactories.CreditCardFactory.generate(5), creditCard];
    const creditCardUpdated = mockFactories.CreditCardFactory.generate();
    // It must keep the same id.
    creditCardUpdated.id = creditCard.id;

    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, 200);

    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // We are on the expected route.
    screen.getByText('Edit credit card');

    const button = screen.getByRole('button', { name: 'Save updates' });

    // The title input value is correct.
    const titleInput: HTMLInputElement = screen.getByRole('textbox', {
      name: 'Name of the credit card',
    });
    expect(titleInput.value).toBe(creditCard.title);

    // Mock refresh route.
    fetchMock.get(
      'https://joanie.endpoint/api/credit-cards/',
      [
        ...creditCards.slice(0, 5),
        {
          ...creditCard,
          title: creditCardUpdated.title,
        },
      ],
      {
        overwriteRoutes: true,
      },
    );

    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      // Update the title.
      fireEvent.change(titleInput, { target: { value: creditCardUpdated.title } });
      fireEvent.click(button);
    });
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    // The API is called with correct body.
    const expectedBody = { ...creditCard, title: creditCardUpdated.title };
    delete expectedBody.id;
    expectFetchCall(
      updateUrl,
      { method: 'put' },
      {
        body: expectedBody,
      },
    );

    // Redirected to the list route.
    await screen.findByText('Credit cards');

    // The title is correctly updated.
    screen.getByRole('heading', {
      level: 6,
      name: creditCardUpdated.title,
    });

    // The previous title does not appear.
    expect(
      screen.queryByRole('heading', {
        level: 6,
        name: creditCard.title,
      }),
    ).toBeNull();
  });

  it('sets credit card as main', async () => {
    const creditCard = mockFactories.CreditCardFactory.generate();
    const creditCards = [...mockFactories.CreditCardFactory.generate(5), creditCard];
    const creditCardUpdated = { ...creditCard };
    creditCardUpdated.is_main = true;

    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, 200);

    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // We are on the expected route.
    screen.getByText('Edit credit card');

    const button = screen.getByRole('button', { name: 'Save updates' });
    // The is_main input value is correct.
    const isMainInput: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Use this credit card as default',
    });
    expect(isMainInput.checked).toBe(false);

    // Mock refresh route.
    fetchMock.get(
      'https://joanie.endpoint/api/credit-cards/',
      [
        ...creditCards.slice(0, 5),
        {
          ...creditCard,
          is_main: true,
        },
      ],
      {
        overwriteRoutes: true,
      },
    );

    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      // Set as main.
      fireEvent.click(isMainInput);
      fireEvent.click(button);
    });
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    // The API is called with correct body.
    const expectedBody = { ...creditCard, is_main: true };
    delete expectedBody.id;
    expectFetchCall(
      updateUrl,
      { method: 'put' },
      {
        body: expectedBody,
      },
    );

    // Redirected to the list route.
    screen.getByText('Credit cards');

    const creditCardsContainers = screen.getAllByTestId('dashboard-credit-card__', {
      exact: false,
    });
    expect(creditCardsContainers.length).toEqual(6);

    // Assert that `creditCard` is main and the first of the list.
    getByText(creditCardsContainers[0], 'Default credit card');
    getByText(creditCardsContainers[0], creditCard.title);

    // All other credit cards container are not displayed as main.
    creditCardsContainers
      .splice(1)
      .forEach((creditCardContainer) =>
        expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull(),
      );
  });

  it('deletes a credit card', async () => {
    const creditCard = mockFactories.CreditCardFactory.generate();
    let creditCards = [...mockFactories.CreditCardFactory.generate(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, 200);

    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // We are on the expected route.
    screen.getByText('Edit credit card');

    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    // Mock delete route and the refresh route to returns `creditCards` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.delete(deleteUrl, []);
    creditCards = creditCards.slice(0, 5);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards, {
      overwriteRoutes: true,
    });

    // Clicking on the delete button calls delete API route.
    expect(fetchMock.called(deleteUrl)).toBe(false);
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    expect(fetchMock.called(deleteUrl)).toBe(true);

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Redirected to the list route.
    screen.getByText('Credit cards');

    // Assert that the deleted credit card does not appear anymore in the list.
    expect(
      screen.queryByRole('heading', {
        level: 6,
        name: creditCard.title,
      }),
    ).toBeNull();

    // Assert that other credit cards appear in the list.
    creditCards.forEach((c) => {
      screen.getByRole('heading', {
        level: 6,
        name: c.title,
      });
    });
  });

  it('shows an error in case of API error', async () => {
    const creditCard = mockFactories.CreditCardFactory.generate();
    const creditCards = [...mockFactories.CreditCardFactory.generate(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, {
      status: 500,
      body: 'Internal error',
    });

    const client = createQueryClientWithUser(true);
    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ).container;
    });

    const button = screen.getByRole('button', { name: 'Save updates' });
    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    // It shows an error banner.
    const banner = container!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, 'An error occurred: Internal Server Error. Please retry later.');
  });
});
