import { hydrate, QueryClientProvider } from 'react-query';
import fetchMock from 'fetch-mock';
import { act } from '@testing-library/react-hooks';
import {
  fireEvent,
  getByRole,
  getByText,
  queryByRole,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { findByText } from '@storybook/testing-library';
import * as faker from 'faker';
import * as mockFactories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { DashboardPaths } from 'utils/routers/dashboard';
import { CreditCard } from 'types/Joanie';
import { confirm } from 'utils/indirection/window';

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

describe('<DashboardCreditCardsManagement/>', () => {
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

  it('renders an empty list with placeholder', async () => {
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', []);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    // The empty placeholder is shown.
    screen.getByText("You haven't created any credit cards yet.");
  });

  it('renders the correct label for expired date', async () => {
    const date = faker.date.past(0.2);
    const creditCard: CreditCard = {
      ...mockFactories.CreditCardFactory.generate(),
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    };
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', [creditCard]);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = screen.getByText(
      'Expired since ' +
        (date.getMonth() + 1).toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        date.getFullYear(),
    );
    expect(element.classList).toContain('dashboard-credit-card__expiration');
    expect(element.classList).toContain('dashboard-credit-card__expiration--expired');
    expect(element.classList).not.toContain('dashboard-credit-card__expiration--soon');
  });

  it('renders the correct label for an expiration date that will soon expire', async () => {
    const offset = new Date();
    offset.setMonth(offset.getMonth() + 1);
    offset.setDate(1);
    const date = faker.date.future(2 / 12, offset);
    const creditCard: CreditCard = {
      ...mockFactories.CreditCardFactory.generate(),
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    };
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', [creditCard]);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = screen.getByText(
      'Expires on ' +
        (date.getMonth() + 1).toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        date.getFullYear(),
    );
    expect(element.classList).toContain('dashboard-credit-card__expiration');
    expect(element.classList).not.toContain('dashboard-credit-card__expiration--expired');
    expect(element.classList).toContain('dashboard-credit-card__expiration--soon');
  });

  it('renders the correct label for an expiration date that will not soon expire', async () => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() + 4);
    const date = faker.date.future(0.2, limit);
    const creditCard: CreditCard = {
      ...mockFactories.CreditCardFactory.generate(),
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    };
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', [creditCard]);
    const client = createQueryClientWithUser(true);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = screen.getByText(
      'Expires on ' +
        (date.getMonth() + 1).toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        date.getFullYear(),
    );
    expect(element.classList).toContain('dashboard-credit-card__expiration');
    expect(element.classList).not.toContain('dashboard-credit-card__expiration--expired');
    expect(element.classList).not.toContain('dashboard-credit-card__expiration--soon');
  });

  it('deletes a credit card', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the delete button of the first credit card.
    const creditCard = creditCards[0];
    screen.getByText(creditCard.title);
    const creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    const deleteButton = getByRole(creditCardContainer, 'button', {
      name: 'Delete',
    });

    // Mock delete route and the refresh route to returns `creditCards` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.delete(deleteUrl, []);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards.splice(1), {
      overwriteRoutes: true,
    });

    // Clicking on the delete button calls delete API route.
    expect(fetchMock.called(deleteUrl)).toBe(false);
    // Clicking on the delete button calls window.confirm function.
    expect(confirm).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    expect(fetchMock.called(deleteUrl)).toBe(true);
    expect(confirm).toHaveBeenCalled();

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // The address does not appear anymore in the list.
    expect(screen.queryByText(creditCard.title)).toBeNull();
  });

  it('promotes a credit card', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the promote button of the first credit card.
    const creditCard = creditCards[0];
    screen.getByText(creditCard.title);
    let creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    const promoteButton = getByRole(creditCardContainer, 'button', {
      name: 'Use by default',
    });
    // The address is not already the main one.
    expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull();

    // Mock the update url and the refresh URL to return the first credit card as main.
    const updateUrl = 'https://joanie.endpoint/api/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, []);
    fetchMock.get(
      'https://joanie.endpoint/api/credit-cards/',
      [{ ...creditCard, is_main: true }, ...creditCards.splice(1)],
      { overwriteRoutes: true },
    );

    // Clicking on the promote button calls the update API route.
    expect(fetchMock.called(updateUrl)).toBe(false);
    await act(async () => {
      fireEvent.click(promoteButton);
    });
    expect(fetchMock.called(updateUrl)).toBe(true);

    // Assert that "Default credit card" is displayed on the credit card's box.
    creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    getByText(creditCardContainer, 'Default credit card');

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
  });

  it('shows the main credit card above all others', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const creditCardsContainers = screen.getAllByTestId('dashboard-credit-card__', {
      exact: false,
    });
    expect(creditCardsContainers.length).toEqual(5);
    getByText(creditCardsContainers[0], 'Default credit card');
    getByText(creditCardsContainers[0], mainCreditCard.title);

    // All other credit cards container are not displayed as main.
    creditCardsContainers
      .splice(1)
      .forEach((creditCardContainer) =>
        expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull(),
      );
  });

  it('cannot delete a main credit card', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // The delete button is not displayed.
    const creditCardContainer = screen.getByTestId('dashboard-credit-card__' + mainCreditCard.id);
    expect(
      queryByRole(creditCardContainer, 'button', {
        name: 'Delete',
      }),
    ).toBeNull();
  });

  it('cannot promote a main credit card', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // The promote button is not displayed.
    const creditCardContainer = screen.getByTestId('dashboard-credit-card__' + mainCreditCard.id);
    expect(
      queryByRole(creditCardContainer, 'button', {
        name: 'Use by default',
      }),
    ).toBeNull();
  });

  it('redirects to the edit credit card route', async () => {
    const client = createQueryClientWithUser(true);
    const creditCards = mockFactories.CreditCardFactory.generate(5);
    const creditCard = creditCards[2];
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    const creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    const editButton = getByRole(creditCardContainer, 'button', {
      name: 'Edit',
    });

    await act(async () => {
      fireEvent.click(editButton);
    });

    // We are on the correct route.
    screen.getByText('Edit credit card');

    // The title input value is correct. This way we make sure that we are editing the expected
    // credit card.
    const titleInput: HTMLInputElement = screen.getByRole('textbox', {
      name: 'Name of the credit card',
    });
    expect(titleInput.value).toBe(creditCard.title);
  });

  it('shows an error banner in case of API error', async () => {
    const client = createQueryClientWithUser(true);
    // Mock the API route to return a 500 error.
    fetchMock.get('https://joanie.endpoint/api/credit-cards/', {
      status: 500,
      body: 'Bad request',
    });
    let container: HTMLElement | undefined;
    await act(async () => {
      container = render(
        <QueryClientProvider client={client}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      ).container;
    });

    // It shows an error banner.
    const banner = container!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, 'An error occurred: Internal Server Error. Please retry later.');
  });
});
