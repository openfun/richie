import { FormattedMessage, defineMessages } from 'react-intl';
import PurchaseButton from 'components/PurchaseButton';
import { Offer, CredentialProduct } from 'types/Joanie';
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
  offer: Offer;
  canPurchase: boolean;
}

const CourseProductItemFooter = ({ course, offer, canPurchase }: CourseProductItemFooterProps) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { seats, nb_seats_available } = offer;
  const hasSeatsLimit = seats && nb_seats_available !== undefined;
  const hasNoSeatsAvailable = hasSeatsLimit && nb_seats_available === 0;
  if (hasNoSeatsAvailable)
    return (
      <p className="product-widget__footer__message">
        <FormattedMessage {...messages.noSeatsAvailable} />
      </p>
    );
  return (
    <div className="product-widget__footer__order-group">
      <PurchaseButton
        course={course}
        product={offer.product as CredentialProduct}
        offer={offer}
        organizations={offer.organizations}
        isWithdrawable={offer.is_withdrawable}
        disabled={!canPurchase}
        buttonProps={{ fullWidth: true }}
      />
      {hasSeatsLimit && (
        <p className="product-widget__footer__message">
          <FormattedMessage
            {...messages.nbSeatsAvailable}
            values={{ nb: offer.nb_seats_available }}
          />
        </p>
      )}
    </div>
  );
};
export default CourseProductItemFooter;
