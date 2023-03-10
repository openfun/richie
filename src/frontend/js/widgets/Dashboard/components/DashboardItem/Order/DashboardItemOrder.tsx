import { FormattedMessage, useIntl } from 'react-intl';
import { Icon } from 'components/Icon';
import { Order, OrderState } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { CoursesHelper } from 'utils/CoursesHelper';
import { useProduct } from 'hooks/useProduct';
import { DashboardSubItem } from '../DashboardSubItem';
import { DashboardPaths, getDashboardRoutePath } from '../../../utils/routers';
import { RouterButton } from '../../RouterButton';
import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem, DEMO_IMAGE_URL } from '../index';

const messages = {
  accessCourse: {
    id: 'components.DashboardItemOrder.gotoCourse',
    description: 'Button that redirects to the order details',
    defaultMessage: 'View details',
  },
  statusOnGoing: {
    id: 'components.DashboardItemOrder.statusOnGoing',
    description:
      "Status shown on the dashboard order' item when order is validated with no certificate",
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.DashboardItemOrder.statusCompleted',
    description:
      "Status shown on the dashboard order' item when order is validated with certificate",
    defaultMessage: 'Completed',
  },
  statusOther: {
    id: 'components.DashboardItemOrder.statusOther',
    description: "Status shown on the dashboard order' item when order is not validated",
    defaultMessage: '{state}',
  },
};

interface DashboardItemOrderProps {
  order: Order;
  showDetailsButton?: boolean;
  writable?: boolean;
}

export const DashboardItemOrder = ({
  order,
  showDetailsButton = true,
  writable,
}: DashboardItemOrderProps) => {
  const { course } = order;
  if (!course) {
    throw new Error('Order must provide course object attribute.');
  }
  const intl = useIntl();
  const product = useProduct(order.product, { course });
  const getRoutePath = getDashboardRoutePath(useIntl());

  return (
    <DashboardItem
      data-testid={`dashboard-item-order-${order.id}`}
      title={product.item?.title ?? ''}
      code={'Ref. ' + course}
      imageUrl={DEMO_IMAGE_URL}
      footer={
        <div className="dashboard-item-order__footer">
          <div className="dashboard-item__block__status">
            <Icon name="icon-school" />
            <div>
              {order.state === OrderState.VALIDATED && !order.certificate && (
                <FormattedMessage {...messages.statusOnGoing} />
              )}
              {order.state === OrderState.VALIDATED && !!order.certificate && (
                <FormattedMessage {...messages.statusCompleted} />
              )}
              {order.state !== OrderState.VALIDATED && (
                <FormattedMessage
                  {...messages.statusOther}
                  values={{ state: StringHelper.capitalizeFirst(order.state) }}
                />
              )}
            </div>
          </div>
          {showDetailsButton && (
            <RouterButton
              color="transparent-darkest"
              href={getRoutePath(DashboardPaths.ORDER, { orderId: order.id })}
              data-testid="dashboard-item-order__button"
            >
              {intl.formatMessage(messages.accessCourse)}
            </RouterButton>
          )}
        </div>
      }
    >
      <DashboardSubItemsList
        subItems={order.target_courses?.map((targetCourse) => (
          <DashboardSubItem
            title={targetCourse.title}
            footer={
              <DashboardItemCourseEnrolling
                writable={writable}
                course={targetCourse}
                order={order}
                activeEnrollment={CoursesHelper.findActiveCourseEnrollmentInOrder(
                  targetCourse,
                  order,
                )}
                notEnrolledUrl={getRoutePath(DashboardPaths.ORDER, { orderId: order.id })}
              />
            }
          />
        ))}
      />
    </DashboardItem>
  );
};
