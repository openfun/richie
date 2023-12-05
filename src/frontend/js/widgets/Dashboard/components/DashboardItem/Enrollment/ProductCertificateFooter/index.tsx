import { FormattedMessage } from 'react-intl';
import PurchaseButton from 'components/PurchaseButton';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CertificateProduct, Enrollment, ProductType } from 'types/Joanie';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import { useCertificate } from 'hooks/useCertificates';
import { isOpenedCourseRunCertificate } from 'utils/CourseRuns';
import CertificateStatus from '../../CertificateStatus';
import { getActiveEnrollmentOrder } from '../../utils/order';

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
  product: CertificateProduct;
  enrollment: Enrollment;
}

const ProductCertificateFooter = ({ product, enrollment }: ProductCertificateFooterProps) => {
  if (product.type !== ProductType.CERTIFICATE) {
    return null;
  }
  const activeOrder = getActiveEnrollmentOrder(enrollment.orders || [], product.id);
  const { item: certificate } = useCertificate(activeOrder?.certificate_id);

  // The course run is no longer available
  // and no product certificate had been bought therefore there isn't any certifcate to download.
  if (!activeOrder && !isOpenedCourseRunCertificate(enrollment.course_run.state)) {
    return null;
  }

  return (
    <div className="dashboard-item__course-enrolling__infos">
      <div className="dashboard-item__block__status">
        <Icon name={IconTypeEnum.CERTIFICATE} />
        {activeOrder ? (
          <>
            {product.certificate_definition.title + '. '}
            <CertificateStatus certificate={certificate} productType={product.type} />
          </>
        ) : (
          <FormattedMessage {...messages.buyProductCertificateLabel} />
        )}
      </div>
      {activeOrder ? (
        activeOrder.certificate_id && (
          <DownloadCertificateButton
            className="dashboard-item__button"
            certificateId={activeOrder.certificate_id}
          />
        )
      ) : (
        <PurchaseButton
          className="dashboard-item__button"
          product={product}
          enrollment={enrollment}
        />
      )}
    </div>
  );
};

export default ProductCertificateFooter;
