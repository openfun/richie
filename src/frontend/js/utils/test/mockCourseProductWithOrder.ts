import fetchMock from 'fetch-mock';
import { CourseLight, Order } from 'types/Joanie';
import {
  CourseFactory,
  CourseProductRelationFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';

export const mockCourseProductWithOrder = (order: Order) => {
  const courseCode = (order.course as CourseLight).code;
  const productId = order.product;
  const relation = CourseProductRelationFactory({
    product: ProductFactory({
      id: order.product,
    }).one(),
    course: CourseFactory({
      code: courseCode,
    }).one(),
  }).one();

  fetchMock.get(
    `https://joanie.endpoint/api/v1.0/courses/${courseCode}/products/${productId}/`,
    relation,
  );
  return relation;
};
