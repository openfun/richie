import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import {
  ContractFactory,
  CredentialOrderFactory,
  NestedCredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { Contract, CredentialOrder, NestedCredentialOrder, OrderState } from 'types/Joanie';
import SignContractButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

enum TestCase {
  FROM_ORDER_WITH_CONTRACT = 'from order with a contract',
  FROM_ORDER_WITHOUT_CONTRACT = 'from order without a contract',
  FROM_CONTRACT = 'from contract',
}
interface FromOrderTestData {
  testCase: TestCase.FROM_ORDER_WITH_CONTRACT | TestCase.FROM_ORDER_WITHOUT_CONTRACT;
  OrderFactory: typeof CredentialOrderFactory;
}
interface FromContractTestData {
  testCase: TestCase.FROM_CONTRACT;
  OrderFactory: typeof NestedCredentialOrderFactory;
}

describe('<SignContractButton/>', () => {
  describe.each<FromOrderTestData | FromContractTestData>([
    {
      testCase: TestCase.FROM_ORDER_WITH_CONTRACT,
      OrderFactory: CredentialOrderFactory,
    },
    {
      testCase: TestCase.FROM_ORDER_WITHOUT_CONTRACT,
      OrderFactory: CredentialOrderFactory,
    },
    {
      testCase: TestCase.FROM_CONTRACT,
      OrderFactory: NestedCredentialOrderFactory,
    },
  ])('$testCase', ({ testCase, OrderFactory }) => {
    let contract: undefined | Contract;
    let order: CredentialOrder | NestedCredentialOrder;
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

    describe('with training contract not signed by the learner', () => {
      beforeEach(() => {
        if (testCase === TestCase.FROM_CONTRACT) {
          contract = ContractFactory({ student_signed_on: null }).one();
          order = contract.order as NestedCredentialOrder;
        } else {
          const orderContract =
            testCase === TestCase.FROM_ORDER_WITH_CONTRACT
              ? ContractFactory({ student_signed_on: null }).one()
              : undefined;
          order = OrderFactory({ contract: orderContract }).one();
          contract = order.contract;
        }
      });

      it('should display a link to the training contract when writable is set to false', () => {
        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={false} />
          </Wrapper>,
        );
        expect(screen.getByRole('link', { name: 'Sign' })).toBeInTheDocument();

        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
        expect(document.querySelector('div.ReactModalPortal')).not.toBeInTheDocument();
      });

      it('should display a button that open ContractFrame modal', async () => {
        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={true} />
          </Wrapper>,
        );
        const $signButton = screen.queryByRole('button', { name: 'Sign' });
        expect($signButton).toBeInTheDocument();
        expect(document.querySelector('div.ReactModalPortal')).toBeInTheDocument();

        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();

        const user = userEvent.setup();
        await user.click($signButton!);

        expect(screen.getByTestId('dashboard-contract-frame')).toBeInTheDocument();
      });

      it('should display a disabled button when order state is not validated', async () => {
        order.state = OrderState.PENDING;
        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={true} />
          </Wrapper>,
        );
        const $signButton = screen.queryByRole('button', { name: 'Sign' });
        expect($signButton).toBeDisabled();
      });
    });

    describe('with training contract signed by the learner', () => {
      beforeEach(() => {
        if (testCase === TestCase.FROM_CONTRACT) {
          contract = ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one();
          order = contract.order as NestedCredentialOrder;
        } else {
          order = OrderFactory({
            contract: ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one(),
          }).one();
          contract = order.contract;
        }
      });

      it('should display render the sign training contract modal portal when writable is set to false', () => {
        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={false} />
          </Wrapper>,
        );
        expect(document.querySelector('div.ReactModalPortal')).toBeInTheDocument();

        expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
      });

      it('should neither display sign or download buttons, but ContractFrame should render', async () => {
        if (testCase === TestCase.FROM_ORDER_WITHOUT_CONTRACT) {
          // order without contract cannot have a signed contract
          return;
        }

        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={true} />
          </Wrapper>,
        );

        expect(document.querySelector('div.ReactModalPortal')).toBeInTheDocument();

        expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
      });
    });

    describe('with training contract signed by the learner and by organization', () => {
      beforeEach(() => {
        contract = ContractFactory({
          student_signed_on: faker.date.past().toISOString(),
          organization_signed_on: faker.date.past().toISOString(),
        }).one();
        if (testCase === TestCase.FROM_CONTRACT) {
          order = contract.order as NestedCredentialOrder;
        } else {
          order = OrderFactory({
            contract,
          }).one();
          contract = order.contract;
        }
      });

      it('should display a download button when writable is set to false', () => {
        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={false} />
          </Wrapper>,
        );
        expect(screen.queryByRole('button', { name: 'Download' })).toBeInTheDocument();
        expect(document.querySelector('div.ReactModalPortal')).toBeInTheDocument();

        expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      });

      it('should display a button to download the training contract', async () => {
        if (testCase === TestCase.FROM_ORDER_WITHOUT_CONTRACT) {
          // order without contract cannot have a signed contract
          return;
        }

        render(
          <Wrapper>
            <SignContractButton order={order} contract={contract} writable={true} />
          </Wrapper>,
        );

        expect(screen.queryByRole('button', { name: 'Download' })).toBeInTheDocument();
        expect(document.querySelector('div.ReactModalPortal')).toBeInTheDocument();

        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
      });
    });
  });
});
