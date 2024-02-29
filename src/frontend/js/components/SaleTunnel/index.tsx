import { useEffect, useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from 'components/Modal';
import {
  CourseLight,
  Order,
  OrderGroup,
  CertificateProduct,
  CredentialProduct,
  Enrollment,
  ProductType,
} from 'types/Joanie';
import { useOmniscientOrders, useOrders } from 'hooks/useOrders';
import { IconTypeEnum } from 'components/Icon';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import { CourseProductEvent } from 'types/web-analytics';
import { Manifest, useStepManager } from 'hooks/useStepManager';
import useProductOrder from 'hooks/useProductOrder';
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

export interface SaleTunnelProps {
  isOpen: boolean;
  onClose: () => void;
  course?: CourseLight;
  enrollment?: Enrollment;
  product: CredentialProduct | CertificateProduct;
  orderGroup?: OrderGroup;
  onFinish?: (order: Order) => void;
}

const SaleTunnel = ({
  product,
  course,
  isOpen = false,
  onClose,
  enrollment,
  orderGroup,
  onFinish,
}: SaleTunnelProps) => {
  const intl = useIntl();
  const {
    methods: { refetch: refetchOmniscientOrders },
  } = useOmniscientOrders();
  const {
    methods: { invalidate: invalidateOrders },
  } = useOrders(undefined, { enabled: false });
  const key = `${product.type === ProductType.CREDENTIAL ? course!.code : enrollment!.id}+${
    product.id
  }`;
  const queryClient = useQueryClient();
  const { item: order } = useProductOrder({
    courseCode: course?.code,
    enrollmentId: enrollment?.id,
    productId: product.id,
  });

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
          queryClient.invalidateQueries({ queryKey: ['user', 'enrollments'] });
          onFinish?.(order!);
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

  const context: SaleTunnelContextType = useMemo(() => {
    if (product.type === ProductType.CREDENTIAL) {
      return {
        product: product as CredentialProduct,
        order,
        orderGroup,
        key,
        course: course!,
        enrollment: undefined,
      };
    } else {
      return {
        product: product as CertificateProduct,
        order,
        orderGroup,
        key,
        course: undefined,
        enrollment: enrollment!,
      };
    }
  }, [product, order]);

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
          {step === 'validation' && <SaleTunnelStepValidation next={next} />}
          {step === 'payment' && <SaleTunnelStepPayment next={next} />}
          {step === 'resume' && <SaleTunnelStepResume next={next} />}
        </div>
      </SaleTunnelContext.Provider>
    </Modal>
  );
};

export default SaleTunnel;
