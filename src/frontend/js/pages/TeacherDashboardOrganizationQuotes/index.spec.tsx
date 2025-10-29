import fetchMock from 'fetch-mock';
import { screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OrganizationQuoteFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { expectBannerInfo, expectBannerError } from 'utils/test/expectBanner';
import TeacherDashboardOrganizationQuotes from '.';

let user: UserEvent;

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('pages/TeacherDashboardOrganizationQuotes', () => {
  setupJoanieSession();
  beforeEach(() => {
    user = userEvent.setup();
    jest.resetAllMocks();
  });

  it('should render a list of quotes for an organization', async () => {
    const quoteList = OrganizationQuoteFactory({}).many(5);

    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10`, {
      results: quoteList,
      count: 0,
      previous: null,
      next: null,
    });

    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });

    await expectNoSpinner();
    await Promise.all(
      quoteList.map((quote) => screen.findByText((content) => content.includes(quote.id))),
    );
  });

  it('should render a list of quotes for an organization', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10`, {
      results: [],
      count: 0,
      previous: null,
      next: null,
    });

    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });

    await expectNoSpinner();
    await expectBannerInfo('No quotes found for this organization.');
  });

  it('should paginate', async () => {
    const quoteList = OrganizationQuoteFactory().many(30);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10`, {
      results: quoteList.slice(0, 10),
      count: 30,
      previous: null,
      next: 'https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=2&page_size=10',
    });

    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=2&page_size=10`, {
      results: quoteList.slice(10, 20),
      count: 30,
      previous: 'https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10',
      next: 'https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=3&page_size=10',
    });

    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });

    await expectNoSpinner();

    expect(screen.getByText((content) => content.includes(quoteList[0].id))).toBeInTheDocument();
    expect(
      screen.queryByText((content) => content.includes(quoteList[10].id)),
    ).not.toBeInTheDocument();

    const nextButton = screen.getByRole('link', { name: /page 2/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes(quoteList[10].id))).toBeInTheDocument();
    });
    expect(
      screen.queryByText((content) => content.includes(quoteList[0].id)),
    ).not.toBeInTheDocument();
  });

  it('should display an error when API fails', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/1/quotes/?page=1&page_size=10',
      500,
    );

    render(<TeacherDashboardOrganizationQuotes />, {
      routerOptions: {
        path: '/organizations/:organizationId/quotes',
        initialEntries: ['/organizations/1/quotes'],
      },
    });

    await expectNoSpinner();
    await expectBannerError('An error occurred while fetching resources. Please retry later.');
  });
});
