import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { ContractFactory, CredentialOrderFactory } from 'utils/test/factories/joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { alert } from 'utils/indirection/window';
import { HttpStatusCode } from 'utils/errors/HttpError';
import DownloadContractButton from '.';

jest.mock('utils/errors/handle');

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  alert: jest.fn(() => true),
}));

describe('<DownloadContractButton/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <JoanieApiProvider>{children}</JoanieApiProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should render', () => {
    render(
      <Wrapper>
        <DownloadContractButton contract={ContractFactory().one()} />
      </Wrapper>,
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('downloads the contract', async () => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn((blob) => blob) as any;
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    window.open = jest.fn();

    const order = CredentialOrderFactory({
      target_enrollments: [],
      contract: ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one(),
    }).one();

    const DOWNLOAD_URL = `https://joanie.endpoint/api/v1.0/contracts/${
      order.contract!.id
    }/download/`;

    fetchMock.get(DOWNLOAD_URL, () => ({
      status: HttpStatusCode.OK,
      body: new Blob(['contract content']),
      headers: {
        'Content-Disposition': 'attachment; filename="test.pdf";',
        'Content-Type': 'application/pdf',
      },
    }));
    const expectedFile = new File(['contract content'], 'test.pdf');

    render(
      <Wrapper>
        <DownloadContractButton contract={order.contract!} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    expect(window.open).toHaveBeenCalledTimes(0);
    expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);

    // Click on download and make sure the following function have been called with response content.
    const $downloadButton = screen.getByRole('button', { name: 'Download' });
    await user.click($downloadButton);

    expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledWith(expectedFile);
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(expectedFile);
    expect(alert).toHaveBeenCalledTimes(0);
  });

  it('fails downloading the contract and shows an error', async () => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn((blob) => blob) as any;
    // eslint-disable-next-line compat/compat
    URL.revokeObjectURL = jest.fn();
    window.open = jest.fn();

    const order = CredentialOrderFactory({
      // target_courses: TargetCourseFactory().many(1),
      target_enrollments: [],
      contract: ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one(),
    }).one();

    const DOWNLOAD_URL = `https://joanie.endpoint/api/v1.0/contracts/${
      order.contract!.id
    }/download/`;
    fetchMock.get(DOWNLOAD_URL, {
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Bad request',
    });

    render(
      <Wrapper>
        <DownloadContractButton contract={order.contract!} />
      </Wrapper>,
    );

    const user = userEvent.setup();

    expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    expect(window.open).toHaveBeenCalledTimes(0);
    expect(alert).toHaveBeenCalledTimes(0);

    // Click on download and make sure the following function have been called with response content.
    const $downloadButton = screen.getByRole('button', { name: 'Download' });
    await user.click($downloadButton);

    expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
    // eslint-disable-next-line compat/compat
    expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
    expect(window.open).toHaveBeenCalledTimes(0);

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith(
      'An error happened while downloading the training contract. Please try again later.',
    );
  });
});
