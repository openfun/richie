import { FormattedMessage, defineMessages } from 'react-intl';
import { useState } from 'react';
import PurchaseButton from 'components/PurchaseButton';
import { Icon, IconTypeEnum } from 'components/Icon';
import {
  ACTIVE_ORDER_STATES,
  CertificateProduct,
  Enrollment,
  ProductType,
  PURCHASABLE_ORDER_STATES,
} from 'types/Joanie';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import { useCertificate } from 'hooks/useCertificates';
import { isOpenedCourseRunCertificate } from 'utils/CourseRuns';
import { OrderHelper } from 'utils/OrderHelper';
import CertificateStatus from '../../CertificateStatus';

const messages = defineMessages({
  buyProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.buyProductCertificateLabel',
    description: 'Label on the enrollment row that propose to buy a product of type certificate',
    defaultMessage: 'An exam which delivers a certificate can be purchased for this course.',
  },
  downloadProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.downloadProductCertificateLabel',
    description: 'Label on the enrollment row that propose to download a certificate',
    defaultMessage: 'A certificate is available for download.',
  },
  pendingProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.pendingProductCertificateLabel',
    description: 'Label on the enrollment when a product of type certificate have been bought',
    defaultMessage: 'Finish this course to obtain your certificate.',
  },
});

export interface ProductCertificateFooterProps {
  product: CertificateProduct;
  enrollment: Enrollment;
}

const ProductCertificateFooter = ({ product, enrollment }: ProductCertificateFooterProps) => {
  if (product.type !== ProductType.CERTIFICATE) {
    return null;
  }
  const [order, setOrder] = useState(
    OrderHelper.getActiveEnrollmentOrder(enrollment.orders || [], product.id),
  );
  const { item: certificate } = useCertificate(order?.certificate_id);

  // The course run is no longer available
  // and no product certificate had been bought therefore there isn't any certificate to download.
  if (!order && !isOpenedCourseRunCertificate(enrollment.course_run.state)) {
    return null;
  }

  return (
    <div className="dashboard-item__course-enrolling__infos">
      <div className="dashboard-item__block__status">
        <Icon name={IconTypeEnum.CERTIFICATE} />
        {order && ACTIVE_ORDER_STATES.includes(order.state) ? (
          <>
            {product.certificate_definition.title + '. '}
            <CertificateStatus certificate={certificate} productType={product.type} />
          </>
        ) : (
          <FormattedMessage {...messages.buyProductCertificateLabel} />
        )}
      </div>
      {order && ACTIVE_ORDER_STATES.includes(order.state) ? (
        order.certificate_id && (
          <DownloadCertificateButton
            className="dashboard-item__button"
            certificateId={order.certificate_id}
          />
        )
      ) : (
        <PurchaseButton
          className="dashboard-item__button"
          product={product}
          enrollment={enrollment}
          buttonProps={{ size: 'small' }}
          disabled={order && !PURCHASABLE_ORDER_STATES.includes(order.state)}
          onFinish={(o) => {
            /**
             * As we do not refetch enrollments in DashboardCourses after SaleTunnel cache invalidation (to avoid
             * scroll reset - and SaleTunnel modal unmounting too early caused by list reset) we need to manually
             * update the active order in the enrollment in order to hide the buy button and display the download button.
             */
            setOrder(o);
          }}
        />
      )}
    </div>
  );
};

export default ProductCertificateFooter;
