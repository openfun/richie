import { act, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import {
  ContextFactory as mockContextFactory,
  CourseFactory,
  OrderLiteFactory,
} from 'utils/test/factories';
import { Deferred } from 'utils/test/deferred';
import type { Props as CourseProductItemProps } from 'components/CourseProductItem';
import JoanieApiProvider from 'data/JoanieApiProvider';
import type { Course, CourseProduct, OrderLite } from 'types/Joanie';
import createQueryClient from 'utils/react-query/createQueryClient';
import CourseProductsList from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

jest.mock('components/CourseProductItem', () => ({
  __esModule: true,
  default: ({ product, order }: CourseProductItemProps) => (
    <>
      <h2>{product.title}</h2>
      {order && <h3>{order.id}</h3>}
    </>
  ),
}));

describe('CourseProductsList', () => {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createQueryClient()}>
        <JoanieApiProvider>{children}</JoanieApiProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  afterEach(() => {
    fetchMock.restore();
    CourseFactory.afterGenerate((c: Course) => c);
    OrderLiteFactory.afterGenerate((o: OrderLite) => o);
  });

  it('returns null when course does not exist from Joanie', async () => {
    const courseCode = '00001';
    fetchMock.get(`https://joanie.test/api/courses/${courseCode}/`, 404);

    const { container } = render(
      <Wrapper>
        <CourseProductsList code={courseCode} />
      </Wrapper>,
    );

    // - A loader should be displayed while couse information are fetching
    screen.getByRole('status', { name: 'Loading course information...' });

    await waitFor(() => {
      // - As course is not defined, it should render nothing.
      expect(container.children).toHaveLength(0);
    });
  });

  it('returns null when course does not have products', async () => {
    const course: Course = CourseFactory.afterGenerate((c: Course) => ({
      ...c,
      products: [],
    })).generate();
    const courseDeferred = new Deferred();
    fetchMock.get(`https://joanie.test/api/courses/${course.code}/`, courseDeferred.promise);

    const { container } = render(
      <Wrapper>
        <CourseProductsList code={course.code} />
      </Wrapper>,
    );

    // - A loader should be displayed while couse information are fetching
    screen.getByRole('status', { name: 'Loading course information...' });

    await act(async () => {
      courseDeferred.resolve(course);
    });

    // - As course does not have products, it should render nothing.
    expect(container.children).toHaveLength(0);
  });

  it('renders one <CourseProductItem /> per course product', async () => {
    // - Create a course with one product owned by the authenticated user.
    const course: Course = CourseFactory.afterGenerate((c: Course) => {
      const product: CourseProduct = c.products[0];
      const order: OrderLite = OrderLiteFactory.afterGenerate((o: OrderLite) => ({
        ...o,
        product: product.id,
      })).generate();
      return { ...c, orders: [order] };
    }).generate();
    const courseDeferred = new Deferred();
    fetchMock.get(`https://joanie.test/api/courses/${course.code}/`, courseDeferred.promise);

    render(
      <Wrapper>
        <CourseProductsList code={course.code} />
      </Wrapper>,
    );

    // - A loader should be displayed while couse information are fetching
    screen.getByRole('status', { name: 'Loading course information...' });

    await act(async () => {
      courseDeferred.resolve(course);
    });

    // - It should render one <CourseProductItem /> per product
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(course.products.length);

    // - It should also pass order information if user owns a product
    const $orders = screen.getAllByRole('heading', { level: 3 });
    expect($orders).toHaveLength(1);
    screen.getByRole('heading', { level: 3, name: course.orders![0].id });
  });
});
