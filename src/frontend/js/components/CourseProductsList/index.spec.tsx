import { act, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  ContextFactory as mockContextFactory,
  CourseFactory,
  OrderLiteFactory,
} from 'utils/test/factories';
import { Deferred } from 'utils/test/deferred';
import type { Props as CourseProductItemProps } from 'components/CourseProductItem';
import JoanieApiProvider from 'data/JoanieApiProvider';
import type { Course, CourseProduct, OrderLite } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
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
    <section data-testid="product-widget">
      <h3>{product.title}</h3>
      {order && <strong data-testid="product-widget__price">Enrolled</strong>}
    </section>
  ),
}));

describe('CourseProductsList', () => {
  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient()}>
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
    await waitFor(() => expect(container.children).toHaveLength(0));
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

    // it should render a visually hidden heading for screen reader users
    const $offscreenTitle = screen.getByRole('heading', { name: 'Products' });
    expect($offscreenTitle.classList.contains('offscreen')).toBe(true);

    // - A loader should be displayed while couse information are fetching
    screen.getByRole('status', { name: 'Loading course information...' });

    await act(async () => {
      courseDeferred.resolve(course);
    });

    // - It should render one <CourseProductItem /> per product
    await waitFor(() =>
      expect(screen.queryAllByTestId('product-widget')).toHaveLength(course.products.length),
    );
    // - It should also pass order information if user owns a product
    expect(screen.queryAllByTestId('product-widget__price')).toHaveLength(1);
  });
});
