import { defineMessages, FormattedMessage } from 'react-intl';
import { Product } from 'types/Joanie';
import TargetCourseDetail from 'components/SaleTunnel/ProductPath/TargetCourseDetail';
import { ProductPathCertificateDefinition } from 'components/SaleTunnel/ProductPath/ProductPathCertificateDefinition';
import { ProductPathInstructions } from 'components/SaleTunnel/ProductPath/ProductPathInstructions';

const messages = defineMessages({
  title: {
    id: 'components.SaleTunnel.Credential.ProductPath.title',
    description: 'Title of credential product path section',
    defaultMessage: 'Your learning path',
  },
});

export const CredentialProductPath = ({ product }: { product: Product }) => {
  return (
    <div className="product-path">
      <h3 className="product-path__title block-title mb-s">
        <FormattedMessage {...messages.title} />
      </h3>
      <ol className="product-path__product-detail-list">
        {product.target_courses.map((targetCourse) => (
          <li
            key={`product-path__product-detail-row--${targetCourse.code}`}
            className="product-path__product-detail-row product-detail-row"
            data-testid="product-target-course"
          >
            <div />
            <span className="product-detail-row__icon">
              <svg aria-hidden="true">
                <use href="#icon-check" />
              </svg>
            </span>
            <TargetCourseDetail course={targetCourse} />
          </li>
        ))}
        <ProductPathCertificateDefinition product={product} />
      </ol>
      <ProductPathInstructions product={product} />
    </div>
  );
};
