import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import { usePaymentSchedule } from 'hooks/usePaymentSchedule';
import { Spinner } from 'components/Spinner';
import WithdrawRightCheckbox from 'components/SaleTunnel/WithdrawRightCheckbox';
import { ProductType } from 'types/Joanie';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.InformationSingular.title',
    description: 'Title for the information section (B2C)',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.InformationSingular.description',
    description: 'Description of the information section (B2C)',
    defaultMessage: 'Those information will be used for billing',
  },
  fullNameLabel: {
    id: 'components.SaleTunnel.InformationSingular.fullNameLabel',
    description: 'Label for the full name input',
    defaultMessage: 'Full name',
  },
  paymentSchedule: {
    id: 'components.SaleTunnel.InformationSingular.paymentSchedule',
    description: 'Title for the payment schedule section',
    defaultMessage: 'Payment schedule',
  },
  totalLabel: {
    id: 'components.SaleTunnel.InformationSingular.total.label',
    description: 'Label for the total amount',
    defaultMessage: 'Total',
  },
  emailLabel: {
    id: 'components.SaleTunnel.InformationSingular.email.label',
    description: 'Label for the email',
    defaultMessage: 'Account email',
  },
  emailInfo: {
    id: 'components.SaleTunnel.InformationSingular.email.info',
    description: 'Info for the email',
    defaultMessage:
      'This email will be used to send you confirmation mails, it is the one you created your account with.',
  },
});

export const SaleTunnelInformationSingular = () => {
  const { product } = useSaleTunnelContext();

  return (
    <>
      <div>
        <h3 className="block-title mb-t">
          <FormattedMessage {...messages.title} />
        </h3>
        <div className="description mb-s">
          <FormattedMessage {...messages.description} />
        </div>
        <OpenEdxFullNameForm />
        <AddressSelector />
        <div className="mt-s">
          <Email />
        </div>
      </div>
      <div>
        {product.type === ProductType.CREDENTIAL && <PaymentScheduleBlock />}
        <Total />
        <WithdrawRightCheckbox />
      </div>
    </>
  );
};

const Email = () => {
  const { user } = useSession();
  const { data: openEdxProfileData } = useOpenEdxProfile({
    username: user!.username,
  });

  return (
    <div className="sale-tunnel__email">
      <div className="sale-tunnel__email__top">
        <h4>
          <FormattedMessage {...messages.emailLabel} />
        </h4>
        <div className="fw-bold">{openEdxProfileData?.email}</div>
      </div>
      <div className="sale-tunnel__email__description">
        <FormattedMessage {...messages.emailInfo} />
      </div>
    </div>
  );
};

const Total = () => {
  const { product, offering, enrollment } = useSaleTunnelContext();
  const totalPrice =
    enrollment?.offerings?.[0]?.rules?.discounted_price ??
    offering?.rules.discounted_price ??
    product.price;

  return (
    <div className="sale-tunnel__total">
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>
        <div className="block-title">
          <FormattedNumber value={totalPrice} style="currency" currency={product.price_currency} />
        </div>
      </div>
    </div>
  );
};

const PaymentScheduleBlock = () => {
  const { props } = useSaleTunnelContext();
  const query = usePaymentSchedule({
    course_code: props.course?.code || props.enrollment!.course_run.course.code,
    product_id: props.product.id,
  });

  if (!query.data || query.isLoading) {
    return <Spinner size="large" />;
  }

  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">
        <FormattedMessage {...messages.paymentSchedule} />
      </h4>
      <div className="mt-t">
        <PaymentScheduleGrid schedule={query.data} />
      </div>
    </div>
  );
};
