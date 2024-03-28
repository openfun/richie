import { Product } from 'types/Joanie';
import TargetCourseDetail from 'components/SaleTunnel/components/SaleTunnelStepValidation/TargetCourseDetail';

export const ProductPath = ({ product }: { product: Product }) => {
  return (
    <div className="product-path">
      <h3 className="product-path__title fs-l mb-s">Your learning path</h3>
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
        {product.certificate_definition ? (
          <li
            className="product-path__product-detail-row product-detail-row"
            data-testid="product-certificate"
          >
            <span className="product-detail-row__icon product-detail-row__icon--big">
              <svg aria-hidden="true">
                <use href="#icon-certificate" />
              </svg>
            </span>
            <h3 className="product-detail-row__summary h4">
              {product.certificate_definition.title}
            </h3>
            {product.certificate_definition.description ? (
              <p className="product-detail-row__content">
                {product.certificate_definition.description}
              </p>
            ) : null}
          </li>
        ) : null}
      </ol>
      {product.instructions ? (
        <div
          className="product-detail-row__content product-detail-row__instructions"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: product.instructions }}
        />
      ) : null}
    </div>
  );
};
