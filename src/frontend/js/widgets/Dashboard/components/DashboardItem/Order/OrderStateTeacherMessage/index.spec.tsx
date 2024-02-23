import React, { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import {
  ContractDefinitionFactory,
  ContractFactory,
  CredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import OrderStateTeacherMessage, { messages } from '.';

const intl = createIntl({ locale: 'en' });

describe('<OrderStateTeacherMessage/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  it.each([
    [OrderState.DRAFT, 'Pending'],
    [OrderState.SUBMITTED, 'Pending'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const order = CredentialOrderFactory({ state }).one();
      render(
        <Wrapper>
          <OrderStateTeacherMessage order={order} />
        </Wrapper>,
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it.each([
    [OrderState.DRAFT, 'Pending'],
    [OrderState.SUBMITTED, 'Pending'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have contract',
    (state, expectedMessage) => {
      const orderWithContract = CredentialOrderFactory({
        state,
        contract: ContractFactory().one(),
      }).one();
      render(
        <Wrapper>
          <OrderStateTeacherMessage
            order={orderWithContract}
            contractDefinition={ContractDefinitionFactory().one()}
          />
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

    const contractDefinition = ContractDefinitionFactory().one();

    render(
      <Wrapper>
        <OrderStateTeacherMessage order={order} contractDefinition={contractDefinition} />
      </Wrapper>,
    );
    expect(screen.getByText("Pending for learner's signature")).toBeInTheDocument();
  });

  it('should display message for validated order that need organization signature', () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({
        student_signed_on: new Date().toISOString(),
      }).one(),
    }).one();
    const contractDefinition = ContractDefinitionFactory().one();

    render(
      <Wrapper>
        <OrderStateTeacherMessage order={order} contractDefinition={contractDefinition} />
      </Wrapper>,
    );
    expect(screen.getByText('To be signed')).toBeInTheDocument();
  });

  it("should display message for validated order that don't have a generated certificate", () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      certificate_id: undefined,
    }).one();
    render(
      <Wrapper>
        <OrderStateTeacherMessage order={order} />
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
      certificate_id: 'FAKE_CERTIFICATE_ID',
    }).one();
    render(
      <Wrapper>
        <OrderStateTeacherMessage order={order} />
      </Wrapper>,
    );
    expect(
      screen.getByText(intl.formatMessage(messages.statusCompleted), {
        exact: false,
      }),
    );
  });
});
