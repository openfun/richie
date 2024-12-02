import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';
import { CredentialOrder, OrderState } from 'types/Joanie';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CoursesHelper } from 'utils/CoursesHelper';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { OrderHelper } from 'utils/OrderHelper';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import OrganizationBlock from 'widgets/Dashboard/components/DashboardItem/Order/OrganizationBlock';
import CertificateItem from 'widgets/Dashboard/components/DashboardItem/Order/CertificateItem';
import { ProductHelper } from 'utils/ProductHelper';
import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../CourseEnrolling';
import { DashboardItem } from '../index';
import { DashboardItemContract } from '../Contract';
import OrderStateLearnerMessage from './OrderStateLearnerMessage';

const messages = defineMessages({
  accessCourse: {
    id: 'components.DashboardItemOrder.gotoCourse',
    description: 'Button that redirects to the order details',
    defaultMessage: 'View details',
  },
  syllabusLinkLabel: {
    id: 'components.DashboardItemOrder.syllabusLinkLabel',
    description: 'Syllabus link label on order details',
    defaultMessage: 'Go to syllabus',
  },
  missingPaymentMethodTitle: {
    id: 'components.DashboardItemOrder.missingPaymentMethodTitle',
    description: 'Main message displayed when the order is missing a payment method',
    defaultMessage: 'A payment method is missing',
  },
  missingPaymentMethodDescription: {
    id: 'components.DashboardItemOrder.missingPaymentMethodDescription',
    description: 'Description message displayed when the order is missing a payment method',
    defaultMessage: 'You must define a payment method to finalize your subscription.',
  },
  missingPaymentMethodCTA: {
    id: 'components.DashboardItemOrder.missingPaymentMethodCTA',
    description: 'CTA label displayed when the order is missing a payment method',
    defaultMessage: 'Define',
  },
  notResumable: {
    id: 'components.DashboardItemOrder.notResumable',
    description:
      'Message displayed when the order subscription is not completed but the product is no more purchasable',
    defaultMessage:
      'The subscription process cannot be resumed. The related training is no more purchasable.',
  },
});

interface DashboardItemOrderProps {
  order: CredentialOrder;
  showDetailsButton?: boolean;
  showCertificate?: boolean;
  writable?: boolean;
}

export const DashboardItemOrder = ({
  order,
  showDetailsButton = true,
  showCertificate,
  writable = false,
}: DashboardItemOrderProps) => {
  const { course } = order;
  const intl = useIntl();
  const { item: courseProductRelation } = useCourseProduct({
    product_id: order.product_id,
    course_id: course.code,
  });
  const { product } = courseProductRelation || {};
  const needsSignature = OrderHelper.orderNeedsSignature(order);
  const needsPaymentMethod = order.state === OrderState.TO_SAVE_PAYMENT_METHOD;
  const isActive = OrderHelper.isActive(order);
  const isProductPurchasable = ProductHelper.isPurchasable(courseProductRelation?.product);
  const isNotResumable = !isActive && !isProductPurchasable;
  const canEnroll = OrderHelper.allowEnrollment(order);

  if (!product) return null;

  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-order-${order.id}`}
        title={product.title}
        code={'Ref. ' + course.code}
        imageUrl={course.cover?.src}
        more={
          <li>
            <a className="selector__list__link" href={`/redirects/courses/${course.code}`}>
              <FormattedMessage {...messages.syllabusLinkLabel} />
            </a>
          </li>
        }
        footer={
          <>
            <div className="dashboard-item-order__footer">
              <div className="dashboard-item__block__status">
                {isNotResumable ? (
                  <>
                    <Icon name={IconTypeEnum.ROUND_CLOSE} size="small" />
                    <FormattedMessage {...messages.notResumable} />
                  </>
                ) : (
                  <>
                    <Icon name={IconTypeEnum.SCHOOL} />
                    <OrderStateLearnerMessage order={order} />
                  </>
                )}
              </div>
              {!isNotResumable && showDetailsButton && (
                <RouterButton
                  size="small"
                  className="dashboard-item__button"
                  href={generatePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
                  data-testid="dashboard-item-order__button"
                >
                  {intl.formatMessage(messages.accessCourse)}
                </RouterButton>
              )}
            </div>
            {!writable && isProductPurchasable && needsSignature && (
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
            {!writable && isProductPurchasable && needsPaymentMethod && (
              <DashboardItem
                title=""
                data-testid={`dashboard-item-payment-method-${order.id}`}
                mode="compact"
                footer={
                  <>
                    <div className="dashboard-contract__body">
                      <Icon name={IconTypeEnum.CREDIT_CARD} />
                      <span>
                        <FormattedMessage {...messages.missingPaymentMethodTitle} />
                      </span>
                    </div>
                    <div className="dashboard-contract__footer">
                      <span className="dashboard-contract__footer__status">
                        <FormattedMessage {...messages.missingPaymentMethodDescription} />
                      </span>
                      <div>
                        <RouterButton
                          size="small"
                          href={generatePath(LearnerDashboardPaths.ORDER, {
                            orderId: order.id,
                          })}
                          className="dashboard-item__button"
                        >
                          <FormattedMessage {...messages.missingPaymentMethodCTA} />
                        </RouterButton>
                      </div>
                    </div>
                  </>
                }
              />
            )}
          </>
        }
      >
        {!isNotResumable && (
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
                    notEnrolledUrl={generatePath(LearnerDashboardPaths.ORDER, {
                      orderId: order.id,
                    })}
                    hideEnrollButtons={!canEnroll}
                  />
                }
              />
            ))}
          />
        )}
      </DashboardItem>
      {!isNotResumable && (
        <>
          {showCertificate && !!product?.certificate_definition && (
            <CertificateItem order={order} product={product} />
          )}
          {writable && <OrganizationBlock order={order} product={product} />}
        </>
      )}
    </div>
  );
};
