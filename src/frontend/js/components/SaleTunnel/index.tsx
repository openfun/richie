import { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Modal } from 'components/Modal';
import { CourseRun, Order, Product } from 'types/Joanie';
import { useOmniscientOrders, useOrders } from 'hooks/useOrders';
import { IconTypeEnum } from 'components/Icon';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { useCourseProduct } from 'contexts/CourseProductContext';
import { Manifest, useStepManager } from 'hooks/useStepManager';
import { Maybe } from 'types/utils';
import { SaleTunnelContext, SaleTunnelContextType } from './context';
import { StepBreadcrumb } from './components/StepBreadcrumb';
import { SaleTunnelStepValidation } from './components/SaleTunnelStepValidation';
import { SaleTunnelStepPayment } from './components/SaleTunnelStepPayment';
import { SaleTunnelStepResume } from './components/SaleTunnelStepResume';

const messages = defineMessages({
  stepValidation: {
    defaultMessage: 'Validation',
    description: 'Label of the Validation step',
    id: 'components.SaleTunnel.stepValidation',
  },
  stepPayment: {
    defaultMessage: 'Payment',
    description: 'Label of the Payment step',
    id: 'components.SaleTunnel.stepPayment',
  },
  stepResume: {
    defaultMessage: 'Resume',
    description: 'Label of the Resume step',
    id: 'components.SaleTunnel.stepResume',
  },
});

type TunnelSteps = 'validation' | 'payment' | 'resume';

const focusCurrentStep = (container: HTMLElement) => {
  const currentStep = container.querySelector<HTMLElement>('.StepBreadcrumb [aria-current="step"]');
  if (currentStep) {
    currentStep.focus();
  }
};

type Props = {
  product: Product;
  courseRun?: CourseRun;
  isOpen: boolean;
  onClose: () => void;
};

const SaleTunnel = ({ product, courseRun, isOpen = false, onClose }: Props) => {
  const intl = useIntl();
  const {
    methods: { refetch: refetchOmniscientOrders },
  } = useOmniscientOrders();
  const {
    methods: { invalidate: invalidateOrders },
  } = useOrders(undefined, { enabled: false });
  const { key } = useCourseProduct();

  const [order, setOrder] = useState<Maybe<Order>>();

  const manifest: Manifest<TunnelSteps, 'resume'> = {
    start: 'validation',
    steps: {
      validation: {
        icon: IconTypeEnum.CHECKLIST,
        label: intl.formatMessage(messages.stepValidation),
        next: 'payment',
      },
      payment: {
        icon: IconTypeEnum.CREDIT_CARD,
        label: intl.formatMessage(messages.stepPayment),
        next: 'resume',
        onEnter: () => {
          WebAnalyticsAPIHandler()?.sendCourseProductEvent(
            CourseProductEvent.PAYMENT_STEP_DISPLAYED,
            key,
          );
        },
      },
      resume: {
        icon: IconTypeEnum.CHECK,
        label: intl.formatMessage(messages.stepResume),
        next: null,
        onEnter: () => {
          WebAnalyticsAPIHandler()?.sendCourseProductEvent(CourseProductEvent.PAYMENT_SUCCEED, key);
          // Once the user has completed the purchase, we need to refetch the orders
          // to update the ordersQuery cache
          invalidateOrders();
          refetchOmniscientOrders();
        },
        onExit: () => {
          handleModalClose();
        },
      },
    },
  };
  const { step, next, reset } = useStepManager(manifest);

  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleModalClose = (track: boolean = false) => {
    if (track) {
      WebAnalyticsAPIHandler()?.sendCourseProductEvent(CourseProductEvent.CLOSE_SALE_TUNNEL, key);
    }
    onClose();
    reset();
  };

  const context: SaleTunnelContextType = useMemo(
    () => ({
      product,
      order,
      setOrder,
    }),
    [product, order, setOrder],
  );

  /**
   * correctly handle keyboard/screen reader users navigation on step change.
   * Without this, since elements are removed from the DOM from step to step,
   * focus is set back to the <body> tag by the browser. We also do this
   * in the `onAfterOpen` modal prop to correctly focus the first step
   */
  useEffect(() => {
    if (!modalRef.current) {
      return;
    }
    focusCurrentStep(modalRef.current);
  }, [step]);

  return (
    <Modal
      className="SaleTunnel__modal"
      isOpen={isOpen}
      onAfterOpen={(options) => {
        WebAnalyticsAPIHandler()?.sendCourseProductEvent(CourseProductEvent.OPEN_SALE_TUNNEL, key);
        if (!options) {
          return;
        }
        focusCurrentStep(options.contentEl);
      }}
      contentRef={(ref) => (modalRef.current = ref)}
      onRequestClose={() => handleModalClose(true)}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      testId="SaleTunnel__modal"
    >
      <SaleTunnelContext.Provider value={context}>
        <div className="SaleTunnel__modal-body">
          <StepBreadcrumb manifest={manifest} step={step} />
          {step === 'validation' && (
            <SaleTunnelStepValidation product={product} courseRun={courseRun} next={next} />
          )}
          {step === 'payment' && <SaleTunnelStepPayment product={product} next={next} />}
          {step === 'resume' && <SaleTunnelStepResume next={next} />}
        </div>
      </SaleTunnelContext.Provider>
    </Modal>
  );
};

export default SaleTunnel;
