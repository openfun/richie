import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import { ContractFactory, CredentialOrderFactory } from 'utils/test/factories/joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import SignContractButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<SignContractButton/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <JoanieApiProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </JoanieApiProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeAll(() => {
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  it('should display a link to the contract when writable is set to false', () => {
    render(
      <Wrapper>
        <SignContractButton order={CredentialOrderFactory().one()} writable={false} />
      </Wrapper>,
    );
    expect(screen.getByRole('link', { name: 'Sign' })).toBeInTheDocument();
  });

  it("should display a button that open ContractFrame modal when given contract isn't signed", async () => {
    render(
      <Wrapper>
        <SignContractButton order={CredentialOrderFactory().one()} writable={true} />
      </Wrapper>,
    );
    const $signButton = screen.queryByRole('button', { name: 'Sign' });
    expect($signButton).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click($signButton!);

    expect(screen.getByTestId('dashboard-contract-frame')).toBeInTheDocument();
  });

  it('should display a button that open ContractFrame modal when given contract is signed', async () => {
    render(
      <Wrapper>
        <SignContractButton
          order={CredentialOrderFactory({
            contract: ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one(),
          }).one()}
          writable={true}
        />
      </Wrapper>,
    );

    expect(screen.queryByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
  });
});
