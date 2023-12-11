import {
  act,
  fireEvent,
  getByText,
  queryByText,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { SessionProvider } from 'contexts/SessionContext';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { expectFetchCall } from 'utils/test/expectFetchCall';
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

describe('<DahsboardEditCreditCard/>', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('updates a credit card name', async () => {
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];
    const creditCardUpdated = CreditCardFactory().one();
    // It must keep the same id.
    creditCardUpdated.id = creditCard.id;

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    expectBreadcrumbsToEqualParts([
      'chevron_leftBack',
      'My preferences',
      'Edit credit card "' + creditCard.title + '"',
    ]);
    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    const button = screen.getByRole('button', { name: 'Save updates' });

    // The title input value is correct.
    const titleInput: HTMLInputElement = await screen.findByRole('textbox', {
      name: 'Name of the credit card',
    });
    await waitFor(() => expect(titleInput.value).toBe(creditCard.title));

    // Mock refresh route.
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/credit-cards/',
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
    const { id, ...creditCardResponse } = creditCard;
    const expectedBody = { ...creditCardResponse, title: creditCardUpdated.title };
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
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];
    const creditCardUpdated = { ...creditCard };
    creditCardUpdated.is_main = true;

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // We are on the expected route.
    await screen.findByText('Edit credit card');
    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    const button = screen.getByRole('button', { name: 'Save updates' });
    // The is_main input value is correct.
    const isMainInput: HTMLInputElement = screen.getByRole('checkbox', {
      name: 'Use this credit card as default',
    });
    await waitFor(() => expect(isMainInput.checked).toBe(false));

    // Mock refresh route.
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/credit-cards/',
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
    const { id, ...creditCardResponse } = creditCard;
    const expectedBody = { ...creditCardResponse, is_main: true };
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
    getByText(creditCardsContainers[0], creditCard.title!);

    // All other credit cards container are not displayed as main.
    creditCardsContainers
      .splice(1)
      .forEach((creditCardContainer) =>
        expect(queryByText(creditCardContainer, 'Default credit card')).toBeNull(),
      );
  });

  it('deletes a credit card', async () => {
    const creditCard = CreditCardFactory().one();
    let creditCards = [...CreditCardFactory().many(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    // We are on the expected route.
    await screen.findByText('Edit credit card');
    // It doesn't show any errors.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    const deleteButton = screen.getByRole('button', { name: 'Delete' });

    // Mock delete route and the refresh route to returns `creditCards` without the first one.
    const deleteUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.delete(deleteUrl, []);
    creditCards = creditCards.slice(0, 5);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards, {
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
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <DashboardTest
                initialRoute={LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION.replace(
                  ':creditCardId',
                  creditCard.id,
                )}
              />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const button = await screen.findByRole('button', { name: 'Save updates' });
    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    await expectBannerError(
      'An error occurred while updating the credit card. Please retry later.',
    );
  });
});
