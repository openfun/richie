import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Contract, CourseLight, Order, Product } from 'types/Joanie';
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
import { DashboardSubItemsList } from '../DashboardSubItemsList';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem } from '../index';
import OrderStateMessage from './OrderStateMessage';

const messages = {
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
  contractUnsigned: {
    id: 'components.DashboardItemOrder.contractUnsigned',
    description: "Message displayed when the order's contract needs to be signed.",
    defaultMessage: 'You have to sign this contract to access your training.',
  },
  contractSigned: {
    id: 'components.DashboardItemOrder.contractSigned',
    description:
      "Message displayed when the order's contract has been signed and can be downloaded.",
    defaultMessage: "You've accepted the training contract.",
  },
  contractSignActionLabel: {
    id: 'components.DashboardItemOrder.contractSignActionLabel',
    description: 'Label of "sign contract" action.',
    defaultMessage: 'Sign',
  },
  contractDownloadActionLabel: {
    id: 'components.DashboardItemOrder.contractDownloadActionLabel',
    description: 'Label of "download contract" action.',
    defaultMessage: 'Download',
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

interface DashboardItemOrderContractProps {
  order: Order;
  product?: Product;
}

interface DashboardItemOrderContractFooterProps {
  contract?: Contract;
  mode?: 'default' | 'compact';
}

const DashboardItemOrderContractFooter = ({ contract }: DashboardItemOrderContractFooterProps) => {
  const signContract = () => {
    // TODO: sign contract action
  };
  const downloadContract = () => {
    // TODO: download contract action
  };

  return (
    <div className="dashboard-item-order__footer">
      <div className="dashboard-item__block__status">
        <FormattedMessage
          {...(contract?.signed_on ? messages.contractSigned : messages.contractUnsigned)}
        />
      </div>
      {contract?.signed_on ? (
        <Button className="dashboard-item__button" color="secondary" onClick={downloadContract}>
          <FormattedMessage {...messages.contractDownloadActionLabel} />
        </Button>
      ) : (
        <Button className="dashboard-item__button" onClick={signContract}>
          <FormattedMessage {...messages.contractSignActionLabel} />
        </Button>
      )}
    </div>
  );
};

const DashboardItemOrderContract = ({ order, product }: DashboardItemOrderContractProps) => {
  if (!order.contract || !product?.contract_definition) {
    return null;
  }

  return (
    <DashboardItem
      title={product?.contract_definition.title}
      code=""
      footer={<DashboardItemOrderContractFooter contract={order.contract} />}
    />
  );
};

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
  writable = false,
}: DashboardItemOrderProps) => {
  const course = order.course as CourseLight;
  if (!course) {
    throw new Error('Order must provide course object attribute.');
  }
  const intl = useIntl();
  const query = useCourseProduct(course.code, { productId: order.product });
  const product = query?.item?.product;
  const needsSignature = order.contract && !order.contract.signed_on;

  const getRoutePath = getDashboardRoutePath(useIntl());

  return (
    <div className="dashboard-item-order">
      {writable && !order.contract?.signed_on && (
        <DashboardItemOrderContract order={order} product={product} />
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
                <OrderStateMessage order={order} />
              </div>
              {showDetailsButton && (
                <RouterButton
                  className="dashboard-item__button"
                  color="transparent-darkest"
                  href={getRoutePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}
                  data-testid="dashboard-item-order__button"
                >
                  {intl.formatMessage(messages.accessCourse)}
                </RouterButton>
              )}
            </div>
            {!writable && needsSignature && (
              <DashboardItemOrderContractFooter contract={order.contract} />
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
        <div className="dashboard-item dashboard-item-order__certificate__container">
          <DashboardItemOrderCertificate order={order} product={product} />
        </div>
      )}
      {writable && order.contract?.signed_on && (
        <DashboardItemOrderContract order={order} product={product} />
      )}
    </div>
  );
};
