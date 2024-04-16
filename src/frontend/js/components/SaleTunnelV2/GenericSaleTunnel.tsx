import { Modal, ModalSize } from '@openfun/cunningham-react';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SaleTunnelSponsors } from 'components/SaleTunnelV2/Sponsors/SaleTunnelSponsors';
import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { Address, CreditCard, Order, Product } from 'types/Joanie';
import useProductOrder from 'hooks/useProductOrder';
import { SaleTunnelSuccess } from 'components/SaleTunnelV2/SaleTunnelSuccess';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { useOmniscientOrders, useOrders } from 'hooks/useOrders';
import { SaleTunnelInformation } from 'components/SaleTunnelV2/SaleTunnelInformation';

export interface SaleTunnelV2ContextType {
  props: SaleTunnelV2Props;
  order?: Order;
  product: Product;
  eventKey: string;

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

interface GenericSaleTunnelProps extends SaleTunnelV2Props {
  eventKey: string;

  // slots
  asideNode?: ReactNode;
  paymentNode?: ReactNode;
}

export const GenericSaleTunnel = (props: GenericSaleTunnelProps) => {
  const { item: order } = useProductOrder({
    courseCode: props.course?.code,
    enrollmentId: props.enrollment?.id,
    productId: props.product.id,
  });
  console.log('GenericSaleTunnel', order);

  const {
    methods: { refetch: refetchOmniscientOrders },
  } = useOmniscientOrders();
  const {
    methods: { invalidate: invalidateOrders },
  } = useOrders(undefined, { enabled: false });
  const queryClient = useQueryClient();
  const [billingAddress, setBillingAddress] = useState<Address>();
  const [creditCard, setCreditCard] = useState<CreditCard>();
  const [step, setStep] = useState<SaleTunnelStep>(SaleTunnelStep.PAYMENT);

  const context: SaleTunnelV2ContextType = useMemo(
    () => ({
      eventKey: props.eventKey,
      order,
      product: props.product,
      props,
      billingAddress,
      setBillingAddress,
      creditCard,
      setCreditCard,
      onPaymentSuccess: () => {
        setStep(SaleTunnelStep.SUCCESS);
        WebAnalyticsAPIHandler()?.sendCourseProductEvent(
          CourseProductEvent.PAYMENT_SUCCEED,
          props.eventKey,
        );
        // Once the user has completed the purchase, we need to refetch the orders
        // to update the ordersQuery cache
        invalidateOrders();
        refetchOmniscientOrders();
        queryClient.invalidateQueries({ queryKey: ['user', 'enrollments'] });
        props.onFinish?.(order!);
      },
      step,
    }),
    [props, order, billingAddress, creditCard, step],
  );

  return (
    <SaleTunnelV2Context.Provider value={context}>
      <GenericSaleTunnelInner
        {...props}
        onClose={() => {
          WebAnalyticsAPIHandler()?.sendCourseProductEvent(
            CourseProductEvent.CLOSE_SALE_TUNNEL,
            props.eventKey,
          );
          props.onClose();
        }}
      />
    </SaleTunnelV2Context.Provider>
  );
};

export const GenericSaleTunnelInner = (props: GenericSaleTunnelProps) => {
  const { step } = useSaleTunnelV2Context();
  switch (step) {
    case SaleTunnelStep.PAYMENT:
      return <GenericSaleTunnelPaymentStep {...props} />;
    case SaleTunnelStep.SUCCESS:
      return <GenericSaleTunnelSuccessStep {...props} />;
  }
  throw new Error('Invalid step: ' + step);
};

/**
 * Steps.
 */

export const GenericSaleTunnelPaymentStep = (props: GenericSaleTunnelProps) => {
  const { eventKey } = useSaleTunnelV2Context();

  useEffect(() => {
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(CourseProductEvent.OPEN_SALE_TUNNEL, eventKey);
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(
      CourseProductEvent.PAYMENT_STEP_DISPLAYED,
      eventKey,
    );
  }, []);

  return (
    <Modal {...props} size={ModalSize.EXTRA_LARGE} title={props.product.title}>
      <div className="sale-tunnel" data-testid="GenericSaleTunnelPaymentStep">
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
      </div>
    </Modal>
  );
};

export const GenericSaleTunnelSuccessStep = (props: SaleTunnelV2Props) => {
  return (
    <Modal {...props} size={ModalSize.MEDIUM}>
      <SaleTunnelSuccess />
    </Modal>
  );
};
