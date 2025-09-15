import { ChangeEvent, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { Alert, Button, Input, VariantType } from '@openfun/cunningham-react';
import { AddressSelector } from 'components/SaleTunnel/AddressSelector';
import { PaymentScheduleGrid } from 'components/PaymentScheduleGrid';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import WithdrawRightCheckbox from 'components/SaleTunnel/WithdrawRightCheckbox';
import { PaymentSchedule, ProductType } from 'types/Joanie';
import { usePaymentPlan } from 'hooks/usePaymentPlan';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the information section',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Description of the information section',
    defaultMessage: 'Those information will be used for billing',
  },
  fullNameLabel: {
    id: 'components.SaleTunnel.Information.fullNameLabel',
    description: 'Label for the full name input',
    defaultMessage: 'Full name',
  },
  paymentSchedule: {
    id: 'components.SaleTunnel.Information.paymentSchedule',
    description: 'Title for the payment schedule section',
    defaultMessage: 'Payment schedule',
  },
  totalInfo: {
    id: 'components.SaleTunnel.Information.total.info',
    description: 'Information about the total amount',
    defaultMessage: 'You will then pay on the secured platform of our payment provider.',
  },
  totalLabel: {
    id: 'components.SaleTunnel.Information.total.label',
    description: 'Label for the total amount',
    defaultMessage: 'Total',
  },
  emailLabel: {
    id: 'components.SaleTunnel.Information.email.label',
    description: 'Label for the email',
    defaultMessage: 'Account email',
  },
  emailInfo: {
    id: 'components.SaleTunnel.Information.email.info',
    description: 'Info for the email',
    defaultMessage:
      'This email will be used to send you confirmation mails, it is the one you created your account with.',
  },
  voucherTitle: {
    id: 'components.SaleTunnel.Information.voucher.title',
    description: 'Title for the voucher',
    defaultMessage: 'Voucher code',
  },
  voucherInfo: {
    id: 'components.SaleTunnel.Information.voucher.info',
    description: 'Info for the voucher',
    defaultMessage: 'If you have a voucher code, please enter it in the field below.',
  },
  voucherValidate: {
    id: 'components.SaleTunnel.Information.voucher.validate',
    description: 'Validate text for the voucher',
    defaultMessage: 'Validate',
  },
  voucherDelete: {
    id: 'components.SaleTunnel.Information.voucher.delete',
    description: 'Delete text for the voucher',
    defaultMessage: 'Delete this voucher',
  },
  voucherError: {
    id: 'components.SaleTunnel.Information.voucher.error',
    description: 'Error when voucher is invalid',
    defaultMessage: 'The submitted voucher code is not valid.',
  },
  discount: {
    id: 'components.SaleTunnel.Information.voucher.discount',
    description: 'Discount description',
    defaultMessage: 'Discount applied',
  },
});

export const SaleTunnelInformation = () => {
  const { props, product, voucherCode, setVoucherCode } = useSaleTunnelContext();
  const [voucherError, setVoucherError] = useState(false);
  const query = usePaymentPlan({
    course_code: props.course?.code ?? props.enrollment!.course_run.course.code,
    product_id: props.product.id,
    ...(voucherCode ? { voucher_code: voucherCode } : {}),
  });
  const schedule = query.data?.payment_schedule ?? props.paymentPlan?.payment_schedule;
  const price = query.data?.price ?? props.paymentPlan?.price;
  const discountedPrice = query.data?.discounted_price ?? props.paymentPlan?.discounted_price;
  const discount = query.data?.discount ?? props.paymentPlan?.discount;

  useEffect(() => {
    if (query.error && voucherCode) {
      setVoucherCode('');
      setVoucherError(true);
    }
  }, [query.error, voucherCode, setVoucherCode]);

  return (
    <div className="sale-tunnel__main__column sale-tunnel__information">
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
        {product.type === ProductType.CREDENTIAL && schedule && (
          <PaymentScheduleBlock schedule={schedule} />
        )}
        <Voucher
          discount={discount}
          voucherError={voucherError}
          setVoucherError={setVoucherError}
        />
        <Total price={price} discountedPrice={discountedPrice} />
        <WithdrawRightCheckbox />
      </div>
    </div>
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

const Total = ({ price, discountedPrice }: { price?: number; discountedPrice?: number }) => {
  const { product } = useSaleTunnelContext();
  const totalPrice = price ?? product.price;
  return (
    <div className="sale-tunnel__total">
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>

        <div className="block-title">
          {discountedPrice ? (
            <>
              <span className="price--striked">
                <FormattedNumber
                  value={totalPrice}
                  style="currency"
                  currency={product.price_currency}
                />
              </span>
              <FormattedNumber
                value={discountedPrice}
                style="currency"
                currency={product.price_currency}
              />
            </>
          ) : (
            <FormattedNumber
              value={totalPrice}
              style="currency"
              currency={product.price_currency}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const Voucher = ({
  discount,
  voucherError,
  setVoucherError,
}: {
  discount?: string;
  voucherError: boolean;
  setVoucherError: (value: boolean) => void;
}) => {
  const intl = useIntl();
  const { voucherCode, setVoucherCode } = useSaleTunnelContext();
  const [voucher, setVoucher] = useState('');
  const handleVoucher = (e: ChangeEvent<HTMLInputElement>) => setVoucher(e.target.value);
  const submitVoucher = () => {
    setVoucherError(false);
    setVoucherCode(voucher);
    setVoucher('');
  };

  return (
    <div className="sale-tunnel__voucher">
      <div className="description">
        <h4 className="block-title mb-t">
          <FormattedMessage {...messages.voucherTitle} />
        </h4>
        <span className="mb-t">
          <FormattedMessage {...messages.voucherInfo} />
        </span>
      </div>
      <div className="form">
        <Input
          className="form-field mt-s"
          value={voucher}
          onChange={handleVoucher}
          label={intl.formatMessage(messages.voucherTitle)}
          disabled={!!voucherCode}
        />
        <Button size="small" color="primary" onClick={submitVoucher} disabled={!!voucherCode}>
          <FormattedMessage {...messages.voucherValidate} />
        </Button>
      </div>
      {voucherCode && (
        <div className="voucher-tag">
          <span>{voucherCode}</span>
          <button
            onClick={() => setVoucherCode('')}
            title={intl.formatMessage(messages.voucherDelete)}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
      )}
      {discount && (
        <div className="voucher-discount">
          <span>
            <FormattedMessage {...messages.discount} />
          </span>
          <span>{discount}</span>
        </div>
      )}
      {voucherError && (
        <Alert type={VariantType.ERROR} className="mt-s">
          <FormattedMessage {...messages.voucherError} />
        </Alert>
      )}
    </div>
  );
};

const PaymentScheduleBlock = ({ schedule }: { schedule: PaymentSchedule }) => {
  return (
    <div className="payment-schedule">
      <h4 className="block-title mb-t">
        <FormattedMessage {...messages.paymentSchedule} />
      </h4>
      <div className="mt-t">
        <PaymentScheduleGrid schedule={schedule} />
      </div>
    </div>
  );
};
