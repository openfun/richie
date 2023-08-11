import { FormattedMessage, useIntl } from 'react-intl';
import { CourseLight, Order, OrderState, Product } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { StringHelper } from 'utils/StringHelper';
import { CoursesHelper } from 'utils/CoursesHelper';
import { useCertificate } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { RouterButton } from '../../RouterButton';
import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem } from '../index';

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
  loadingCertificate: {
    id: 'components.DashboardItemOrder.loadingCertificate',
    description: 'Accessible label displayed while certificate is being fetched on the dashboard.',
    defaultMessage: 'Loading certificate...',
  },
};

interface DashboardItemOrderProps {
  order: Order;
  showDetailsButton?: boolean;
  showCertificate?: boolean;
  writable?: boolean;
}

interface DashboardItemOrderCertificateProps {
  order: Order;
  product: Product;
}

const DashboardItemOrderCertificate = ({ order, product }: DashboardItemOrderCertificateProps) => {
  if (!order.certificate) {
    return (
      <DashboardItemCertificate
        certificateDefinition={product.certificate_definition}
        productType={product.type}
      />
    );
  }
  const certificate = useCertificate(order.certificate);
  return (
    <>
      {certificate.states.fetching && (
        <Spinner aria-labelledby="loading-certificate">
          <span id="loading-certificate">
            <FormattedMessage {...messages.loadingCertificate} />
          </span>
        </Spinner>
      )}
      {certificate.item && (
        <DashboardItemCertificate certificate={certificate.item} productType={product.type} />
      )}
    </>
  );
};

export const DashboardItemOrder = ({
  order,
  showDetailsButton = true,
  showCertificate,
  writable,
}: DashboardItemOrderProps) => {
  const course = order.course as CourseLight;
  if (!course) {
    throw new Error('Order must provide course object attribute.');
  }
  const intl = useIntl();
  const query = useCourseProduct(course.code, { productId: order.product });
  const product = query?.item?.product;
  const getRoutePath = getDashboardRoutePath(useIntl());

  return (
    <DashboardItem
      data-testid={`dashboard-item-order-${order.id}`}
      title={product?.title ?? ''}
      code={'Ref. ' + course.code}
      imageUrl={course.cover?.src}
      footer={
        <div className="dashboard-item-order__footer">
          <div className="dashboard-item__block__status">
            <Icon name={IconTypeEnum.SCHOOL} />
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
              href={getRoutePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
              data-testid="dashboard-item-order__button"
            >
              {intl.formatMessage(messages.accessCourse)}
            </RouterButton>
          )}
        </div>
      }
    >
      <>
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
                  notEnrolledUrl={getRoutePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
                />
              }
            />
          ))}
        />
        {showCertificate && !!product?.certificate_definition && (
          <div className="dashboard-item-order__certificate__container">
            <DashboardItemOrderCertificate order={order} product={product} />
          </div>
        )}
      </>
    </DashboardItem>
  );
};
