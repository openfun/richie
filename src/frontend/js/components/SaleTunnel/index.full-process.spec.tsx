import { act, screen, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
import countries from 'i18n-iso-countries';
import { getAllByRole } from '@testing-library/dom';
import {
  RichieContextFactory as mockRichieContextFactory,
  PacedCourseFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import CourseProductItem from 'widgets/SyllabusCourseRunsList/components/CourseProductItem';
import {
  AddressFactory,
  ContractFactory,
  CourseProductRelationFactory,
  CredentialOrderFactory,
  CreditCardFactory,
  PaymentFactory,
  PaymentInstallmentFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { CourseRun, NOT_CANCELED_ORDER_STATES, OrderState } from 'types/Joanie';
import { Priority } from 'types';
import { expectMenuToBeClosed, expectMenuToBeOpen } from 'utils/test/Cunningham';
import { changeSelect } from 'components/Form/test-utils';
import { getAddressLabel } from 'components/SaleTunnel/AddressSelector';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';

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

jest.mock('../PaymentInterfaces');

/**
 * This test aims to test the entire process of buying a product, from the CourseProductItem.
 */

describe('SaleTunnel', () => {
  let richieUser: User;
  let openApiEdxProfile: OpenEdxApiProfile;
  setupJoanieSession();

  const dateFormatter = Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const priceFormatter = (currency: string, price: number) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  beforeEach(() => {
    richieUser = UserFactory().one();
    openApiEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();

    const { 'pref-lang': prefLang, ...openEdxAccount } = openApiEdxProfile;

    fetchMock.get(`https://auth.test/api/user/v1/accounts/${richieUser.username}`, openEdxAccount);
    fetchMock.patch(
      `https://auth.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });
    fetchMock.get(`https://auth.test/api/v1.0/user/me`, richieUser);
  });

  it('tests the entire process of subscribing to a credential product', async () => {
    /**
     * Initialization.
     */
    const course = PacedCourseFactory().one();
    const product = ProductFactory().one();
    const relation = CourseProductRelationFactory({
      course,
      product,
      is_withdrawable: false,
    }).one();
    const paymentSchedule = PaymentInstallmentFactory().many(2);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      relation,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
      paymentSchedule,
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/enrollments/`, []);
    const orderQueryParameters = {
      product_id: product.id,
      course_code: course.code,
      state: NOT_CANCELED_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [],
    );

    render(<CourseProductItem productId={product.id} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

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
    expect(screen.queryByTestId('generic-sale-tunnel-payment-step')).not.toBeInTheDocument();

    await user.click(buyButton);

    // The SaleTunnel should be displayed.
    screen.getByTestId('generic-sale-tunnel-payment-step');

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

    const nameInput = screen.getByLabelText('First name and last name');
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
      name: 'Create',
    }) as HTMLButtonElement;

    // - User fulfills address fields
    const address = AddressFactory({ is_main: true }).one();
    fetchMock
      .post('https://joanie.endpoint/api/v1.0/addresses/', address)
      .get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
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

    expect(
      await within(billingAddressInput).findByText(getAddressLabel(address)),
    ).toBeInTheDocument();

    /**
     * Make sure the payment schedule is displayed.
     */
    screen.getByRole('heading', { name: 'Payment schedule' });
    paymentSchedule.forEach((installment, index) => {
      const row = screen.getByTestId(installment.id);
      const cells = getAllByRole(row, 'cell');
      expect(cells).toHaveLength(4);
      expect(cells[0]).toHaveTextContent((index + 1).toString());
      expect(cells[1]).toHaveTextContent(
        priceFormatter(installment.currency, installment.amount).replace(/(\u202F|\u00a0)/g, ' '),
      );
      expect(cells[2]).toHaveTextContent(
        `Withdrawn on ${dateFormatter.format(new Date(installment.due_date))}`,
      );
      expect(cells[3]).toHaveTextContent(new RegExp(installment.state, 'i'));
    });

    const $totalAmount = screen.getByTestId('sale-tunnel__total__amount');
    expect($totalAmount).toHaveTextContent(
      'Total' +
        priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );

    /**
     * Make sure the checkbox to waive withdrawal right is displayed
     */
    const $waiveCheckbox = within(screen.getByTestId('withdraw-right-checkbox')).getByRole(
      'checkbox',
    );

    /**
     * Subscribe
     */
    const order = CredentialOrderFactory({ state: OrderState.TO_SIGN }).one();
    fetchMock
      .post('https://joanie.endpoint/api/v1.0/orders/', order)
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
        { overwriteRoutes: true },
      );

    const $button = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;
    await user.click($button);

    /**
     * An error should be displayed if the user has not waived its withdrawal right.
     */
    screen.getByText('You must waive your withdrawal right.');

    await user.click($waiveCheckbox);
    await user.click($button);

    order.state = OrderState.TO_SAVE_PAYMENT_METHOD;
    order.contract = ContractFactory({ student_signed_on: new Date().toISOString() }).one();

    const checkSignatureDeferred = new Deferred();

    fetchMock
      .post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`, {
        invitation_link: 'https://dummysignaturebackend.fr/contract/1/sign',
      })
      .post(`https://joanie.endpoint/api/v1.0/signature/notifications/`, 200)
      .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, checkSignatureDeferred.promise, {
        overwriteRoutes: true,
      })
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
        { overwriteRoutes: true },
      );

    const $signButton = await screen.findByRole('button', { name: 'Sign' });
    await user.click($signButton);

    screen.getByRole('heading', { name: 'Signing the contract ...' });

    // Then the signature check polling should be started
    await screen.findByRole('heading', { name: 'Verifying signature ...' });
    expect(
      screen.getByText(
        'We are waiting for the signature to be validated from our signature platform. It can take up to few minutes. Do not close this page.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      checkSignatureDeferred.resolve(order);
    });

    /**
     * Save payment method step
     */
    const paymentMethod = CreditCardFactory().one();
    order.state = OrderState.PENDING;
    order.credit_card_id = paymentMethod.id;
    fetchMock
      .post('https://joanie.endpoint/api/v1.0/credit-cards/tokenize-card/', PaymentFactory().one())
      .post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/payment-method/`, 200)
      .get('https://joanie.endpoint/api/v1.0/credit-cards/', [paymentMethod], {
        overwriteRoutes: true,
      })
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
        { overwriteRoutes: true },
      );
    await screen.findByRole('heading', { name: 'Define a payment method' });
    screen.getByText('Use another credit card');

    const $defineButton = screen.getByRole('button', { name: 'Define' });
    await user.click($defineButton);

    screen.getByText('Payment interface component');
    await user.click(screen.getByTestId('payment-success'));

    /**
     * Success step.
     */

    // Make sure the success step is shown.
    await screen.findByTestId('generic-sale-tunnel-success-step');
    screen.getByText('Subscription confirmed!');
    screen.getByRole('link', { name: 'Close' });

    /**
     * Make sure the product is displayed as bought ( it verifies cache is well updated ).
     */

    // This way we make sure the cache is updated.
    await screen.findByText('Purchased');
    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
  }, 15000);
});
