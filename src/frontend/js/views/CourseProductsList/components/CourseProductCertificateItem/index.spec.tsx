import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import {
  CertificationDefinitionFactory,
  ContextFactory as mockContextFactory,
  OrderLiteFactory,
} from 'utils/test/factories';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { CertificateDefinition, OrderLite } from 'types/Joanie';
import { handle } from 'utils/errors/handle';
import CertificateItem from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

const mockHandle = handle as jest.MockedFn<typeof handle>;

describe('CoursePorductCertificateItem', () => {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <JoanieApiProvider>{children}</JoanieApiProvider>
    </IntlProvider>
  );

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    CertificationDefinitionFactory.afterGenerate((s: CertificateDefinition) => s);
  });

  it('displays certificate information', () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory.generate();

    render(
      <Wrapper>
        <CertificateItem certificate={certificateDefinition} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 5, name: certificateDefinition.title });
    screen.getByText(certificateDefinition.description);
  });

  it('displays a default description when certificate description is not defined ', () => {
    const certificateDefinition: CertificateDefinition =
      CertificationDefinitionFactory.afterGenerate((c: CertificateDefinition) => ({
        ...c,
        description: '',
      })).generate();

    render(
      <Wrapper>
        <CertificateItem certificate={certificateDefinition} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 5, name: certificateDefinition.title });
    screen.getByText(
      'You will be able to download your certificate once you will pass all course runs.',
    );
  });

  it('displays a download button when order contains a certificate', async () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory.generate();
    const order: OrderLite = OrderLiteFactory.extend({
      certificate: faker.datatype.uuid(),
    }).generate();

    render(
      <Wrapper>
        <CertificateItem certificate={certificateDefinition} order={order} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 5, name: certificateDefinition.title });

    // - The certificate description should not be displayed ...
    expect(screen.queryByText(certificateDefinition.description)).toBeNull();

    // - ... instead a button to download the certificate should be displayed
    const $button: HTMLButtonElement = screen.getByRole('button', { name: 'Download' });
    expect($button.disabled).toBe(false);

    // When user clicks on "Download" button, the certificate should be downloaded
    fetchMock.get(`https://joanie.test/api/certificates/${order.certificate}/download/`, 200);

    fireEvent.click($button);

    expect($button.disabled).toBe(true);
    screen.getByRole('status', { name: 'Certificate is being generated...' });

    await waitFor(() => {
      expect($button.disabled).toBe(false);
    });
    expect(fetchMock.called()).toBe(true);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line compat/compat
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(0);

    // - A event listener should have attached to window to know when window is blurred.
    // This event is triggered in browser when the download pop up is displayed.
    fireEvent.blur(window);
    // eslint-disable-next-line compat/compat
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('handles an error if certificate download request fails', async () => {
    const certificateDefinition: CertificateDefinition = CertificationDefinitionFactory.generate();
    const order: OrderLite = OrderLiteFactory.extend({
      certificate: faker.datatype.uuid(),
    }).generate();

    render(
      <Wrapper>
        <CertificateItem certificate={certificateDefinition} order={order} />
      </Wrapper>,
    );

    const $button: HTMLButtonElement = screen.getByRole('button', { name: 'Download' });
    expect($button.disabled).toBe(false);

    fetchMock.get(`https://joanie.test/api/certificates/${order.certificate}/download/`, 401);

    await act(async () => {
      // - User ask to download certificate, but the request fails with a 401 response
      fireEvent.click($button);
    });

    expect(fetchMock.called()).toBe(true);
    expect(mockHandle).toHaveBeenNthCalledWith(1, new Error('Unauthorized'));
  });
});
