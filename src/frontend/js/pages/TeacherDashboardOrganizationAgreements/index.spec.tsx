import fetchMock from 'fetch-mock';
import { screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { browserDownloadFromBlob } from 'utils/download';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { AgreementFactory } from 'utils/test/factories/joanie';
import { expectBannerError } from 'utils/test/expectBanner';
import TeacherDashboardOrganizationAgreements from '.';

let user: UserEvent;

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/download', () => ({
  browserDownloadFromBlob: jest.fn((fn) => fn().then(() => true)),
}));

describe('pages/TeacherDashboardOrganizationAgreements', () => {
  beforeEach(() => {
    user = userEvent.setup();
    jest.resetAllMocks();
  });
  setupJoanieSession();

  it('should render a list of agreements for an organization', async () => {
    const agreementList = AgreementFactory().many(5);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      {
        results: agreementList,
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();
    agreementList.forEach((agreement) => {
      expect(screen.getByTestId(agreement.id));
    });
  });

  it('should render an empty list of agreements for an organization', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });
    await expectNoSpinner();
    expect(screen.getByRole('img', { name: /illustration of an empty table/i }));
  });

  it('should display an error when API fails', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed',
      500,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      500,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      500,
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();
    expectBannerError('An error occurred while fetching contracts. Please retry later');
  });

  it('should paginate', async () => {
    const agreementList = AgreementFactory().many(30);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      {
        results: agreementList.slice(0, 25),
        count: 30,
        previous: null,
        next: 'https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=2&page_size=25',
      },
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=2&page_size=25`,
      {
        results: agreementList.slice(25, 30),
        count: 30,
        previous:
          'https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25',
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();

    expect(screen.getByText(agreementList[0].batch_order.owner_name)).toBeInTheDocument();
    expect(screen.queryByText(agreementList[29].batch_order.owner_name)).not.toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(agreementList[29].batch_order.owner_name)).toBeInTheDocument();
    });
    expect(screen.queryByText(agreementList[0].batch_order.owner_name)).not.toBeInTheDocument();
  });

  it('should filter by signature state', async () => {
    const agreementList = AgreementFactory().many(5);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      {
        results: agreementList,
        count: 5,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed&page=1&page_size=25`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();

    expect(screen.getByText(agreementList[0].batch_order.owner_name)).toBeInTheDocument();

    const signatureStateCombobox = screen.getByRole('combobox', { name: /signature state/i });
    await user.click(signatureStateCombobox);
    const pendingOption = screen.getByRole('option', { name: /Pending for signature/i });
    await user.click(pendingOption);

    await waitFor(() => {
      expect(
        fetchMock.called(
          `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
        ),
      ).toBe(true);
    });
  });

  it('should allow to sign agreements', async () => {
    const agreementList = AgreementFactory()
      .many(5)
      .map((agreement: any) => ({ ...agreement, abilities: { sign: true } }));
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      {
        results: agreementList,
        count: 5,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: agreementList,
        count: 5,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();

    const signatureStateCombobox = screen.getByRole('combobox', { name: /signature state/i });
    await user.click(signatureStateCombobox);
    const pendingOption = screen.getByRole('option', { name: /Pending for signature/i });
    await user.click(pendingOption);

    const signButton = await screen.findByRole('button', { name: /Sign all pending agreements/i });
    expect(signButton).toBeInTheDocument();

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/1/contracts-signature-link/?from_batch_order=true',
      {
        invitation_link: 'https://dummysignaturebackend.fr',
        contract_ids: agreementList.map((a) => a.id),
      },
    );

    await user.click(signButton);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();
  });

  it('should download agreement archive', async () => {
    const agreementList = AgreementFactory()
      .many(5)
      .map((agreement: any) => ({ ...agreement, abilities: { sign: true } }));
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=half_signed`,
      {
        results: [],
        count: 0,
        previous: null,
        next: null,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/agreements/?signature_state=signed&page=1&page_size=25`,
      {
        results: agreementList,
        count: 5,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationAgreements />, {
      routerOptions: {
        path: '/organizations/:organizationId/agreements',
        initialEntries: ['/organizations/1/agreements'],
      },
    });

    await expectNoSpinner();

    const downloadButton = await screen.findByRole('button', {
      name: /Request contracts archive/i,
    });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toBeEnabled();

    const archiveId = '85e098fd-4375-4e0d-9596-3c58988647D0';
    fetchMock.post('https://joanie.endpoint/api/v1.0/contracts/zip-archive/', {
      url: `https://joanie.endpoint/api/v1.0/contracts/zip-archive/${archiveId}/`,
    });

    fetchMock.mock(`https://joanie.endpoint/api/v1.0/contracts/zip-archive/${archiveId}/`, 204, {
      method: 'OPTIONS',
    });

    fetchMock.get(`https://joanie.endpoint/api/v1.0/contracts/zip-archive/${archiveId}/`, {
      status: 200,
      body: new Blob(['test']),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Request contracts archive/i })).toBeEnabled();
    });

    await user.click(downloadButton);

    await waitFor(() => {
      expect(browserDownloadFromBlob).toHaveBeenCalledTimes(1);
    });
  });
});
