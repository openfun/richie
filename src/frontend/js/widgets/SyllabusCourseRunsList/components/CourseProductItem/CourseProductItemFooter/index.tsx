import { FormattedMessage, defineMessages } from 'react-intl';
import PurchaseButton from 'components/PurchaseButton';
import { CourseProductRelation, CredentialProduct, OrderGroup } from 'types/Joanie';
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
  courseProductRelation: CourseProductRelation;
  canPurchase: boolean;
  orderGroups: OrderGroup[];
  orderGroupsAvailable: OrderGroup[];
}

const CourseProductItemFooter = ({
  course,
  courseProductRelation,
  orderGroups,
  orderGroupsAvailable,
  canPurchase,
}: CourseProductItemFooterProps) => {
  if (orderGroups.length === 0) {
    return (
      <PurchaseButton
        course={course}
        product={courseProductRelation.product as CredentialProduct}
        organizations={courseProductRelation.organizations}
        isWithdrawable={courseProductRelation.is_withdrawable}
        disabled={!canPurchase}
        buttonProps={{ fullWidth: true }}
      />
    );
  }
  if (orderGroupsAvailable.length === 0) {
    return (
      <p className="product-widget__footer__message">
        <FormattedMessage {...messages.noSeatsAvailable} />
      </p>
    );
  }
  return orderGroupsAvailable.map((orderGroup) => (
    <div className="product-widget__footer__order-group" key={orderGroup.id}>
      <PurchaseButton
        course={course}
        product={courseProductRelation.product as CredentialProduct}
        organizations={courseProductRelation.organizations}
        isWithdrawable={courseProductRelation.is_withdrawable}
        disabled={!canPurchase}
        orderGroup={orderGroup}
        buttonProps={{ fullWidth: true }}
      />
      <p className="product-widget__footer__message">
        <FormattedMessage
          {...messages.nbSeatsAvailable}
          values={{ nb: orderGroup.nb_available_seats }}
        />
      </p>
    </div>
  ));
};
export default CourseProductItemFooter;
