import { act, fireEvent, getByText, screen, waitFor, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
import countries from 'i18n-iso-countries';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import CourseProductItem from 'widgets/SyllabusCourseRunsList/components/CourseProductItem';
import {
  AddressFactory,
  CourseLightFactory,
  CourseProductRelationFactory,
  CredentialOrderFactory,
  CredentialOrderWithPaymentFactory,
} from 'utils/test/factories/joanie';
import { ACTIVE_ORDER_STATES, CourseRun, OrderState } from 'types/Joanie';
import { Priority } from 'types';
import { expectMenuToBeClosed, expectMenuToBeOpen, expectOptions } from 'utils/test/Cunningham';
import { changeSelect } from 'components/Form/test-utils';
import { sleep } from 'utils/sleep';
import { getAddressLabel } from 'components/SaleTunnelV2/AddressSelector';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

jest.mock('../PaymentButton/components/PaymentInterfaces');

describe('SaleTunnelV2', () => {
  setupJoanieSession();

  const priceFormatter = (currency: string, price: number) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  /**
   * This test aims to test the entire process of buying a product, from the CourseProductItem.
   */
  it('buys a product ( full journey )', async () => {
    /**
     * Initialization.
     */
    const relation = CourseProductRelationFactory().one();
    const { product, course } = relation;
    // const order = CredentialOrderFactory({
    //   product_id: product.id,
    //   course: CourseLightFactory({ code: '00000' }).one(),
    //   target_courses: product.target_courses,
    //   state: OrderState.PENDING,
    // }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      relation,
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/enrollments/`, []);
    const orderQueryParameters = {
      product_id: product.id,
      course_code: course.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [],
    );

    render(<CourseProductItem productId={product.id} course={course} />);

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });
    // Price is displayed, meaning the product is not bought yet.
    screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect(screen.queryByText('Purchased')).not.toBeInTheDocument();

    /**
     * Purchase.
     */
    const user = userEvent.setup();
    const buyButton = screen.getByRole('button', { name: product.call_to_action });

    // The SaleTunnel should not be displayed.
    expect(screen.queryByTestId('GenericSaleTunnelPaymentStep')).not.toBeInTheDocument();

    await user.click(buyButton);

    // The SaleTunnel should be displayed.
    screen.getByTestId('GenericSaleTunnelPaymentStep');

    /**
     * Product Path is displayed.
     */
    screen.getByText('Your learning path');
    const targetCourses = screen.getAllByTestId('product-target-course');
    expect(targetCourses).toHaveLength(product.target_courses.length);
    targetCourses.forEach((targetCourse, index) => {
      const courseItem = product.target_courses[index];
      const courseDetail = within(targetCourse).getByTestId(
        `target-course-detail-${courseItem.code}`,
      );

      // Check if the course title is displayed
      const summary = courseDetail.querySelector('summary')!;
      expect(summary).toHaveTextContent(courseItem.title);

      const courseRuns = targetCourse.querySelectorAll(
        '.product-detail-row__course-run-dates__item',
      );
      // Only course runs opened for enrollment should be displayed
      const openedCourseRuns = courseItem.course_runs.filter(
        (cr: CourseRun) => cr.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
      expect(courseRuns).toHaveLength(openedCourseRuns.length);
    });

    /**
     * Fill full name.
     */
    screen.getByText('Information');

    const nameInput = screen.getByLabelText('Full name');
    await user.type(nameInput, 'John Doe');

    /**
     * Create an address.
     */
    // Billing address.
    const billingAddressInput = screen.getByRole('combobox', {
      name: 'Billing address',
    });

    // Make sure no address exists.
    const menu: HTMLDivElement = screen.getByRole('listbox', {
      name: 'Billing address',
    });
    expectMenuToBeClosed(menu);
    expect(screen.queryByText('No options available')).not.toBeInTheDocument();

    // Click on the input.
    await user.click(billingAddressInput);
    expectMenuToBeOpen(menu);
    expect(screen.getByText('No options available')).toBeInTheDocument();

    // Create an address.
    const createAddressButton = screen.getByRole('button', {
      name: /Create/i,
    });
    await user.click(createAddressButton);

    screen.getByText('Add address');

    const $titleField = screen.getByRole('textbox', { name: 'Address title' });
    const $firstnameField = screen.getByRole('textbox', { name: "Recipient's first name" });
    const $lastnameField = screen.getByRole('textbox', { name: "Recipient's last name" });
    const $addressField = screen.getByRole('textbox', { name: 'Address' });
    const $cityField = screen.getByRole('textbox', { name: 'City' });
    const $postcodeField = screen.getByRole('textbox', { name: 'Postcode' });
    const $countryField = screen.getByRole('combobox', { name: 'Country' });
    const $submitButton = screen.getByRole('button', {
      name: 'Submit',
    }) as HTMLButtonElement;

    // - User fulfills address fields
    const address = AddressFactory({ is_main: true }).one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/addresses/', address);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
      overwriteRoutes: true,
    });

    await user.type($titleField, address.title);
    await user.type($firstnameField, address.first_name);
    await user.type($lastnameField, address.last_name);
    await user.type($addressField, address.address);
    await user.type($cityField, address.city);
    await user.type($postcodeField, address.postcode);
    await changeSelect($countryField, countries.getName(address?.country, 'en')!, user);
    await user.click($submitButton);

    within(billingAddressInput).getByText(getAddressLabel(address));

    /**
     * Make sure no credit card is selected.
     */
    screen.getByRole('heading', {
      name: 'Payment method',
    });
    screen.getByText('Add new credit card during payment');

    /**
     * Pay
     */
    const $terms = screen.getByLabelText(
      'By checking this box, you accept the General Terms of Sale',
    );
    await user.click($terms);

    const { payment_info: paymentInfo, ...order } = CredentialOrderWithPaymentFactory().one();
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
        { overwriteRoutes: true },
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', order)
      .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
        paymentInfo,
      })
      .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, {
        ...order,
      });

    const $button = screen.getByRole('button', {
      name: `Pay ${priceFormatter(product.price_currency, product.price)}`,
    }) as HTMLButtonElement;

    await user.click($button);

    await screen.findByText('Payment in progress');
    screen.getByText('Payment interface component');
    await user.click(screen.getByTestId('payment-success'));

    /**
     * Success step.
     */

    // Make sure the success step is shown.
    expect(screen.queryByTestId('GenericSaleTunnelPaymentStep')).not.toBeInTheDocument();
    screen.getByTestId('GenericSaleTunnelSuccessStep');
    screen.getByText('Congratulations!');
    screen.getByText(/Your order has been successfully created/);
    screen.getByRole('link', { name: 'Sign the training contract' });

    /**
     * Make sure the product is displayed as bought ( it verifies cache is well updated ).
     */

    // This way we make sure the cache is updated.
    await screen.findByText('Purchased');
    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
  });
});
