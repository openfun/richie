import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import {
  act,
  fireEvent,
  getByRole,
  getByText,
  queryByRole,
  queryByText,
  render,
  screen,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { faker } from '@faker-js/faker';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { CreditCard } from 'types/Joanie';
import { confirm } from 'utils/indirection/window';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectBannerError } from 'utils/test/expectBanner';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

describe('<DashboardCreditCardsManagement/>', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders an empty list with placeholder', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences']);
    // The empty placeholder is shown.
    await screen.findByText("You haven't created any credit cards yet.");
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
  });

  it('renders the correct label for expired date', async () => {
    const now = new Date();
    const date = faker.date.past({
      refDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    });
    const creditCard: CreditCard = CreditCardFactory({
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    }).one();

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard]);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = await screen.findByText(
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
    const refDate = new Date();
    refDate.setMonth(refDate.getMonth() + 1);
    refDate.setDate(1);
    const futureLessThan3Months = faker.date.future({ years: 2.99 / 12, refDate });
    const creditCard: CreditCard = CreditCardFactory({
      expiration_month: futureLessThan3Months.getMonth() + 1,
      expiration_year: futureLessThan3Months.getFullYear(),
    }).one();

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard]);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = await screen.findByText(
      'Expires on ' +
        (futureLessThan3Months.getMonth() + 1).toLocaleString(undefined, {
          minimumIntegerDigits: 2,
        }) +
        '/' +
        futureLessThan3Months.getFullYear(),
    );
    expect(element.classList).toContain('dashboard-credit-card__expiration');
    expect(element.classList).not.toContain('dashboard-credit-card__expiration--expired');
    expect(element.classList).toContain('dashboard-credit-card__expiration--soon');
  });

  it('renders the correct label for an expiration date that will not soon expire', async () => {
    const refDate = new Date();
    refDate.setMonth(refDate.getMonth() + 4);
    const date = faker.date.future({ refDate });
    const creditCard: CreditCard = CreditCardFactory({
      expiration_month: date.getMonth() + 1,
      expiration_year: date.getFullYear(),
    }).one();

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard]);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();
    const element = await screen.findByText(
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
    const creditCards = CreditCardFactory().many(5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the delete button of the first credit card.
    const creditCard = creditCards[0];
    await screen.findByText(creditCard.title!);
    const creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    const deleteButton = getByRole(creditCardContainer, 'button', {
      name: 'Delete',
    });

    // Mock delete route and the refresh route to returns `creditCards` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.delete(deleteUrl, []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards.splice(1), {
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
    expect(screen.queryByText(creditCard.title!)).toBeNull();
  });

  it('promotes a credit card', async () => {
    const creditCards = CreditCardFactory().many(5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });
    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Find the promote button of the first credit card.
    const creditCard = creditCards[0];
    await screen.findByText(creditCard.title!);
    let creditCardContainer = screen.getByTestId('dashboard-credit-card__' + creditCard.id);
    const promoteButton = getByRole(creditCardContainer, 'button', {
      name: 'Use by default',
    });
    // The address is not already the main one.
    expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull();

    // Mock the update url and the refresh URL to return the first credit card as main.
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/credit-cards/',
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
    const creditCards = CreditCardFactory().many(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const creditCardsContainers = await screen.findAllByTestId('dashboard-credit-card__', {
      exact: false,
    });
    expect(creditCardsContainers.length).toEqual(5);
    getByText(creditCardsContainers[0], 'Default credit card');
    getByText(creditCardsContainers[0], mainCreditCard.title!);

    // All other credit cards container are not displayed as main.
    creditCardsContainers
      .splice(1)
      .forEach((creditCardContainer) =>
        expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull(),
      );
  });

  it('cannot delete a main credit card', async () => {
    const creditCards = CreditCardFactory().many(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // The delete button is not displayed.
    const creditCardContainer = await screen.findByTestId(
      'dashboard-credit-card__' + mainCreditCard.id,
    );
    expect(
      queryByRole(creditCardContainer, 'button', {
        name: 'Delete',
      }),
    ).toBeNull();
  });

  it('cannot promote a main credit card', async () => {
    const creditCards = CreditCardFactory().many(5);
    const mainCreditCard = creditCards[3];
    mainCreditCard.is_main = true;
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // The promote button is not displayed.
    const creditCardContainer = await screen.findByTestId(
      'dashboard-credit-card__' + mainCreditCard.id,
    );
    expect(
      queryByRole(creditCardContainer, 'button', {
        name: 'Use by default',
      }),
    ).toBeNull();
  });

  it('redirects to the edit credit card route', async () => {
    const creditCards = CreditCardFactory().many(5);
    const creditCard = creditCards[2];
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    const creditCardContainer = await screen.findByTestId(
      'dashboard-credit-card__' + creditCard.id,
    );
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
    // Mock the API route to return a 500 error.
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    await expectBannerError('An error occurred while fetching credit cards. Please retry later.');
  });
});
