import {
  OrderDetails,
  OrderDetailsProps,
} from 'pages/DashboardOrderLayout/components/OrderDetails';

interface OrderListItemProps extends OrderDetailsProps {}

// TODO: For now this component is an alias of OrderDetails
// extract the list part of it here.
const OrderListItem = (props: OrderListItemProps) => {
  return <OrderDetails {...props} />;
};

export default OrderListItem;
