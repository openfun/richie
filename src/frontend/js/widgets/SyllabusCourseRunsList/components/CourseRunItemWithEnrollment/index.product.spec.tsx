import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { render } from 'utils/test/render';
import {
  CourseLightFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { ACTIVE_ORDER_STATES, PURCHASABLE_ORDER_STATES } from 'types/Joanie';
import CourseRunItemWithEnrollment from '.';

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

// here
describe("CourseRunItemWithEnrollment for joanie's product's course run", () => {
  setupJoanieSession();

  it('should not render enrollment information when user is anonymous', async () => {
    const course = CourseLightFactory().one();
    const product = ProductFactory().one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
      resource_link: `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}`,
    }).one();

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });
    await expectNoSpinner();

    // First title letter should have been capitalized
    // Dates should have been formatted as "Month day, year"
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should not render enrollment information when user has no order for the product', async () => {
    const course = CourseLightFactory().one();
    const product = ProductFactory().one();
    const user = UserFactory().one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
      resource_link: `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}`,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${course.code}&product_id=${product.id}`,
      mockPaginatedResponse([], 0, false),
    );

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    await expectNoSpinner();

    // Only dates should be displayed.
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBe(true);
    const link = screen.queryByTitle('Go to course') as HTMLAnchorElement;
    expect(link).not.toBeInTheDocument();
    expect(screen.queryByLabelText('You are enrolled in this course run')).not.toBeInTheDocument();
  });

  it('should not render enrollment information when user has no active order for the product', async () => {
    const course = CourseLightFactory().one();
    const product = ProductFactory().one();
    const user = UserFactory().one();
    const order = CredentialOrderFactory({
      state: faker.helpers.arrayElement(PURCHASABLE_ORDER_STATES),
    }).one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
      resource_link: `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}`,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${course.code}&product_id=${product.id}`,
      mockPaginatedResponse([order], 1, false),
    );

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    await expectNoSpinner();

    // Only dates should be displayed.
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBe(true);
    const link = screen.queryByTitle('Go to course') as HTMLAnchorElement;
    expect(link).not.toBeInTheDocument();
    expect(screen.queryByLabelText('You are enrolled in this course run')).not.toBeInTheDocument();
  });

  it('should render enrollment information when user has an active order for the product', async () => {
    const course = CourseLightFactory().one();
    const product = ProductFactory().one();
    const order = CredentialOrderFactory({
      state: faker.helpers.arrayElement(ACTIVE_ORDER_STATES),
    }).one();
    const user = UserFactory().one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
      resource_link: `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}`,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?course_code=${course.code}&product_id=${product.id}`,
      mockPaginatedResponse([order], 1, false),
    );

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    // session loader
    await waitFor(() => {
      expect(screen.queryByText('loading...')).not.toBeInTheDocument();
    });

    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBe(true);

    const link = screen.queryByTitle('Go to course') as HTMLAnchorElement;
    expect(link).toBeInTheDocument();
    expect(link.href).toBe(`https://localhost/en/dashboard/courses/orders/${order.id}`);
    screen.getByLabelText('You are enrolled in this course run');
  });
});
