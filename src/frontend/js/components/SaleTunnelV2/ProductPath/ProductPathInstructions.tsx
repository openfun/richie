import { Product } from 'types/Joanie';

export const ProductPathInstructions = ({ product }: { product: Product }) => {
  if (!product.instructions) {
    return null;
  }
  return (
    <div
      className="product-detail-row__content product-detail-row__instructions"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: product.instructions }}
    />
  );
};
