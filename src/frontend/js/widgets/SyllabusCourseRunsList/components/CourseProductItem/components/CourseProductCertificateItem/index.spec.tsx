import { fireEvent, screen, waitFor } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CertificationDefinitionFactory, OrderLiteFactory } from 'utils/test/factories/joanie';
import { CertificateDefinition, OrderLite } from 'types/Joanie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import CertificateItem from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('CourseProductCertificateItem', () => {
  setupJoanieSession();

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  it('displays certificate information', () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory().one();

    render(<CertificateItem certificateDefinition={certificateDefinition} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    // the title is not a heading to prevent screen reader users "heading spam",
    // but we want it to visually look like a heading for sighted users
    expect(screen.queryByRole('heading', { name: certificateDefinition.title })).toBeNull();
    expect(screen.getByText(certificateDefinition.title).classList.contains('h5')).toBe(true);
    screen.getByText(certificateDefinition.description);
  });

  it('displays a default description when certificate description is not defined ', () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory({
      description: '',
    }).one();

    render(<CertificateItem certificateDefinition={certificateDefinition} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    screen.getByText(
      'You will be able to download your certificate once you will pass all course runs.',
    );
  });

  it('displays a download button when order contains a certificate', async () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory().one();
    const order: OrderLite = OrderLiteFactory({ certificate_id: faker.string.uuid() }).one();

    render(<CertificateItem certificateDefinition={certificateDefinition} order={order} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    // - The certificate description should not be displayed ...
    expect(screen.queryByText(certificateDefinition.description)).toBeNull();

    // - ... instead a button to download the certificate should be displayed
    const $button: HTMLButtonElement = screen.getByRole('button', { name: 'Download' });
    expect($button.disabled).toBe(false);

    // When user clicks on "Download" button, the certificate should be downloaded
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/certificates/${order.certificate_id}/download/`,
      () => ({
        status: HttpStatusCode.OK,
        body: new Blob(['test']),
        headers: {
          'Content-Disposition': 'attachment; filename="test.pdf";',
          'Content-Type': 'application/pdf',
        },
      }),
    );

    fireEvent.click($button);

    expect($button.disabled).toBe(true);
    screen.getByRole('status', { name: 'Certificate is being generated...' });

    await waitFor(() => {
      expect($button.disabled).toBe(false);
    });
    expect(fetchMock.called()).toBe(true);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });
});
