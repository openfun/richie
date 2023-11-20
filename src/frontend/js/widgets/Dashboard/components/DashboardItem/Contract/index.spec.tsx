import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { Contract } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardItemContract } from 'widgets/Dashboard/components/DashboardItem/Contract/index';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { ContractFactory } from 'utils/test/factories/joanie';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('<DashboardContract/>', () => {
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

  it('displays a contract', async () => {
    const signedDate = faker.date.past().toISOString();
    const contract: Contract = ContractFactory({ student_signed_on: signedDate }).one();
    render(<DashboardItemContract contract={contract} />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText(contract.definition.title)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product_title)).toBeInTheDocument();
    expect(
      screen.getByText(
        'You signed this training contract. Signed on ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(new Date(signedDate)),
      ),
    ).toBeInTheDocument();
  });
});
