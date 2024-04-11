import { Alert, Input, Modal, ModalSize, VariantType } from '@openfun/cunningham-react';
import { createContext, useContext, useMemo, useState } from 'react';
import { SaleTunnelSponsors } from 'components/SaleTunnelV2/SaleTunnelSponsors';
import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { AddressSelector } from 'components/SaleTunnelV2/AddressSelector';
import { CreditCardSelector } from 'components/SaleTunnelV2/CreditCardSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { Address, CreditCard, Order, Product } from 'types/Joanie';
import useProductOrder from 'hooks/useProductOrder';
import { SaleTunnelSuccess } from 'components/SaleTunnelV2/SaleTunnelSuccess';

export interface SaleTunnelV2ContextType {
  props: SaleTunnelV2Props;
  order?: Order;
  product: Product;

  // internal
  onPaymentSuccess: () => void;
  step: SaleTunnelStep;

  // meta
  billingAddress?: Address;
  setBillingAddress: (address?: Address) => void;
  creditCard?: CreditCard;
  setCreditCard: (creditCard?: CreditCard) => void;
}

export const SaleTunnelV2Context = createContext<SaleTunnelV2ContextType>({} as any);

export const useSaleTunnelV2Context = () => {
  const context = useContext(SaleTunnelV2Context);

  if (context === undefined) {
    throw new Error('useSaleTunnelV2Context must be used within a SaleTunnelV2ContextProvider.');
  }

  return context;
};

enum SaleTunnelStep {
  PAYMENT,
  SUCCESS,
}

export const GenericSaleTunnel = (props: SaleTunnelV2Props) => {
  // TODO: SRP
  const { item: order } = useProductOrder({
    courseCode: props.course?.code,
    enrollmentId: props.enrollment?.id,
    productId: props.product.id,
  });

  const [billingAddress, setBillingAddress] = useState<Address>();
  const [creditCard, setCreditCard] = useState<CreditCard>();
  const [step, setStep] = useState<SaleTunnelStep>(SaleTunnelStep.PAYMENT);

  const context: SaleTunnelV2ContextType = useMemo(
    () => ({
      order,
      product: props.product,
      props,
      billingAddress,
      setBillingAddress,
      creditCard,
      setCreditCard,
      onPaymentSuccess: () => {
        setStep(SaleTunnelStep.SUCCESS);
      },
      step,
    }),
    [props, billingAddress, creditCard, step],
  );

  return (
    <SaleTunnelV2Context.Provider value={context}>
      <GenericSaleTunnelInner {...props} />
    </SaleTunnelV2Context.Provider>
  );
};

export const GenericSaleTunnelInner = (props: SaleTunnelV2Props) => {
  const { step } = useSaleTunnelV2Context();
  switch (step) {
    case SaleTunnelStep.PAYMENT:
      return (
        <Modal {...props} size={ModalSize.EXTRA_LARGE} title={props.product.title}>
          <div className="sale-tunnel">
            {step === SaleTunnelStep.PAYMENT && (
              <>
                <div className="sale-tunnel__main">
                  <div className="sale-tunnel__main__left">{props.asideNode}</div>
                  <div className="sale-tunnel__main__separator" />
                  <div className="sale-tunnel__main__right">
                    <SaleTunnelInformation />
                  </div>
                </div>
                <div className="sale-tunnel__footer">
                  {props.paymentNode}
                  <SaleTunnelSponsors />
                </div>
              </>
            )}
          </div>
        </Modal>
      );
    case SaleTunnelStep.SUCCESS:
      return (
        <Modal {...props} size={ModalSize.MEDIUM}>
          <SaleTunnelSuccess />
        </Modal>
      );
  }
  throw new Error('Invalid step');
};

export const SaleTunnelInformation = () => {
  return (
    <div className="sale-tunnel__information">
      <div>
        <h3 className="block-title mb-t">Informations</h3>
        <div className="description mb-s">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sollicitudin elementum.
        </div>
        <Input label="Full name" fullWidth={true} />
        <AddressSelector />
      </div>
      <div>
        <CreditCardSelector />
      </div>
      <div>
        <PaymentScheduleBlock />
      </div>
    </div>
  );
};

const PaymentScheduleBlock = () => {
  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">Schedule</h4>
      <Alert type={VariantType.INFO}>
        The first payment occurs in 14 days, you will be notified to pay the first 30%.
      </Alert>
      <div className="mt-t">
        <PaymentScheduleGrid />
      </div>
    </div>
  );
};
