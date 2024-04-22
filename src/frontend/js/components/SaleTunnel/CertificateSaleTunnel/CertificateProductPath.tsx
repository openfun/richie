import { defineMessages, FormattedMessage } from 'react-intl';
import { Enrollment, Product } from 'types/Joanie';
import CourseRunsList from 'components/SaleTunnel/ProductPath/CourseRunsList';
import { ProductPathCertificateDefinition } from 'components/SaleTunnel/ProductPath/ProductPathCertificateDefinition';
import { ProductPathInstructions } from 'components/SaleTunnel/ProductPath/ProductPathInstructions';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Certificate.ProductPath.title',
    description: 'Title of certificate product path section',
    defaultMessage: 'Your learning path',
  },
});

export const CertificateProductPath = ({
  product,
  enrollment,
}: {
  product: Product;
  enrollment: Enrollment;
}) => {
  return (
    <div className="product-path">
      <h3 className="product-path__title block-title mb-s">
        <FormattedMessage {...messages.title} />
      </h3>
      <ol className="product-path__product-detail-list">
        {enrollment?.course_run && (
          <li
            key={`SaleTunnelStepValidation__product-detail-row--${enrollment.course_run.course.code}`}
            className="SaleTunnelStepValidation__product-detail-row product-detail-row product-detail-row--course"
            data-testid="product-course"
          >
            <span className="product-detail-row__icon">
              <svg aria-hidden="true">
                <use href="#icon-check" />
              </svg>
            </span>
            <h3 className="product-detail-row__summary h4">{enrollment.course_run.course.title}</h3>
            <CourseRunsList courseRuns={[enrollment.course_run]} />
          </li>
        )}
        <ProductPathCertificateDefinition product={product} />
      </ol>
      <ProductPathInstructions product={product} />
    </div>
  );
};
