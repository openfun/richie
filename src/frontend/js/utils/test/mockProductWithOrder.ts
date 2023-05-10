import fetchMock from 'fetch-mock';
import { CourseLight, Order, Product } from 'types/Joanie';
import { ProductFactory } from 'utils/test/factories/joanie';

export const mockProductWithOrder = (order: Order) => {
  const product: Product = ProductFactory({
    id: order.product,
  }).one();
  fetchMock.get(
    'https://joanie.endpoint/api/v1.0/products/' +
      product.id +
      '/?course=' +
      (order.course as CourseLight).code,
    product,
  );
  return product;
};
