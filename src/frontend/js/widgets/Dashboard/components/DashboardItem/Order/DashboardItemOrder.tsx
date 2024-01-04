import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import { CourseLight, CredentialOrder, Product } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CoursesHelper } from 'utils/CoursesHelper';
import { useCertificate } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';

import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem } from '../index';
import { DashboardItemContract } from '../Contract';
import OrderStateMessage from './OrderStateMessage';

const messages = defineMessages({
  accessCourse: {
    id: 'components.DashboardItemOrder.gotoCourse',
    description: 'Button that redirects to the order details',
    defaultMessage: 'View details',
  },
  loadingCertificate: {
    id: 'components.DashboardItemOrder.loadingCertificate',
    description: 'Accessible label displayed while certificate is being fetched on the dashboard.',
    defaultMessage: 'Loading certificate...',
  },
});

interface DashboardItemOrderProps {
  order: CredentialOrder;
  showDetailsButton?: boolean;
  showCertificate?: boolean;
  writable?: boolean;
}

interface DashboardItemOrderCertificateProps {
  order: CredentialOrder;
  product: Product;
}

const DashboardItemOrderCertificate = ({ order, product }: DashboardItemOrderCertificateProps) => {
  if (!order.certificate_id) {
    return (
      <DashboardItemCertificate
        certificateDefinition={product.certificate_definition}
        productType={product.type}
        mode="compact"
      />
    );
  }
  const certificate = useCertificate(order.certificate_id);
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
        <DashboardItemCertificate
          certificate={certificate.item}
          productType={product.type}
          mode="compact"
        />
      )}
    </>
  );
};

export const DashboardItemOrder = ({
  order,
  showDetailsButton = true,
  showCertificate,
  writable = false,
}: DashboardItemOrderProps) => {
  const course = order.course as CourseLight;

  const intl = useIntl();
  const {
    item: courseProductRelation,
    states: { isFetched: isCourseProductRelationFetched },
  } = useCourseProduct({ product_id: order.product_id, course_id: course.code });
  const { product } = courseProductRelation || {};
  const needsSignature = orderNeedsSignature(order, product);
  const getRoutePath = getDashboardRoutePath(useIntl());

  return (
    <div className="dashboard-item-order">
      {writable && needsSignature && (
        <DashboardItemContract
          key={`DashboardItemOrderContract_${order.id}`}
          title={product.title}
          order={order}
          contract_definition={product.contract_definition!}
          contract={order.contract}
          writable={writable}
          mode="compact"
        />
      )}
      <DashboardItem
        data-testid={`dashboard-item-order-${order.id}`}
        title={product?.title ?? ''}
        code={'Ref. ' + course.code}
        imageUrl={course.cover?.src}
        footer={
          <>
            <div className="dashboard-item-order__footer">
              <div className="dashboard-item__block__status">
                <Icon name={IconTypeEnum.SCHOOL} />
                <OrderStateMessage order={order} product={product} />
              </div>
              {showDetailsButton && (
                <RouterButton
                  size="small"
                  className="dashboard-item__button"
                  href={getRoutePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
                  data-testid="dashboard-item-order__button"
                >
                  {intl.formatMessage(messages.accessCourse)}
                </RouterButton>
              )}
            </div>
            {!writable && needsSignature && (
              <DashboardItemContract
                key={`DashboardItemOrderContract_${order.id}`}
                title={product.title}
                order={order}
                contract_definition={product.contract_definition!}
                contract={order.contract}
                writable={writable}
                mode="compact"
              />
            )}
          </>
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
                  product={product}
                  activeEnrollment={CoursesHelper.findActiveCourseEnrollmentInOrder(
                    targetCourse,
                    order,
                  )}
                  notEnrolledUrl={getRoutePath(LearnerDashboardPaths.ORDER, {
                    orderId: order.id,
                  })}
                  hideEnrollButtons={needsSignature}
                />
              }
            />
          ))}
        />
      </DashboardItem>
      {showCertificate && !!product?.certificate_definition && (
        <DashboardItemOrderCertificate order={order} product={product} />
      )}
      {writable && isCourseProductRelationFetched && order.contract?.student_signed_on && (
        <DashboardItemContract
          key={`DashboardItemOrderContract_${order.id}`}
          title={product.title}
          order={order}
          contract_definition={product.contract_definition!}
          contract={order.contract}
          writable={writable}
          mode="compact"
        />
      )}
    </div>
  );
};
