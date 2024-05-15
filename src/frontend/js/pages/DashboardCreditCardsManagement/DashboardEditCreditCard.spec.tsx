import { getByText, queryByText, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { Outlet, generatePath } from 'react-router-dom';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { CreditCardFactory } from 'utils/test/factories/joanie';
import { expectFetchCall } from 'utils/test/expectFetchCall';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectBannerError } from 'utils/test/expectBanner';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { User } from 'types/User';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { render } from 'utils/test/render';
import { DashboardLayoutRoute } from 'widgets/Dashboard/components/DashboardLayoutRoute';
import { JoanieAppWrapper } from 'utils/test/wrappers/JoanieAppWrapper';
import { DashboardPreferences } from 'pages/DashboardPreferences';
import {
  LEARNER_DASHBOARD_ROUTE_LABELS,
  LearnerDashboardPaths,
} from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardEditCreditCardLoader } from './DashboardEditCreditCardLoader';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

const routes = [
  {
    path: '/',
    element: <DashboardLayoutRoute />,
    children: [
      {
        path: LearnerDashboardPaths.PREFERENCES,
        element: <Outlet />,
        handle: {
          crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES],
        },
        children: [
          {
            index: true,
            element: <DashboardPreferences />,
          },
          {
            path: LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION,
            handle: {
              crumbLabel:
                LEARNER_DASHBOARD_ROUTE_LABELS[
                  LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION
                ],
            },
            element: <DashboardEditCreditCardLoader />,
          },
        ],
      },
    ],
  },
];

describe('<DahsboardEditCreditCard/>', () => {
  let richieUser: User;
  beforeEach(() => {
    richieUser = UserFactory().one();
    const openEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();
    const { 'pref-lang': prefLang, ...openEdxAccount } = openEdxProfile;

    fetchMock.get(
      `https://endpoint.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(`https://endpoint.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });

    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('updates a credit card name', async () => {
    fetchMock.get('https://endpoint.test/api/v1.0/user/me', richieUser);
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];
    const creditCardUpdated = CreditCardFactory().one();
    // It must keep the same id.
    creditCardUpdated.id = creditCard.id;

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    render(
      <JoanieAppWrapper
        routerOptions={{
          routes,
          initialEntries: [
            generatePath(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
              creditCardId: creditCard.id,
            }),
          ],
        }}
        queryOptions={{ client: createTestQueryClient({ user: richieUser }) }}
      />,
      { wrapper: null },
    );

    await waitFor(() => {
      expectBreadcrumbsToEqualParts([
        'chevron_leftBack',
        'My preferences',
        'Edit credit card "' + creditCard.title + '"',
      ]);
    });
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

    const user = userEvent.setup();
    await user.clear(titleInput);
    await user.type(titleInput, creditCardUpdated.title!);
    await user.click(button);

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
    fetchMock.get('https://endpoint.test/api/v1.0/user/me', richieUser);
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];
    const creditCardUpdated = { ...creditCard };
    creditCardUpdated.is_main = true;

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    render(
      <JoanieAppWrapper
        routerOptions={{
          routes,
          initialEntries: [
            generatePath(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
              creditCardId: creditCard.id,
            }),
          ],
        }}
        queryOptions={{ client: createTestQueryClient({ user: richieUser }) }}
      />,
      { wrapper: null },
    );

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
    const user = userEvent.setup();
    await user.click(isMainInput);
    await user.click(button);
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
    const creditCardsContainers = await screen.findAllByTestId(/dashboard-credit-card__/);
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
    fetchMock.get('https://endpoint.test/api/v1.0/user/me', richieUser);
    const creditCard = CreditCardFactory().one();
    let creditCards = [...CreditCardFactory().many(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = 'https://joanie.endpoint/api/v1.0/credit-cards/' + creditCard.id + '/';
    fetchMock.put(updateUrl, HttpStatusCode.OK);

    render(
      <JoanieAppWrapper
        routerOptions={{
          routes,
          initialEntries: [
            generatePath(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
              creditCardId: creditCard.id,
            }),
          ],
        }}
        queryOptions={{ client: createTestQueryClient({ user: richieUser }) }}
      />,
      { wrapper: null },
    );

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
    const user = userEvent.setup();
    await user.click(deleteButton);
    expect(fetchMock.called(deleteUrl)).toBe(true);

    // No error is shown.
    expect(screen.queryByText('An error occurred', { exact: false })).toBeNull();

    // Redirected to the list route.
    screen.getByText('Credit cards');

    await waitFor(() => {
      // Assert that other credit cards appear in the list.
      creditCards.forEach((c) => {
        screen.getByRole('heading', {
          level: 6,
          name: c.title,
        });
      });
    });

    // Assert that the deleted credit card does not appear anymore in the list.
    expect(
      screen.queryByRole('heading', {
        level: 6,
        name: creditCard.title,
      }),
    ).toBeNull();
  });

  it('shows an error in case of API error', async () => {
    const creditCard = CreditCardFactory().one();
    const creditCards = [...CreditCardFactory().many(5), creditCard];

    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', creditCards);
    const updateUrl = `https://joanie.endpoint/api/v1.0/credit-cards/${creditCard.id}/`;
    fetchMock.put(updateUrl, {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    render(<DashboardEditCreditCardLoader />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      routerOptions: {
        path: LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION,
        initialEntries: [
          generatePath(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
            creditCardId: creditCard.id,
          }),
        ],
      },
    });

    const button = await screen.findByRole('button', { name: 'Save updates' });
    // Submit of the form calls the API edit route.
    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(false);
    const user = userEvent.setup();
    await user.click(button);

    expect(fetchMock.called(updateUrl, { method: 'put' })).toBe(true);

    await expectBannerError(
      'An error occurred while updating the credit card. Please retry later.',
    );
  });
});
