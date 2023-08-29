import c from 'classnames';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useMemo, useState } from 'react';
import { Button } from '@openfun/cunningham-react';
import { useSession } from 'contexts/SessionContext';
import * as Joanie from 'types/Joanie';
import SaleTunnel from 'components/SaleTunnel';
import { isOpenedCourseRunCertificate, isOpenedCourseRunCredential } from 'utils/CourseRuns';

const messages = defineMessages({
  loginToPurchase: {
    defaultMessage: 'Login to purchase {product}',
    description: "Label displayed inside the product's CTA when user is not logged in",
    id: 'components.SaleTunnel.loginToPurchase',
  },
  noCourseRunToPurchaseCredential: {
    defaultMessage:
      'At least one course has no course runs, this product is not currently available for sale',
    description: "Label displayed below the product's CTA when there is no courseRun",
    id: 'components.SaleTunnel.noCourseRunToPurchaseCredential',
  },
  noCourseRunToPurchaseCertificate: {
    defaultMessage:
      'The course run is not active, this product is not currently available for sale',
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

interface PurchaseButtonProps {
  product: Joanie.Product;
  courseRun?: Joanie.CourseRun;
  disabled?: boolean;
  className?: string;
}

const PurchaseButton = ({
  product,
  courseRun,
  disabled = false,
  className,
}: PurchaseButtonProps) => {
  const intl = useIntl();
  const { user, login } = useSession();
  const [isSaleTunnelOpen, setIsSaleTunnelOpen] = useState(false);

  const hasAtLeastOneCourseRun = useMemo(() => {
    if (product.type === Joanie.ProductType.CERTIFICATE) {
      if (!courseRun) {
        throw new Error(
          'Unable to instanciate PurchaseButton with a product CERTIFICATE without the according CourseRun.',
        );
      }
      return isOpenedCourseRunCertificate(courseRun.state);
    }
    return (
      product.target_courses.length > 0 &&
      product.target_courses.every(({ course_runs }) =>
        course_runs.some((targetCourseRun) => isOpenedCourseRunCredential(targetCourseRun.state)),
      )
    );
  }, [product]);

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

  const hasAtLeastOneRemainingOrder =
    typeof product?.remaining_order_count !== 'number' || product.remaining_order_count > 0;
  const isPurchasable = hasAtLeastOneRemainingOrder && hasAtLeastOneCourseRun;

  return (
    <>
      {!disabled && (
        <>
          <Button
            data-testid="PurchaseButton__cta"
            className={c('purchase-button__cta', className)}
            onClick={() => hasAtLeastOneCourseRun && setIsSaleTunnelOpen(true)}
            // so that the button is explicit on its own, we add a description that doesn't
            // rely on the text coming from the CMS
            /* eslint-disable-next-line jsx-a11y/aria-props */
            aria-description={intl.formatMessage(messages.callToActionDescription, {
              product: product.title,
            })}
            disabled={!isPurchasable}
          >
            {product.call_to_action}
          </Button>
          {!hasAtLeastOneCourseRun && (
            <p className="purchase-button__no-course-run">
              <FormattedMessage
                {...(product.type === Joanie.ProductType.CREDENTIAL
                  ? messages.noCourseRunToPurchaseCredential
                  : messages.noCourseRunToPurchaseCertificate)}
              />
            </p>
          )}
          {hasAtLeastOneCourseRun && !hasAtLeastOneRemainingOrder && (
            <p className="purchase-button__no-course-run">
              <FormattedMessage {...messages.noRemainingOrder} />
            </p>
          )}
        </>
      )}
      <SaleTunnel
        isOpen={isSaleTunnelOpen}
        product={product}
        courseRun={courseRun}
        onClose={() => setIsSaleTunnelOpen(false)}
      />
    </>
  );
};

export default PurchaseButton;
