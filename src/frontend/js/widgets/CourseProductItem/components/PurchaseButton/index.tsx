import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useMemo, useState } from 'react';
import { useSession } from 'contexts/SessionContext';
import * as Joanie from 'types/Joanie';
import { Priority } from 'types';
import SaleTunnel from '../SaleTunnel';

const messages = defineMessages({
  loginToPurchase: {
    defaultMessage: 'Login to purchase {product}',
    description: "Label displayed inside the product's CTA when user is not logged in",
    id: 'components.SaleTunnel.loginToPurchase',
  },
  noCourseRunToPurchase: {
    defaultMessage:
      'At least one course has no course runs, this product is not currently available for sale',
    description: "Label displayed below the product's CTA when there is no courseRun",
    id: 'components.SaleTunnel.noCourseRunToPurchase',
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
  disabled: boolean;
}

const PurchaseButton = ({ product, disabled }: PurchaseButtonProps) => {
  const intl = useIntl();
  const { user, login } = useSession();
  const [isSaleTunnelOpen, setIsSaleTunnelOpen] = useState(false);

  const isOpenedCourseRun = (courseRun: Joanie.CourseRun) =>
    courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN;

  const hasAtLeastOneCourseRun = useMemo(() => {
    return (
      product.target_courses.length > 0 &&
      !product.target_courses.some(({ course_runs }) => !course_runs.some(isOpenedCourseRun))
    );
  }, [product]);

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

  const hasAtLeastOneRemainingOrder =
    typeof product?.remaining_order_count !== 'number' || product.remaining_order_count > 0;
  const isPurchasable = hasAtLeastOneRemainingOrder && hasAtLeastOneCourseRun;

  return (
    <>
      {!disabled && (
        <>
          {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
          <button
            data-testid="PurchaseButton__cta"
            className="product-item__cta"
            onClick={() => hasAtLeastOneCourseRun && setIsSaleTunnelOpen(true)}
            // so that the button is explicit on its own, we add a description that doesn't
            // rely on the text coming from the CMS
            aria-description={intl.formatMessage(messages.callToActionDescription, {
              product: product.title,
            })}
            disabled={!isPurchasable}
          >
            {product.call_to_action}
          </button>
          {!hasAtLeastOneCourseRun && (
            <p className="product-item__no-course-run">
              <FormattedMessage {...messages.noCourseRunToPurchase} />
            </p>
          )}
          {hasAtLeastOneCourseRun && !hasAtLeastOneRemainingOrder && (
            <p className="product-item__no-course-run">
              <FormattedMessage {...messages.noRemainingOrder} />
            </p>
          )}
        </>
      )}
      <SaleTunnel
        isOpen={isSaleTunnelOpen}
        product={product}
        onClose={() => setIsSaleTunnelOpen(false)}
      />
    </>
  );
};

export default PurchaseButton;
