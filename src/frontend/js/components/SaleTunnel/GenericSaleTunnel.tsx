import { Modal, ModalSize } from '@openfun/cunningham-react';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { SaleTunnelSponsors } from 'components/SaleTunnel/Sponsors/SaleTunnelSponsors';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { Address, CreditCard, Order, Product } from 'types/Joanie';
import useProductOrder from 'hooks/useProductOrder';
import { SaleTunnelSuccess } from 'components/SaleTunnel/SaleTunnelSuccess';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { useOmniscientOrders, useOrders } from 'hooks/useOrders';
import { SaleTunnelInformation } from 'components/SaleTunnel/SaleTunnelInformation';
import { useEnrollments } from 'hooks/useEnrollments';
import SaleTunnelNotValidated from './SaleTunnelNotValidated';

export interface SaleTunnelContextType {
  props: SaleTunnelProps;
  order?: Order;
  product: Product;
  webAnalyticsEventKey: string;

  // internal
  onPaymentSuccess: (validated?: boolean) => void;
  step: SaleTunnelStep;

  // meta
  billingAddress?: Address;
  setBillingAddress: (address?: Address) => void;
  creditCard?: CreditCard;
  setCreditCard: (creditCard?: CreditCard) => void;
  registerSubmitCallback: (key: string, callback: () => Promise<void>) => void;
  unregisterSubmitCallback: (key: string) => void;
  runSubmitCallbacks: () => Promise<void>;
}

export const SaleTunnelContext = createContext<SaleTunnelContextType>({} as any);

export const useSaleTunnelContext = () => {
  const context = useContext(SaleTunnelContext);

  if (context === undefined) {
    throw new Error('useSaleTunnelContext must be used within a SaleTunnelContextProvider.');
  }

  return context;
};

export enum SaleTunnelStep {
  PAYMENT,
  SUCCESS,
  NOT_VALIDATED,
}

interface GenericSaleTunnelProps extends SaleTunnelProps {
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

  const {
    methods: { refetch: refetchOmniscientOrders },
  } = useOmniscientOrders();
  const {
    methods: { invalidate: invalidateOrders },
  } = useOrders(undefined, { enabled: false });
  const {
    methods: { invalidate: invalidateEnrollments },
  } = useEnrollments(undefined, { enabled: false });
  const [billingAddress, setBillingAddress] = useState<Address>();
  const [creditCard, setCreditCard] = useState<CreditCard>();
  const [step, setStep] = useState<SaleTunnelStep>(SaleTunnelStep.PAYMENT);
  const [submitCallbacks, setSubmitCallbacks] = useState<Map<string, () => Promise<void>>>(
    new Map(),
  );

  const context: SaleTunnelContextType = useMemo(
    () => ({
      webAnalyticsEventKey: props.eventKey,
      order,
      product: props.product,
      props,
      billingAddress,
      setBillingAddress,
      creditCard,
      setCreditCard,
      onPaymentSuccess: (validated: boolean = true) => {
        if (validated) {
          setStep(SaleTunnelStep.SUCCESS);
        } else {
          setStep(SaleTunnelStep.NOT_VALIDATED);
        }
        WebAnalyticsAPIHandler()?.sendCourseProductEvent(
          CourseProductEvent.PAYMENT_SUCCEED,
          props.eventKey,
        );
        // Once the user has completed the purchase, we need to refetch the orders
        // to update the ordersQuery cache
        invalidateOrders();
        refetchOmniscientOrders();
        invalidateEnrollments();
        props.onFinish?.(order!);
      },
      step,
      registerSubmitCallback: (key, callback) => {
        setSubmitCallbacks((prev) => new Map(prev).set(key, callback));
      },
      unregisterSubmitCallback: (key) => {
        setSubmitCallbacks((prev) => {
          const c = new Map(prev);
          c.delete(key);
          return c;
        });
      },
      runSubmitCallbacks: async () => {
        await Promise.all(Array.from(submitCallbacks.values()).map((cb) => cb()));
      },
    }),
    [props, order, billingAddress, creditCard, step, submitCallbacks],
  );

  return (
    <SaleTunnelContext.Provider value={context}>
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
    </SaleTunnelContext.Provider>
  );
};

export const GenericSaleTunnelInner = (props: GenericSaleTunnelProps) => {
  const { step } = useSaleTunnelContext();
  switch (step) {
    case SaleTunnelStep.PAYMENT:
      return <GenericSaleTunnelPaymentStep {...props} />;
    case SaleTunnelStep.SUCCESS:
      return <GenericSaleTunnelSuccessStep {...props} />;
    case SaleTunnelStep.NOT_VALIDATED:
      return <GenericSaleTunnelNotValidatedStep {...props} />;
  }
  throw new Error('Invalid step: ' + step);
};

/**
 * Steps.
 */

export const GenericSaleTunnelPaymentStep = (props: GenericSaleTunnelProps) => {
  const { webAnalyticsEventKey } = useSaleTunnelContext();

  useEffect(() => {
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(
      CourseProductEvent.OPEN_SALE_TUNNEL,
      webAnalyticsEventKey,
    );
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(
      CourseProductEvent.PAYMENT_STEP_DISPLAYED,
      webAnalyticsEventKey,
    );
  }, []);

  return (
    <Modal {...props} size={ModalSize.EXTRA_LARGE} title={props.product.title} closeOnEsc={false}>
      <div className="sale-tunnel" data-testid="generic-sale-tunnel-payment-step">
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

export const GenericSaleTunnelSuccessStep = (props: SaleTunnelProps) => {
  return (
    <Modal {...props} size={ModalSize.MEDIUM}>
      <SaleTunnelSuccess closeModal={props.onClose} />
    </Modal>
  );
};

export const GenericSaleTunnelNotValidatedStep = (props: SaleTunnelProps) => {
  return (
    <Modal {...props} size={ModalSize.MEDIUM}>
      <SaleTunnelNotValidated closeModal={props.onClose} />
    </Modal>
  );
};
