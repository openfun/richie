import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Certificate } from 'types/Joanie';
import { resolveAll } from 'utils/resolveAll';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError, expectBannerInfo } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { History, HistoryContext } from 'hooks/useHistory';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { CertificateFactory } from 'utils/test/factories/joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {},
  scroll: jest.fn(),
}));

describe('<DashboardCertificates/>', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = () => [
    {
      state: { name: '', data: {} },
      title: '',
      url: `/`,
    },
    historyPushState,
    historyReplaceState,
  ];

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders an empty list of certificates', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/certificates/?page=1&page_size=10', {
      results: [],
      next: null,
      previous: null,
      count: 30,
    });

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.CERTIFICATES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Make sure the spinner appear during first load.
    await expectSpinner('Loading certificates...');

    await expectNoSpinner('Loading certificates...');

    await expectBannerInfo('You have no certificates yet.');
  });

  it('renders 3 pages of certificates', async () => {
    const certificates: Certificate[] = CertificateFactory().many(30);
    const certificatesPage1 = certificates.slice(0, 10);
    const certificatesPage2 = certificates.slice(10, 20);

    fetchMock.get('https://joanie.endpoint/api/v1.0/certificates/?page=1&page_size=10', {
      results: certificatesPage1,
      next: null,
      previous: null,
      count: 30,
    });

    const page2Deferred = new Deferred();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/certificates/?page=2&page_size=10',
      page2Deferred.promise,
    );

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.CERTIFICATES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Make sure the spinner appear during first load.
    await expectSpinner('Loading certificates...');

    await expectNoSpinner('Loading certificates...');

    // Make sure the first page is loaded.
    expect(document.querySelector('.dashboard__list--loading')).not.toBeInTheDocument();
    await screen.findByText('Currently reading page 1');
    await resolveAll(certificatesPage1, async (certificate) => {
      await screen.findByText(certificate.certificate_definition.title);
    });

    // Go to page 2.
    await userEvent.click(screen.getByText('Next page 2'));

    // Make sure the loading class is set.
    await waitFor(() =>
      expect(document.querySelector('.dashboard__list--loading')).toBeInTheDocument(),
    );

    page2Deferred.resolve({
      results: certificatesPage2,
      next: null,
      previous: null,
      count: 30,
    });

    // Make sure the second page is loaded.
    await screen.findByText('Currently reading page 2');
    await resolveAll(certificatesPage2, async (certificate) => {
      await screen.findByText(certificate.certificate_definition.title);
    });

    // Go back to page 1.
    await userEvent.click(screen.getByText('Previous page 1'));

    await screen.findByText('Currently reading page 1');
    await resolveAll(certificatesPage1, async (certificate) => {
      await screen.findByText(certificate.certificate_definition.title);
    });
  });

  it('shows an error when request to retrieve certificates fails', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/certificates/?page=1&page_size=10', {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.CERTIFICATES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Make sure error is shown.
    await expectBannerError('An error occurred while fetching certificates. Please retry later.');

    // ... and the spinner hidden.
    await expectNoSpinner('Loading ...');
  });
});
