import c from 'classnames';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button, ButtonProps, useModal } from '@openfun/cunningham-react';
import { useSession } from 'contexts/SessionContext';
import * as Joanie from 'types/Joanie';
import { SaleTunnel, SaleTunnelProps } from 'components/SaleTunnel';
import { CourseLight, Organization } from 'types/Joanie';
import { PacedCourse } from 'types';
import { ProductHelper } from 'utils/ProductHelper';

const messages = defineMessages({
  loginToPurchase: {
    defaultMessage: 'Login to purchase {product}',
    description: "Label displayed inside the product's CTA when user is not logged in",
    id: 'components.SaleTunnel.loginToPurchase',
  },
  noCourseRunToPurchaseCredential: {
    defaultMessage:
      'At least one course has no course runs. This product is not currently available for sale.',
    description: "Label displayed below the product's CTA when there is no courseRun",
    id: 'components.SaleTunnel.noCourseRunToPurchaseCredential',
  },
  noCourseRunToPurchaseCertificate: {
    defaultMessage:
      'The course run is not active. This product is not currently available for sale.',
    description: "Label displayed below the product's CTA when there is no courseRun",
    id: 'components.SaleTunnel.noCourseRunToPurchaseCertificate',
  },
  noRemainingOrder: {
    defaultMessage: 'There are no more places available for this product.',
    description:
      "Label displayed below the product's CTA when there is no remaining available seat for the product",
    id: 'components.SaleTunnel.noRemainingOrder',
  },
  callToActionDescription: {
    defaultMessage: 'Purchase {product}',
    description:
      'Additional description announced by screen readers when focusing the call to action buying button',
    id: 'components.SaleTunnel.callToActionDescription',
  },
});

interface PurchaseButtonPropsBase {
  product: Joanie.CredentialProduct | Joanie.CertificateProduct;
  orderGroup?: Joanie.OrderGroup;
  isWithdrawable: boolean;
  disabled?: boolean;
  className?: string;
  buttonProps?: ButtonProps;
  onFinish?: SaleTunnelProps['onFinish'];
  organizations?: Organization[];
}

interface CredentialPurchaseButtonProps extends PurchaseButtonPropsBase {
  product: Joanie.CredentialProduct;
  course: PacedCourse | CourseLight;
  enrollment?: undefined;
}

interface CertificatePurchaseButtonProps extends PurchaseButtonPropsBase {
  product: Joanie.CertificateProduct;
  course?: undefined;
  enrollment: Joanie.Enrollment;
}

const PurchaseButton = ({
  product,
  course,
  enrollment,
  orderGroup,
  isWithdrawable,
  organizations,
  disabled = false,
  className,
  buttonProps,
  onFinish,
}: CredentialPurchaseButtonProps | CertificatePurchaseButtonProps) => {
  const intl = useIntl();
  const { user, login } = useSession();

  const hasOpenedTargetCourse = ProductHelper.hasOpenedTargetCourse(product, enrollment);
  const hasRemainingSeat = ProductHelper.hasRemainingSeats(product);
  const isPurchasable = hasRemainingSeat && hasOpenedTargetCourse;

  const saleTunnelModal = useModal({
    isOpenDefault: false,
  });

  if (!user) {
    return (
      <Button fullWidth onClick={login}>
        <FormattedMessage
          {...messages.loginToPurchase}
          values={{ product: <span className="offscreen">&quot;{product.title}&quot;</span> }}
        />
      </Button>
    );
  }

  return (
    <>
      {!disabled && (
        <>
          <Button
            data-testid="PurchaseButton__cta"
            className={c('purchase-button__cta', className)}
            onClick={() => {
              if (hasOpenedTargetCourse) {
                saleTunnelModal.open();
              }
            }}
            // so that the button is explicit on its own, we add a description that doesn't
            // rely on the text coming from the CMS
            /* eslint-disable-next-line jsx-a11y/aria-props */
            aria-description={intl.formatMessage(messages.callToActionDescription, {
              product: product.title,
            })}
            disabled={!isPurchasable}
            {...buttonProps}
          >
            {product.call_to_action}
          </Button>
          {!hasOpenedTargetCourse && (
            <p className="purchase-button__no-course-run">
              <FormattedMessage
                {...(product.type === Joanie.ProductType.CREDENTIAL
                  ? messages.noCourseRunToPurchaseCredential
                  : messages.noCourseRunToPurchaseCertificate)}
              />
            </p>
          )}
          {hasOpenedTargetCourse && !hasRemainingSeat && (
            <p className="purchase-button__no-course-run">
              <FormattedMessage {...messages.noRemainingOrder} />
            </p>
          )}
        </>
      )}
      <SaleTunnel
        {...saleTunnelModal}
        product={product}
        organizations={organizations}
        enrollment={enrollment}
        orderGroup={orderGroup}
        course={course}
        isWithdrawable={isWithdrawable}
        onFinish={onFinish}
      />
    </>
  );
};

export default PurchaseButton;
