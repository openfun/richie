import { FormattedMessage, defineMessages } from 'react-intl';
import PurchaseButton from 'components/PurchaseButton';
import { Offering, CredentialProduct } from 'types/Joanie';
import { PacedCourse } from 'types';

const messages = defineMessages({
  noSeatsAvailable: {
    defaultMessage: 'Sorry, no seats available for now',
    description: 'Message displayed when no seats are available for the product',
    id: 'components.CourseProductItem.noSeatsAvailable',
  },
  nbSeatsAvailable: {
    defaultMessage: `{
nb,
plural,
=0 {No remaining seat}
one {Last remaining seat!}
other {# remaining seats}
}`,
    description: 'Message displayed when seats are available for the product',
    id: 'components.CourseProductItem.nbSeatsAvailable',
  },
});

interface CourseProductItemFooterProps {
  course: PacedCourse;
  offering: Offering;
  canPurchase: boolean;
}

const CourseProductItemFooter = ({
  course,
  offering,
  canPurchase,
}: CourseProductItemFooterProps) => {
  if (!offering.rules.has_seats_left)
    return (
      <p className="product-widget__footer__message">
        <FormattedMessage {...messages.noSeatsAvailable} />
      </p>
    );
  return (
    <div className="product-widget__footer__order-group">
      <PurchaseButton
        course={course}
        product={offering.product as CredentialProduct}
        offering={offering}
        organizations={offering.organizations}
        isWithdrawable={offering.is_withdrawable}
        disabled={!canPurchase}
        buttonProps={{ fullWidth: true }}
      />
      {offering.rules.has_seat_limit && (
        <p className="product-widget__footer__message">
          <FormattedMessage
            {...messages.nbSeatsAvailable}
            values={{ nb: offering.rules.nb_available_seats }}
          />
        </p>
      )}
    </div>
  );
};
export default CourseProductItemFooter;
