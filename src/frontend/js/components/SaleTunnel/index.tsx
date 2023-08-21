import { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Modal } from 'components/Modal';
import type * as Joanie from 'types/Joanie';
import { useOmniscientOrders } from 'hooks/useOrders';
import { IconTypeEnum } from 'components/Icon';
import { Manifest, useStepManager } from 'hooks/useStepManager';
import { SaleTunnelStepValidation } from './components/SaleTunnelStepValidation';
import { SaleTunnelStepPayment } from './components/SaleTunnelStepPayment';
import { SaleTunnelStepResume } from './components/SaleTunnelStepResume';
import { StepBreadcrumb } from './components/StepBreadcrumb';

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
  product: Joanie.Product;
  isOpen: boolean;
  onClose: () => void;
};

const SaleTunnel = ({ product, isOpen = false, onClose }: Props) => {
  const intl = useIntl();
  const { methods: ordersMethods } = useOmniscientOrders();

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
      },
      resume: {
        icon: IconTypeEnum.CHECK,
        label: intl.formatMessage(messages.stepResume),
        next: null,
        onExit: () => {
          // Once the user has completed the purchase, we need to refetch the orders
          // to update the ordersQuery cache
          ordersMethods.refetch();
          handleModalClose();
        },
      },
    },
  };
  const { step, next, reset } = useStepManager(manifest);

  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleModalClose = () => {
    reset();
    onClose();
  };

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
        if (!options) {
          return;
        }
        focusCurrentStep(options.contentEl);
      }}
      contentRef={(ref) => (modalRef.current = ref)}
      onRequestClose={handleModalClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      testId="SaleTunnel__modal"
    >
      <div className="SaleTunnel__modal-body">
        <StepBreadcrumb manifest={manifest} step={step} />
        {step === 'validation' && <SaleTunnelStepValidation product={product} next={next} />}
        {step === 'payment' && <SaleTunnelStepPayment product={product} next={next} />}
        {step === 'resume' && <SaleTunnelStepResume next={next} />}
      </div>
    </Modal>
  );
};

export default SaleTunnel;
