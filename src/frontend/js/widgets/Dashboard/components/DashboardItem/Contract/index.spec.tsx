import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { MemoryRouter } from 'react-router-dom';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { Contract, NestedCredentialOrder } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardItemContract } from 'widgets/Dashboard/components/DashboardItem/Contract/index';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import {
  ContractFactory,
  CredentialOrderFactory,
  NestedCredentialOrderFactory,
} from 'utils/test/factories/joanie';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe.each([
  {
    label: 'with NestedCredentialOrder',
    OrderSerializer: NestedCredentialOrderFactory,
  },
  {
    label: 'with CredentialOrderFactory',
    OrderSerializer: CredentialOrderFactory,
  },
])('<DashboardContract/> $label', ({ OrderSerializer }) => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeAll(() => {
    // eslint-disable-next-line compat/compat
    URL.createObjectURL = jest.fn();
  });

  beforeEach(() => {
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it.each([
    { label: 'writable', writable: true },
    { label: 'none-writable', writable: false },
  ])("render a $label learner's signed contract", async ({ writable }) => {
    const signedDate = faker.date.past().toISOString();
    const contract: Contract = ContractFactory({
      student_signed_on: signedDate,
      organization_signed_on: null,
      order: OrderSerializer().one(),
    }).one();
    render(
      <DashboardItemContract
        title={contract.order.product_title}
        order={contract.order as NestedCredentialOrder}
        contract_definition={contract.definition}
        contract={contract}
        writable={writable}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(await screen.findByText(contract.definition.title)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product_title)).toBeInTheDocument();
    expect(
      screen.getByText(
        'You signed this training contract. Signed on ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(new Date(signedDate)),
      ),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
  });

  it.each([
    { label: 'writable', writable: true },
    { label: 'none-writable', writable: false },
  ])("render a $label organization's signed contract", async ({ writable }) => {
    const signedDate = faker.date.past().toISOString();
    const contract: Contract = ContractFactory({
      student_signed_on: signedDate,
      organization_signed_on: faker.date.past().toISOString(),
      order: OrderSerializer().one(),
    }).one();
    render(
      <DashboardItemContract
        title={contract.order.product_title}
        order={contract.order as NestedCredentialOrder}
        contract_definition={contract.definition}
        contract={contract}
        writable={writable}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(await screen.findByText(contract.definition.title)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product_title)).toBeInTheDocument();
    expect(
      screen.getByText(
        'You signed this training contract. Signed on ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(new Date(signedDate)),
      ),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('render a writable unsigned signed contract', async () => {
    const contract: Contract = ContractFactory({
      student_signed_on: null,
      organization_signed_on: null,
      order: OrderSerializer().one(),
    }).one();
    render(
      <DashboardItemContract
        title={contract.order.product_title}
        order={contract.order as NestedCredentialOrder}
        contract_definition={contract.definition}
        contract={contract}
        writable={true}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(await screen.findByText(contract.definition.title)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product_title)).toBeInTheDocument();
    expect(
      screen.getByText('You have to sign this training contract to access your training.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Sign' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
  });

  it('render a none-writable unsigned signed contract', async () => {
    const contract: Contract = ContractFactory({
      student_signed_on: null,
      organization_signed_on: null,
      order: OrderSerializer().one(),
    }).one();
    render(
      <DashboardItemContract
        title={contract.order.product_title}
        order={contract.order as NestedCredentialOrder}
        contract_definition={contract.definition}
        contract={contract}
        writable={false}
      />,
      {
        wrapper: Wrapper,
      },
    );

    expect(await screen.findByText(contract.definition.title)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product_title)).toBeInTheDocument();
    expect(
      screen.getByText('You have to sign this training contract to access your training.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: 'Sign' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
  });
});
