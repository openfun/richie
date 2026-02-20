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
import { HttpError } from 'utils/errors/HttpError';
import { APIBackend, KeycloakAccountApi } from 'types/api';
import context from 'utils/context';
import { AuthenticationApi } from 'api/authentication';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Information.title',
    description: 'Title for the information section',
    defaultMessage: 'Information',
  },
  description: {
    id: 'components.SaleTunnel.Information.description',
    description: 'Description of the information section',
    defaultMessage: 'This information will be used for billing',
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
  keycloakUsernameLabel: {
    id: 'components.SaleTunnel.Information.keycloak.account.label',
    description: 'Label for the name',
    defaultMessage: 'Account name',
  },
  keycloakUsernameInfo: {
    id: 'components.SaleTunnel.Information.keycloak.account.info',
    description: 'Info for the name',
    defaultMessage: 'This name will be used in legal documents.',
  },
  keycloakEmailInfo: {
    id: 'components.SaleTunnel.Information.keycloak.email.info',
    description: 'Info for the email',
    defaultMessage: 'This email will be used to send you confirmation mails.',
  },
  keycloakAccountLinkInfo: {
    id: 'components.SaleTunnel.Information.keycloak.updateLinkInfo',
    description: 'Text before the keycloak account update link',
    defaultMessage: 'If any of the information above is incorrect,',
  },
  keycloakAccountLinkLabel: {
    id: 'components.SaleTunnel.Information.keycloak.updateLinkLabel',
    description: 'Label of the keycloak link to update account',
    defaultMessage: 'please update your account',
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
  voucherErrorInvalid: {
    id: 'components.SaleTunnel.Information.voucher.errorInvalid',
    description: 'Error when voucher is invalid',
    defaultMessage: 'The submitted voucher code is not valid.',
  },
  voucherErrorTooManyRequests: {
    id: 'components.SaleTunnel.Information.voucher.errorTooManyRequests',
    description: 'Error when user has tried too many vouchers',
    defaultMessage: 'Too many attempts. Please try again later.',
  },
  discount: {
    id: 'components.SaleTunnel.Information.voucher.discount',
    description: 'Discount description',
    defaultMessage: 'Discount applied',
  },
  noPaymentSchedule: {
    id: 'components.SaleTunnel.Information.noPaymentSchedule',
    description: 'Message displayed representing the payment schedule when the order is free.',
    defaultMessage: 'No payment required. This order is fully covered.',
  },
  noBillingInformation: {
    id: 'components.SaleTunnel.Information.noBillingInformation',
    description: 'Message displayed when the order is part of a batch order',
    defaultMessage: 'No billing information required. This order is covered by your organization.',
  },
});

export const SaleTunnelInformationSingular = () => {
  const {
    props,
    product,
    voucherCode,
    setVoucherCode,
    setSchedule,
    needsPayment,
    setNeedsPayment,
  } = useSaleTunnelContext();
  const [voucherError, setVoucherError] = useState<HttpError | null>(null);
  const query = usePaymentPlan({
    course_code: props.course?.code ?? props.enrollment!.course_run.course.code,
    product_id: props.product.id,
    ...(voucherCode ? { voucher_code: voucherCode } : {}),
  });
  const schedule = query.data?.payment_schedule ?? props.paymentPlan?.payment_schedule;
  const price = query.data?.price ?? props.paymentPlan?.price;
  const discountedPrice = query.data?.discounted_price ?? props.paymentPlan?.discounted_price;
  const discount = query.data?.discount ?? props.paymentPlan?.discount;
  const fromBatchOrder = query.data?.from_batch_order ?? props.paymentPlan?.from_batch_order;

  const showPaymentSchedule =
    product.type === ProductType.CREDENTIAL &&
    schedule &&
    (discountedPrice != null ? discountedPrice > 0 : price != null && price > 0);

  useEffect(() => {
    if (schedule) {
      setSchedule(schedule);
    }
  }, [schedule, setSchedule]);

  useEffect(() => {
    if (query.error && voucherCode) {
      setVoucherCode('');
      setVoucherError(query.error);
    }
  }, [query.error, voucherCode, setVoucherCode]);

  useEffect(() => {
    setNeedsPayment(!fromBatchOrder);
  }, [fromBatchOrder, setNeedsPayment]);

  const isKeycloakBackend = context?.authentication.backend === APIBackend.KEYCLOAK;

  return (
    <>
      {needsPayment && (
        <div>
          <h3 className="block-title mb-t">
            <FormattedMessage {...messages.title} />
          </h3>
          <div className="description mb-s">
            <FormattedMessage {...messages.description} />
          </div>
          {isKeycloakBackend ? (
            <KeycloakAccountEdit />
          ) : (
            <>
              <OpenEdxFullNameForm />
              <div className="mt-s">
                <Email />
              </div>
            </>
          )}
          <AddressSelector />
        </div>
      )}
      {!needsPayment && (
        <div>
          <h3 className="block-title">
            <FormattedMessage {...messages.title} />
          </h3>
          <Alert type={VariantType.NEUTRAL}>
            <FormattedMessage {...messages.noBillingInformation} />
          </Alert>
        </div>
      )}
      <div>
        {showPaymentSchedule ? (
          <PaymentScheduleBlock schedule={schedule!} />
        ) : (
          <div>
            <h4 className="block-title">
              <FormattedMessage {...messages.paymentSchedule} />
            </h4>
            <Alert type={VariantType.NEUTRAL}>
              <FormattedMessage {...messages.noPaymentSchedule} />
            </Alert>
          </div>
        )}
        <Voucher
          discount={discount}
          voucherError={voucherError}
          setVoucherError={setVoucherError}
        />
        <Total price={price} discountedPrice={discountedPrice} />
        {needsPayment && <WithdrawRightCheckbox />}
      </div>
    </>
  );
};

const KeycloakAccountEdit = () => {
  const accountApi = AuthenticationApi!.account as KeycloakAccountApi;
  const { user } = useSession();

  return (
    <>
      <div className="mt-s">
        <div className="sale-tunnel__username">
          <div className="sale-tunnel__username__top">
            <h4>
              <FormattedMessage {...messages.keycloakUsernameLabel} />
            </h4>
            <div className="fw-bold">{user?.username}</div>
          </div>
          <div className="sale-tunnel__username__description">
            <FormattedMessage {...messages.keycloakUsernameInfo} />
          </div>
        </div>
      </div>
      <div className="mt-s">
        <div className="sale-tunnel__email">
          <div className="sale-tunnel__email__top">
            <h4>
              <FormattedMessage {...messages.emailLabel} />
            </h4>
            <div className="fw-bold">{user?.email}</div>
          </div>
          <div className="sale-tunnel__email__description">
            <FormattedMessage {...messages.keycloakEmailInfo} />
          </div>
        </div>
      </div>
      <div className="mt-s">
        <div className="sale-tunnel__account-link">
          <FormattedMessage {...messages.keycloakAccountLinkInfo} />{' '}
          <a href={accountApi.updateUrl()}>
            <FormattedMessage {...messages.keycloakAccountLinkLabel} />
          </a>
          .
        </div>
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

const Total = ({ price, discountedPrice }: { price?: number; discountedPrice?: number }) => {
  const { product } = useSaleTunnelContext();
  const totalPrice = price || product.price;
  return (
    <div className="sale-tunnel__total">
      <div className="sale-tunnel__total__amount mt-t" data-testid="sale-tunnel__total__amount">
        <div className="block-title">
          <FormattedMessage {...messages.totalLabel} />
        </div>

        <div className="block-title">
          {discountedPrice !== undefined ? (
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
  voucherError: HttpError | null;
  setVoucherError: (value: HttpError | null) => void;
}) => {
  const intl = useIntl();
  const { voucherCode, setVoucherCode } = useSaleTunnelContext();
  const [voucher, setVoucher] = useState('');
  const handleVoucher = (e: ChangeEvent<HTMLInputElement>) => setVoucher(e.target.value);
  const submitVoucher = () => {
    setVoucherError(null);
    setVoucherCode(voucher);
    setVoucher('');
  };

  return (
    <div className="sale-tunnel__voucher">
      <div className="description">
        <h4 className="block-title mb-t">
          <FormattedMessage {...messages.voucherTitle} />
        </h4>
        {!voucherCode && (
          <span className="mb-t">
            <FormattedMessage {...messages.voucherInfo} />
          </span>
        )}
      </div>
      {!voucherCode && (
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
      )}
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
          {voucherError.code === 429 ? (
            <FormattedMessage {...messages.voucherErrorTooManyRequests} />
          ) : (
            <FormattedMessage {...messages.voucherErrorInvalid} />
          )}
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
