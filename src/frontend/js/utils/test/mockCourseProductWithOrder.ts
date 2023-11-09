import fetchMock from 'fetch-mock';
import { CredentialOrder } from 'types/Joanie';
import {
  ContractDefinitionFactory,
  CourseFactory,
  CourseProductRelationFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';

export const mockCourseProductWithOrder = (order: CredentialOrder) => {
  const courseCode = order.course.code;
  const productId = order.product_id;
  const relation = CourseProductRelationFactory({
    product: ProductFactory({
      id: order.product_id,
      contract_definition: order.contract ? ContractDefinitionFactory().one() : undefined,
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
