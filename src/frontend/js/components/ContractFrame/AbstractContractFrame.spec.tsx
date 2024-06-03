import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { Deferred } from 'utils/test/deferred';
import { expectBannerError } from 'utils/test/expectBanner';
import { HttpError } from 'utils/errors/HttpError';
import { CONTRACT_SETTINGS } from 'settings';
import AbstractContractFrame from './AbstractContractFrame';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('settings', () => ({
  ...jest.requireActual('settings'),
  CONTRACT_SETTINGS: {
    ...jest.requireActual('settings').CONTRACT_SETTINGS,
    pollInterval: 10,
    dummySignatureSignTimeout: 10,
  },
}));

describe('<AbstractContractFrame />', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <JoanieSessionProvider>{children}</JoanieSessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // SessionProvider api calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fetchMock.restore();
  });

  it('should render an ContractFrame and close it', async () => {
    const mockOnClose = jest.fn();
    const mockGetInvitationLink = jest.fn(
      async () => 'https://dummysignaturebackend.fr/contract/1/sign',
    );
    const mockCheckSignature = jest.fn(async () => ({ isSigned: true }));

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen={true}
            onDone={jest.fn()}
            onClose={mockOnClose}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render the modal when `isOpen` is false', async () => {
    const mockGetInvitationLink = jest.fn(
      async () => 'https://dummysignaturebackend.fr/contract/1/sign',
    );
    const mockCheckSignature = jest.fn(async () => ({ isSigned: true }));

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen={false}
            onDone={jest.fn()}
            onClose={jest.fn()}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();
  });

  it('should render the modal and allow user to complete signature process', async () => {
    const user = userEvent.setup();
    const mockGetInvitationLink = jest.fn(
      async () => 'https://dummysignaturebackend.fr/contract/1/sign',
    );
    const checkSignatureDeferred = new Deferred<{ isSigned: boolean }>();
    const mockCheckSignature = jest.fn(async () => checkSignatureDeferred.promise);
    const mockOnDone = jest.fn();
    const mockOnClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen
            onDone={mockOnDone}
            onClose={mockOnClose}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    // Dummy signature interface should have been rendered
    let button = screen.getByRole('button', { name: 'Sign' });
    await user.click(button);

    // The dummy interface should be loading
    screen.getByRole('heading', { name: 'Signing the contract ...' });

    // Then the signature check polling should be started
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'We are waiting for the signature to be validated from our signature platform. It can take up to few minutes. Do not close this page.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    checkSignatureDeferred.resolve({ isSigned: true });
    await waitFor(() => {
      expect(mockCheckSignature).toHaveBeenCalledTimes(1);
    });

    // As the first call confirm the document has been signed,
    // the ContractFrame should go to the finish step and the onDone callback should
    // have been called
    expect(mockOnDone).toHaveBeenCalledTimes(1);
    await screen.findByRole('heading', { name: 'Congratulations!' });
    button = screen.getByRole('button', { name: 'Next' });
    await user.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('retrieves invitation link but fails during signature checking', async () => {
    const user = userEvent.setup();
    const mockGetInvitationLink = jest.fn(
      async () => 'https://dummysignaturebackend.fr/contract/1/sign',
    );
    const checkSignatureDeferred = new Deferred<{ isSigned: boolean }>();
    const mockCheckSignature = jest.fn(async () => checkSignatureDeferred.promise);
    const mockOnDone = jest.fn();
    const mockOnClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen={true}
            onDone={mockOnDone}
            onClose={mockOnClose}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    // Dummy signature interface should have been rendered
    let button = screen.getByRole('button', { name: 'Sign' });
    await user.click(button);

    // The dummy interface should be loading
    screen.getByRole('heading', { name: 'Signing the contract ...' });

    // Then the signature check polling should be started
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'We are waiting for the signature to be validated from our signature platform. It can take up to few minutes. Do not close this page.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    checkSignatureDeferred.reject(new HttpError(500, 'Interval server error'));
    await waitFor(() => {
      expect(mockCheckSignature).toHaveBeenCalledTimes(1);
    });

    // As the first call confirm the document has been signed,
    // the ContractFrame should go to the finish step and the onDone callback should
    // have been called
    await expectBannerError('An error happened while verifying signature. Please come back later.');
    expect(mockOnDone).not.toHaveBeenCalled();
    button = screen.getByRole('button', { name: 'Close dialog' });
    await user.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('retrieves invitation link but exceeds polling max attemps', async () => {
    const user = userEvent.setup();
    const mockGetInvitationLink = jest.fn(
      async () => 'https://dummysignaturebackend.fr/contract/1/sign',
    );
    const checkSignatureDeferred = new Deferred<{ isSigned: boolean }>();
    const mockCheckSignature = jest.fn(async () => checkSignatureDeferred.promise);
    const mockOnDone = jest.fn();
    const mockOnClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen={true}
            onDone={mockOnDone}
            onClose={mockOnClose}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    // Dummy signature interface should have been rendered
    let button = screen.getByRole('button', { name: 'Sign' });
    await user.click(button);

    // The dummy interface should be loading
    screen.getByRole('heading', { name: 'Signing the contract ...' });

    // Then the signature check polling should be started
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        'We are waiting for the signature to be validated from our signature platform. It can take up to few minutes. Do not close this page.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    checkSignatureDeferred.resolve({ isSigned: false });
    await waitFor(() => {
      expect(mockCheckSignature).toHaveBeenCalledTimes(CONTRACT_SETTINGS.pollLimit);
    });

    // As the first call confirm the document has been signed,
    // the ContractFrame should go to the finish step and the onDone callback should
    // have been called
    await expectBannerError(
      'The signature is taking more time than expected ... please come back later.',
    );
    expect(mockOnDone).not.toHaveBeenCalled();
    button = screen.getByRole('button', { name: 'Close dialog' });
    await user.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('fails to retrieve invitation link', async () => {
    const user = userEvent.setup();
    const mockGetInvitationLink = jest.fn(async () => {
      throw new HttpError(404, 'Not found');
    });
    const checkSignatureDeferred = new Deferred<{ isSigned: boolean }>();
    const mockCheckSignature = jest.fn(async () => checkSignatureDeferred.promise);
    const mockOnDone = jest.fn();
    const mockOnClose = jest.fn();

    await act(async () => {
      render(
        <Wrapper>
          <AbstractContractFrame
            getInvitationLink={mockGetInvitationLink}
            checkSignature={mockCheckSignature}
            isOpen={true}
            onDone={mockOnDone}
            onClose={mockOnClose}
          />
        </Wrapper>,
      );
    });

    expect(mockGetInvitationLink).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    await expectBannerError(
      'An error happened while initializing the signature process. Please retry later.',
    );

    // Dummy signature interface should have been rendered
    const button = screen.getByRole('button', { name: 'Close dialog' });
    await user.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
