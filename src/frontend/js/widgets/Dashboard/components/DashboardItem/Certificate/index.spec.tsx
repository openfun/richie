import { render, screen, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { Certificate, ProductType } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate/index';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import {
  CertificateFactory,
  NestedCertificateOrderFactory,
  NestedCredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe.each([
  {
    label: 'link to a credential order',
    OrderFactory: NestedCredentialOrderFactory,
  },
  {
    label: 'link to a certificate order',
    OrderFactory: NestedCertificateOrderFactory,
  },
])('<DashboardCertificate/> $label', ({ label, OrderFactory }) => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  beforeEach(() => {
    // SessionProvider queries
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('displays a certificate', async () => {
    const certificate: Certificate = CertificateFactory({
      order: OrderFactory().one(),
    }).one();
    render(
      <DashboardItemCertificate certificate={certificate} productType={ProductType.CREDENTIAL} />,
      { wrapper: Wrapper },
    );

    await waitFor(() => screen.getByText(certificate.certificate_definition.title));
    const orderCourse =
      label === 'link to a credential order'
        ? certificate.order.course!
        : certificate.order.enrollment!.course_run.course;

    screen.getByText(orderCourse.title);
    screen.getByText(
      'Issued on ' +
        new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(new Date(certificate.issued_on)),
    );
  });

  it('downloads the certificate', async () => {
    const certificate: Certificate = CertificateFactory({
      order: OrderFactory().one(),
    }).one();

    fetchMock.get(`https://joanie.test/api/v1.0/certificates/${certificate.id}/download/`, () => ({
      status: HttpStatusCode.OK,
      body: new Blob(['test']),
      headers: {
        'Content-Disposition': 'attachment; filename="test.pdf";',
        'Content-Type': 'application/pdf',
      },
    }));

    render(
      <DashboardItemCertificate certificate={certificate} productType={ProductType.CREDENTIAL} />,
      { wrapper: Wrapper },
    );

    await waitFor(() => screen.getByText(certificate.certificate_definition.title));

    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    // eslint-disable-next-line compat/compat
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  });
});
