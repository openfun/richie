import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  RichieContextFactory as mockRichieContextFactory,
  CourseRunFactory,
} from 'utils/test/factories/richie';
import {
  CourseLightFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import useCourseRunOrder from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
    lms_backends: [
      {
        backend: 'joanie',
        course_regexp: '^.*/api/v1.0((?:/(?:courses|course-runs|products)/[^/]+)+)/?$',
        endpoint: 'https://joanie.endpoint',
      },
    ],
  }).one(),
}));

describe('useCourseRunOrder', () => {
  setupJoanieSession();

  it('should return an order for a joanie product course run', async () => {
    const product = ProductFactory().one();
    const joanieCourse = CourseLightFactory().one();
    const richieCourseRun = CourseRunFactory({
      resource_link: `https://joanie.endpoint/api/v1.0/courses/${joanieCourse.code}/products/${product.id}`,
    }).one();
    const order = CredentialOrderFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${joanieCourse.code}&product_id=${product.id}`,
      [order],
    );
    const { result } = renderHook(() => useCourseRunOrder(richieCourseRun), {
      wrapper: BaseJoanieAppWrapper,
    });

    await waitFor(() => {
      expect(result.current.states.isFetched).toBe(true);
    });

    expect(result.current.item).toStrictEqual(order);
  });
});
