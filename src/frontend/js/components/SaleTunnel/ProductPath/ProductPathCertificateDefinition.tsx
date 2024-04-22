import { Product } from 'types/Joanie';

export const ProductPathCertificateDefinition = ({ product }: { product: Product }) => {
  if (!product.certificate_definition) {
    return null;
  }
  return (
    <li
      className="SaleTunnelStepValidation__product-detail-row product-detail-row"
      data-testid="product-certificate"
    >
      <span className="product-detail-row__icon product-detail-row__icon--big">
        <svg aria-hidden="true">
          <use href="#icon-certificate" />
        </svg>
      </span>
      <h3 className="product-detail-row__summary h4">{product.certificate_definition.title}</h3>
      {product.certificate_definition.description ? (
        <p className="product-detail-row__content">{product.certificate_definition.description}</p>
      ) : null}
    </li>
  );
};
