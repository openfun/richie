import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { Certificate, ProductType } from 'types/Joanie';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate/index';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import {
  CertificateFactory,
  EnrollmentLightFactory,
  NestedCertificateOrderFactory,
  NestedCredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe.each([
  {
    // Link to a credential order
    overrideFactory: () => ({
      order: NestedCredentialOrderFactory().one(),
      enrollment: null,
    }),
  },
  {
    // Link to a certificate order
    overrideFactory: () => ({
      order: NestedCertificateOrderFactory().one(),
      enrollment: null,
    }),
  },
  {
    // Link to an enrollment
    overrideFactory: () => ({
      order: null,
      enrollment: EnrollmentLightFactory().one(),
    }),
  },
])('<DashboardCertificate/> $label', ({ overrideFactory }) => {
  setupJoanieSession();

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  it('displays a certificate', async () => {
    const certificate: Certificate = CertificateFactory(overrideFactory()).one();
    render(
      <DashboardItemCertificate certificate={certificate} productType={ProductType.CREDENTIAL} />,
      { wrapper: BaseJoanieAppWrapper },
    );

    await waitFor(() => screen.getByText(certificate.certificate_definition.title));

    let course;
    if (certificate.enrollment) {
      course = certificate.enrollment.course_run.course;
    } else if (certificate.order!.course) {
      course = certificate.order!.course;
    } else {
      course = certificate.order!.enrollment.course_run.course;
    }

    screen.getByText(course.title);
    screen.getByText(
      'Issued on ' +
        new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(new Date(certificate.issued_on)),
    );
  });

  it('downloads the certificate', async () => {
    const certificate: Certificate = CertificateFactory(overrideFactory()).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/certificates/${certificate.id}/download/`,
      () => ({
        status: HttpStatusCode.OK,
        body: new Blob(['test']),
        headers: {
          'Content-Disposition': 'attachment; filename="test.pdf";',
          'Content-Type': 'application/pdf',
        },
      }),
    );
    render(
      <DashboardItemCertificate certificate={certificate} productType={ProductType.CREDENTIAL} />,
      { wrapper: BaseJoanieAppWrapper },
    );

    await waitFor(() => screen.getByText(certificate.certificate_definition.title));

    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    // eslint-disable-next-line compat/compat
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  });
});
