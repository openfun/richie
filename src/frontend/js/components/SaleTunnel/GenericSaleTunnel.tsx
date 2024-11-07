import { Modal, ModalSize } from '@openfun/cunningham-react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { SaleTunnelSponsors } from 'components/SaleTunnel/Sponsors/SaleTunnelSponsors';
import { SaleTunnelProps } from 'components/SaleTunnel/index';
import { Address, CreditCard, Order, OrderState, Product } from 'types/Joanie';
import useProductOrder from 'hooks/useProductOrder';
import { SaleTunnelSuccess } from 'components/SaleTunnel/SaleTunnelSuccess';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { useOmniscientOrders, useOrders } from 'hooks/useOrders';
import { SaleTunnelInformation } from 'components/SaleTunnel/SaleTunnelInformation';
import { useEnrollments } from 'hooks/useEnrollments';
import SaleTunnelSavePaymentMethod from 'components/SaleTunnel/SaleTunnelSavePaymentMethod';
import { LearnerContractFrame } from 'components/ContractFrame';

export interface SaleTunnelContextType {
  props: SaleTunnelProps;
  order?: Order;
  product: Product;
  webAnalyticsEventKey: string;

  // internal
  step: SaleTunnelStep;

  // meta
  billingAddress?: Address;
  setBillingAddress: (address?: Address) => void;
  creditCard?: CreditCard;
  setCreditCard: (creditCard?: CreditCard) => void;
  hasWaivedWithdrawalRight: boolean;
  setHasWaivedWithdrawalRight: (hasWaivedWithdrawalRight: boolean) => void;
  registerSubmitCallback: (key: string, callback: () => Promise<void>) => void;
  unregisterSubmitCallback: (key: string) => void;
  runSubmitCallbacks: () => Promise<void>;
  nextStep: () => void;
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
  IDLE,
  SIGN,
  SAVE_PAYMENT,
  SUCCESS,
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
  const [billingAddress, setBillingAddress] = useState<Address>();
  const [creditCard, setCreditCard] = useState<CreditCard>();
  const [hasWaivedWithdrawalRight, setHasWaivedWithdrawalRight] = useState(false);
  const [step, setStep] = useState<SaleTunnelStep>(SaleTunnelStep.IDLE);
  const [submitCallbacks, setSubmitCallbacks] = useState<Map<string, () => Promise<void>>>(
    new Map(),
  );

  const nextStep = useCallback(() => {
    if (order)
      switch (step) {
        case SaleTunnelStep.IDLE:
          if ([OrderState.TO_SIGN, OrderState.SIGNING].includes(order.state)) {
            setStep(SaleTunnelStep.SIGN);
          } else if (order.state === OrderState.TO_SAVE_PAYMENT_METHOD) {
            setStep(SaleTunnelStep.SAVE_PAYMENT);
          }
          break;
        case SaleTunnelStep.SIGN:
          if (order.state === OrderState.TO_SAVE_PAYMENT_METHOD) {
            setStep(SaleTunnelStep.SAVE_PAYMENT);
          }
          if (order.state === OrderState.COMPLETED) {
            setStep(SaleTunnelStep.SUCCESS);
          }
          break;
        case SaleTunnelStep.SAVE_PAYMENT:
          setStep(SaleTunnelStep.SUCCESS);
          break;
      }
  }, [order, step]);

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
      hasWaivedWithdrawalRight,
      setHasWaivedWithdrawalRight,
      nextStep,
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
    [props, order, billingAddress, creditCard, step, submitCallbacks, hasWaivedWithdrawalRight],
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
    case SaleTunnelStep.IDLE:
      return <GenericSaleTunnelInitialStep {...props} />;
    case SaleTunnelStep.SIGN:
      return <GenericSaleTunnelSignStep {...props} />;
    case SaleTunnelStep.SAVE_PAYMENT:
      return <GenericSaleTunnelSavePaymentMethodStep {...props} />;
    case SaleTunnelStep.SUCCESS:
      return <GenericSaleTunnelSuccessStep {...props} />;
  }
  throw new Error('Invalid step: ' + step);
};

/**
 * Steps.
 */

export const GenericSaleTunnelInitialStep = (props: GenericSaleTunnelProps) => {
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
    <Modal {...props} size={ModalSize.EXTRA_LARGE} title={props.product.title}>
      <div className="sale-tunnel" data-testid="generic-sale-tunnel-payment-step">
        <div className="sale-tunnel__main">
          <div className="sale-tunnel__main__column sale-tunnel__main__left ">
            <div>{props.asideNode}</div>
            <div>
              <SaleTunnelSponsors />
            </div>
          </div>
          <div className="sale-tunnel__main__separator" />
          <div className="sale-tunnel__main__right">
            <SaleTunnelInformation />
          </div>
        </div>
        <div className="sale-tunnel__footer">{props.paymentNode}</div>
      </div>
    </Modal>
  );
};

export const GenericSaleTunnelSuccessStep = (props: SaleTunnelProps) => {
  const {
    webAnalyticsEventKey,
    props: { onFinish },
    order,
  } = useSaleTunnelContext();
  const {
    methods: { refetch: refetchOmniscientOrders },
  } = useOmniscientOrders();
  const {
    methods: { invalidate: invalidateOrders },
  } = useOrders(undefined, { enabled: false });
  const {
    methods: { invalidate: invalidateEnrollments },
  } = useEnrollments(undefined, { enabled: false });

  useEffect(() => {
    WebAnalyticsAPIHandler()?.sendCourseProductEvent(
      CourseProductEvent.PAYMENT_SUCCEED,
      webAnalyticsEventKey,
    );
    // Once the user has completed the purchase, we need to refetch the orders
    // to update the ordersQuery cache
    invalidateOrders();
    refetchOmniscientOrders();
    invalidateEnrollments();
    onFinish?.(order!);
  }, []);

  return (
    <Modal {...props} size={ModalSize.MEDIUM}>
      <SaleTunnelSuccess closeModal={props.onClose} />
    </Modal>
  );
};

export const GenericSaleTunnelSavePaymentMethodStep = (props: SaleTunnelProps) => {
  return (
    <Modal {...props} size={ModalSize.LARGE}>
      <SaleTunnelSavePaymentMethod />
    </Modal>
  );
};

export const GenericSaleTunnelSignStep = ({ isOpen, onClose }: SaleTunnelProps) => {
  const { order, nextStep } = useSaleTunnelContext();

  const handleDone = useCallback(nextStep, [order]);

  useEffect(() => {
    if (![OrderState.TO_SIGN, OrderState.SIGNING].includes(order!.state)) {
      nextStep();
    }
  }, [order]);

  return (
    <LearnerContractFrame order={order!} isOpen={isOpen} onClose={onClose} onDone={handleDone} />
  );
};
