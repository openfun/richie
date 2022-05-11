import { Fragment, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'components/Modal';
import { SaleTunnelStepPayment } from 'components/SaleTunnelStepPayment';
import { SaleTunnelStepResume } from 'components/SaleTunnelStepResume';
import { SaleTunnelStepValidation } from 'components/SaleTunnelStepValidation';
import { StepBreadcrumb } from 'components/StepBreadcrumb';
import { Manifest, useStepManager } from 'hooks/useStepManager';
import { useSession } from 'data/SessionProvider';
import { useCourseCode } from 'data/CourseCodeProvider';
import { useCourse } from 'hooks/useCourse';
import { useOrders } from 'hooks/useOrders';
import type * as Joanie from 'types/Joanie';

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
  loginToPurchase: {
    defaultMessage: 'Login to purchase {product}',
    description: "Label displayed inside the product's CTA when user is not logged in",
    id: 'components.SaleTunnel.loginToPurchase',
  },
  callToActionDescription: {
    defaultMessage: 'Purchase {product}',
    description:
      'Additional description announced by screen readers when focusing the call to action buying button',
    id: 'components.SaleTunnel.callToActionDescription',
  },
});

interface SaleTunnelProps {
  product: Joanie.Product;
}

type TunnelSteps = 'validation' | 'payment' | 'resume';

const SaleTunnel = ({ product }: SaleTunnelProps) => {
  const intl = useIntl();
  const manifest: Manifest<TunnelSteps, 'resume'> = {
    start: 'validation',
    steps: {
      validation: {
        icon: 'icon-checklist',
        label: intl.formatMessage(messages.stepValidation),
        next: 'payment',
      },
      payment: {
        icon: 'icon-creditCard',
        label: intl.formatMessage(messages.stepPayment),
        next: 'resume',
      },
      resume: {
        icon: 'icon-check',
        label: intl.formatMessage(messages.stepResume),
        next: null,
        onExit: () => {
          course.methods.refetch();
          orders.methods.refetch();
          handleModalClose();
        },
      },
    },
  };
  const { step, next, reset } = useStepManager(manifest);
  const { user, login } = useSession();
  const courseCode = useCourseCode();
  const course = useCourse(courseCode);
  const orders = useOrders();
  const [isOpen, setIsOpen] = useState(false);

  const handleModalClose = () => {
    reset();
    setIsOpen(false);
  };

  if (!user) {
    return (
      <button className="product-item__cta" onClick={login}>
        <FormattedMessage
          {...messages.loginToPurchase}
          values={{ product: <span className="offscreen">&quot;{product.title}&quot;</span> }}
        />
      </button>
    );
  }

  return (
    <Fragment>
      <button
        className="product-item__cta"
        onClick={() => setIsOpen(true)}
        // so that the button is explicit on its own, we add a description that doesn't
        // rely on the text coming from the CMS
        // eslint-disable-next-line jsx-a11y/aria-props
        aria-description={intl.formatMessage(messages.callToActionDescription, {
          product: product.title,
        })}
      >
        {product.call_to_action}
      </button>
      <Modal
        className="SaleTunnel__modal"
        isOpen={isOpen}
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
    </Fragment>
  );
};

export default SaleTunnel;
