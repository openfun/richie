import fetchMock from 'fetch-mock';
import { cleanup, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OrganizationQuoteFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import { BatchOrderState } from 'types/Joanie';
import { browserDownloadFromBlob } from 'utils/download';
import TeacherDashboardOrganizationQuotes from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/download', () => ({
  browserDownloadFromBlob: jest.fn(),
}));

let user: UserEvent;

describe('full process for the organization quotes dashboard', () => {
  beforeEach(() => {
    user = userEvent.setup();
    jest.resetAllMocks();
  });
  setupJoanieSession();

  it('should works with the full process workflow for any payment methods', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    const quoteQuoted = OrganizationQuoteFactory({
      batch_order: { state: BatchOrderState.QUOTED, payment_method: PaymentMethod.CARD_PAYMENT },
      organization_signed_on: undefined,
    }).one();
    const quoteSendForSign = OrganizationQuoteFactory({
      id: quoteQuoted.id,
      batch_order: {
        state: BatchOrderState.TO_SIGN,
        payment_method: PaymentMethod.CARD_PAYMENT,
        contract_submitted: false,
      },
    }).one();
    const quoteWaitingForSign = OrganizationQuoteFactory({
      id: quoteQuoted.id,
      batch_order: {
        state: BatchOrderState.TO_SIGN,
        payment_method: PaymentMethod.CARD_PAYMENT,
        contract_submitted: true,
      },
    }).one();
    const quotePending = OrganizationQuoteFactory({
      id: quoteQuoted.id,
      batch_order: {
        state: BatchOrderState.PENDING,
        payment_method: PaymentMethod.CARD_PAYMENT,
      },
    }).one();
    const quoteProcessingPayment = OrganizationQuoteFactory({
      id: quoteQuoted.id,
      batch_order: {
        state: BatchOrderState.PROCESS_PAYMENT,
        payment_method: PaymentMethod.CARD_PAYMENT,
      },
    }).one();
    const quoteDownload = OrganizationQuoteFactory({
      id: quoteQuoted.id,
      batch_order: {
        state: BatchOrderState.COMPLETED,
        payment_method: PaymentMethod.CARD_PAYMENT,
      },
    }).one();

    const quotesResponses = [
      { results: [quoteQuoted], count: 1, previous: null, next: null },
      { results: [quoteSendForSign], count: 1, previous: null, next: null },
      { results: [quoteWaitingForSign], count: 1, previous: null, next: null },
      { results: [quotePending], count: 1, previous: null, next: null },
      { results: [quoteProcessingPayment], count: 1, previous: null, next: null },
      { results: [quoteDownload], count: 1, previous: null, next: null },
      { results: [quoteDownload], count: 1, previous: null, next: null },
    ];

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10`,
      () => quotesResponses.shift(),
    );

    fetchMock.patch(`https://joanie.endpoint/api/v1.0/organizations/1/confirm-quote/`, 200);

    fetchMock.post(
      `https://joanie.endpoint/api/v1.0/organizations/1/submit-for-signature-batch-order/`,
      200,
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/download-quote/?quote_id=${quoteDownload.id}`,
      {
        status: 200,
        body: new Blob(['test']),
      },
    );

    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });

    await expectNoSpinner();

    // Expand dashboard card
    const wrapper = screen.getByTestId('dashboard-card__wrapper');
    const card = wrapper.closest('.dashboard-card');
    const toggle = await screen.findByTestId('dashboard-card__header__toggle');
    await user.click(toggle);
    expect(card).toHaveClass('dashboard-card--opened');

    // Download quote
    const downloadQuoteButton = await screen.findByRole('button', {
      name: /Download quote/i,
    });
    expect(downloadQuoteButton).toBeVisible();
    await user.click(downloadQuoteButton);
    expect(browserDownloadFromBlob).toHaveBeenCalledTimes(1);

    // First step : confirm quote
    const confirmQuoteButton = await screen.findByRole('button', { name: /confirm quote/i });
    expect(confirmQuoteButton).toBeVisible();
    await user.click(confirmQuoteButton);
    await screen.findByText(/total amount/i);
    await user.type(screen.getByLabelText(/total amount/i), '1000');
    await user.click(screen.getByRole('button', { name: /confirm quote/i }));

    // Second step : to sign quote
    const sendForSignatureButton = await screen.findByRole('button', {
      name: /send quote for signature/i,
    });
    expect(sendForSignatureButton).toBeVisible();
    await user.click(sendForSignatureButton);

    // Third step : waiting for signature
    const waitingSignatureButton = await screen.findByRole('button', {
      name: /waiting signature/i,
    });
    expect(waitingSignatureButton).toBeVisible();
    expect(waitingSignatureButton).toBeDisabled();

    // Fourth step : pending payment
    cleanup();
    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });
    await expectNoSpinner();

    const pendingPaymentButton = await screen.findByRole('button', {
      name: /waiting payment/i,
    });
    expect(pendingPaymentButton).toBeVisible();
    expect(pendingPaymentButton).toBeDisabled();

    // Fifth step : process payment
    cleanup();
    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });
    await expectNoSpinner();

    const processPaymentButton = await screen.findByRole('button', {
      name: /processing payment/i,
    });
    expect(processPaymentButton).toBeVisible();
    expect(processPaymentButton).toBeDisabled();
  });
});
