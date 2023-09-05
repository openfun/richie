import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import PurchaseButton from 'components/PurchaseButton';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseLight, Order, OrderState, Product, ProductType } from 'types/Joanie';
import { useOrders } from 'hooks/useOrders';
import { CourseProductProvider } from 'contexts/CourseProductContext';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import { useCertificate } from 'hooks/useCertificates';
import { CourseState } from 'types';
import { isOpenedCourseRunCertificate } from 'utils/CourseRuns';
import CertificateStatus from '../../CertificateStatus';

const messages = {
  buyProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.buyProductCertificateLabel',
    description: 'Label on the enrollement row that propose to buy a product of type certificate',
    defaultMessage: 'An exam which delivers a certificate can be purchased for this course.',
  },
  downloadProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.downloadProductCertificateLabel',
    description: 'Label on the enrollement row that propose to download a certificate',
    defaultMessage: 'A certificate is available for download.',
  },
  pendingProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.pendingProductCertificateLabel',
    description: 'Label on the enrollement when a product of type certificate have been bought',
    defaultMessage: 'Finish this course to obtain your certificate.',
  },
};

export interface ProductCertificateFooterProps {
  course: CourseLight;
  product: Product;
  courseRunState: CourseState;
}

const ProductCertificateFooter = ({
  course,
  product,
  courseRunState,
}: ProductCertificateFooterProps) => {
  if (product.type !== ProductType.CERTIFICATE) {
    return null;
  }
  const { items: orders } = useOrders({
    product: product.id,
    course: course.code,
    state: [OrderState.PENDING, OrderState.VALIDATED],
  });

  // Only one order can existe for a product and a course.
  if (orders.length > 1) {
    throw Error(
      `Multiple orders found (${orders.length}) for product: "${product.id}" and course "${course.id}"`,
    );
  }

  const order: Order | null = useMemo(() => {
    return orders.length ? orders[0] : null;
  }, [orders]);
  const { item: certificate } = useCertificate(order?.certificate);

  // The course run is no longer available
  // and no product certificate had been bought therefore there isn't any certifcate to download.
  if (!order && !isOpenedCourseRunCertificate(courseRunState)) {
    return null;
  }

  return (
    <CourseProductProvider courseCode={course.code} productId={product.id}>
      <div className="dashboard-item__course-enrolling__infos">
        <div className="dashboard-item__block__status">
          <Icon name={IconTypeEnum.CERTIFICATE} />
          {order ? (
            <>
              {product.certificate_definition.title + '. '}
              <CertificateStatus certificate={certificate} productType={product.type} />
            </>
          ) : (
            <FormattedMessage {...messages.buyProductCertificateLabel} />
          )}
        </div>
        {order ? (
          order.certificate && (
            <DownloadCertificateButton
              className="dashboard-item__button"
              certificateId={order.certificate}
            />
          )
        ) : (
          <PurchaseButton
            className="dashboard-item__button"
            product={product}
            courseRunState={courseRunState}
          />
        )}
      </div>
    </CourseProductProvider>
  );
};

export default ProductCertificateFooter;
