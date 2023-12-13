import React, { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import {
  ContractDefinitionFactory,
  ContractFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import OrderStateMessage, { messages } from '.';

const intl = createIntl({ locale: 'en' });

/*
  @TODO (rlecellier): Rewrite everything with these guidlignes
  Order lifecycle:
    * Draft: order has been created
    * Submitted: order information have been validated
    * Pending: payment has failed but can be retried
    * Validated:
        * Completed (Validated with generated certificate)
        * On going (Validated without generated certificate)
        * Signature needed: !order.product.contract.isSign
    * Canceled: has been canceled
*/
describe('<DashboardItemOrder/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  it.each([
    [OrderState.DRAFT, 'Draft'],
    [OrderState.SUBMITTED, 'Submitted'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const order = CredentialOrderFactory({ state }).one();
      render(
        <Wrapper>
          <OrderStateMessage order={order} />
        </Wrapper>,
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it.each([
    [OrderState.DRAFT, 'Draft'],
    [OrderState.SUBMITTED, 'Submitted'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const orderWithContract = CredentialOrderFactory({
        state,
        contract: ContractFactory().one(),
      }).one();
      render(
        <Wrapper>
          <OrderStateMessage order={orderWithContract} />
        </Wrapper>,
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it('should display message for validated order that need learner signature', () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: null,
    }).one();

    const product = ProductFactory({
      contract_definition: ContractDefinitionFactory().one(),
    }).one();

    render(
      <Wrapper>
        <OrderStateMessage order={order} product={product} />
      </Wrapper>,
    );
    expect(screen.getByText('Signature required')).toBeInTheDocument();
  });

  it("should display message for validated order that don't have a generated certificate", () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ student_signed_on: new Date().toISOString() }).one(),
      certificate_id: undefined,
    }).one();
    render(
      <Wrapper>
        <OrderStateMessage order={order} />
      </Wrapper>,
    );
    expect(
      screen.getByText(intl.formatMessage(messages.statusOnGoing), {
        exact: false,
      }),
    );
  });

  it('should display message for validated order that have a generated certificate', () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ student_signed_on: new Date().toISOString() }).one(),
      certificate_id: 'FAKE_CERTIFICATE_ID',
    }).one();
    render(
      <Wrapper>
        <OrderStateMessage order={order} />
      </Wrapper>,
    );
    expect(
      screen.getByText(intl.formatMessage(messages.statusCompleted), {
        exact: false,
      }),
    );
  });
});
