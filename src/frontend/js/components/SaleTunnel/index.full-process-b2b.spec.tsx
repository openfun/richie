import { screen, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
import { PaymentMethod } from 'components/PaymentInterfaces/types';
import {
  RichieContextFactory as mockRichieContextFactory,
  PacedCourseFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import CourseProductItem from 'widgets/SyllabusCourseRunsList/components/CourseProductItem';
import {
  OfferingFactory,
  PaymentPlanFactory,
  ProductFactory,
  OfferingBatchOrderFactory,
  BatchOrderReadFactory,
  CredentialOrderFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { CourseRun, NOT_CANCELED_ORDER_STATES, OrderState } from 'types/Joanie';
import { Priority } from 'types';
import { expectMenuToBeClosed, expectMenuToBeOpen } from 'utils/test/Cunningham';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

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

describe('SaleTunnel', () => {
  let richieUser: User;
  let openApiEdxProfile: OpenEdxApiProfile;
  setupJoanieSession();

  const formatPrice = (currency: string, price: number) =>
    new Intl.NumberFormat('en', { currency, style: 'currency' })
      .format(price)
      .replace(/(\u202F|\u00a0)/g, ' ');

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

  afterEach(() => fetchMock.reset());

  it('tests the entire process of subscribing to a batch order', async () => {
    const course = PacedCourseFactory().one();
    const product = ProductFactory().one();
    const offering = OfferingFactory({ course, product, is_withdrawable: false }).one();
    const paymentPlan = PaymentPlanFactory().one();
    const organizations = OrganizationFactory().many(3);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      offering,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
      paymentPlan,
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/enrollments/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify({
        product_id: product.id,
        course_code: course.code,
        state: NOT_CANCELED_ORDER_STATES,
      })}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offerings/${offering.id}/get-organizations/`,
      organizations,
    );

    render(<CourseProductItem productId={product.id} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    // Verify product info
    await screen.findByRole('heading', { level: 3, name: product.title });
    await screen.findByText(formatPrice(product.price_currency, product.price));
    expect(screen.queryByText('Purchased')).not.toBeInTheDocument();

    const user = userEvent.setup();
    const buyButton = screen.getByRole('button', { name: product.call_to_action });

    expect(screen.queryByTestId('generic-sale-tunnel-payment-step')).not.toBeInTheDocument();
    await user.click(buyButton);
    await screen.findByTestId('generic-sale-tunnel-payment-step');

    // Verify learning path
    await screen.findByText('Your learning path');
    const targetCourses = await screen.findAllByTestId('product-target-course');
    expect(targetCourses).toHaveLength(product.target_courses.length);
    targetCourses.forEach((targetCourse, index) => {
      const courseItem = product.target_courses[index];
      const courseDetail = within(targetCourse).getByTestId(
        `target-course-detail-${courseItem.code}`,
      );
      const summary = courseDetail.querySelector('summary')!;
      expect(summary).toHaveTextContent(courseItem.title);

      const courseRuns = targetCourse.querySelectorAll(
        '.product-detail-row__course-run-dates__item',
      );
      const openedCourseRuns = courseItem.course_runs.filter(
        (cr: CourseRun) => cr.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
      expect(courseRuns).toHaveLength(openedCourseRuns.length);
    });

    // Select group buy form
    await screen.findByText('Purchase type');
    const formTypeSelect = screen.getByRole('combobox', { name: 'Purchase type' });
    const menu: HTMLDivElement = screen.getByRole('listbox', { name: 'Purchase type' });
    expectMenuToBeClosed(menu);
    await user.click(formTypeSelect);
    expectMenuToBeOpen(menu);
    await user.click(screen.getByText('I am purchasing on behalf of an organization'));

    // Company step
    const $companyName = await screen.findByRole('textbox', { name: 'Company name' });
    const $idNumber = screen.getByRole('textbox', { name: /Registration number/ });
    const $address = screen.getByRole('textbox', { name: 'Address' });
    const $postCode = screen.getByRole('textbox', { name: 'Postal code' });
    const $city = screen.getByRole('textbox', { name: 'City' });
    const $country = screen.getByRole('combobox', { name: 'Country' });

    await user.type($companyName, 'GIP-FUN');
    await user.type($idNumber, '789 242 229 01694');
    await user.type($address, '61 Bis Rue de la Glaciere');
    await user.type($postCode, '75013');
    await user.type($city, 'Paris');

    const countryMenu: HTMLDivElement = screen.getByRole('listbox', { name: 'Country' });
    await user.click($country);
    expectMenuToBeOpen(countryMenu);
    await user.click(screen.getByText('France'));

    expect($companyName).toHaveValue('GIP-FUN');
    const visibleValue = $country.querySelector('.c__select__inner__value span');
    expect(visibleValue!.textContent).toBe('France');

    // Follow-up step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $lastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $firstName = screen.getByRole('textbox', { name: 'First name' });
    const $role = screen.getByRole('textbox', { name: 'Role' });
    const $email = screen.getByRole('textbox', { name: 'Email' });
    const $phone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($lastName, 'Doe');
    await user.type($firstName, 'John');
    await user.type($role, 'HR');
    await user.type($email, 'john.doe@fun-mooc.com');
    await user.type($phone, '+338203920103');

    expect($lastName).toHaveValue('Doe');
    expect($email).toHaveValue('john.doe@fun-mooc.com');

    // Signatory step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $signatoryLastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $signatoryFirstName = screen.getByRole('textbox', { name: 'First name' });
    const $signatoryRole = screen.getByRole('textbox', { name: 'Role' });
    const $signatoryEmail = screen.getByRole('textbox', { name: 'Email' });
    const $signatoryPhone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($signatoryLastName, 'Doe');
    await user.type($signatoryFirstName, 'John');
    await user.type($signatoryRole, 'CEO');
    await user.type($signatoryEmail, 'john.doe@fun-mooc.com');
    await user.type($signatoryPhone, '+338203920103');

    // Participants step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $nbParticipants = await screen.findByLabelText('Number of participants to register');
    await user.type($nbParticipants, '13');
    expect($nbParticipants).toHaveValue(13);

    // Financing step
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const $purchaseOrderRadio = await screen.findByLabelText('Purchase order');
    await user.click($purchaseOrderRadio);

    const $fundingEntity = screen.getByLabelText('Entity name');
    await user.type($fundingEntity, 'OPCO');
    expect($fundingEntity).toHaveValue('OPCO');

    const $fundingAmount = screen.getByLabelText('Amount covered');
    await user.type($fundingAmount, '5000');
    expect($fundingAmount).toHaveValue(5000);

    const organizationComboboxes = screen.getAllByRole('combobox', {
      name: 'Participating organizations',
    });

    const $organizationSelect = organizationComboboxes[organizationComboboxes.length - 1];
    await user.click($organizationSelect);
    const organizationMenu: HTMLDivElement = screen.getByRole('listbox', {
      name: 'Participating organizations',
    });
    expectMenuToBeOpen(organizationMenu);
    const firstOrg = organizations[0];
    await user.click(screen.getByRole('option', { name: firstOrg.title }));

    // Submit the batch order
    const batchOrderRead = BatchOrderReadFactory().one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/batch-orders/', batchOrderRead);
    const $subscribebutton = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;
    await user.click($subscribebutton);
    await screen.findByTestId('generic-sale-tunnel-success-step');
    screen.getByText('Subscription confirmed!');
    screen.getByText('Your order has been successfully registered.');
    const $dashboardLink = screen.getByRole('link', { name: 'Close' });
    expect($dashboardLink).toHaveAttribute(
      'href',
      `/en/dashboard/batch-orders/${batchOrderRead.id}`,
    );

    // Verify the batch order payload contains all required and optional fields
    const batchOrderCalls = fetchMock.calls('https://joanie.endpoint/api/v1.0/batch-orders/');
    expect(batchOrderCalls).toHaveLength(1);
    const batchOrderCall = batchOrderCalls[0];
    const batchOrderRequest = batchOrderCall[1];
    const batchOrderPayload = JSON.parse(batchOrderRequest?.body as string);

    // Verify all payload fields
    expect(batchOrderPayload).toEqual({
      offering_id: offering.id,
      company_name: 'GIP-FUN',
      identification_number: '789 242 229 01694',
      address: '61 Bis Rue de la Glaciere',
      postcode: '75013',
      city: 'Paris',
      country: 'FR',
      administrative_lastname: 'Doe',
      administrative_firstname: 'John',
      administrative_profession: 'HR',
      administrative_email: 'john.doe@fun-mooc.com',
      administrative_telephone: '+338203920103',
      signatory_lastname: 'Doe',
      signatory_firstname: 'John',
      signatory_profession: 'CEO',
      signatory_email: 'john.doe@fun-mooc.com',
      signatory_telephone: '+338203920103',
      nb_seats: '13',
      payment_method: PaymentMethod.PURCHASE_ORDER,
      funding_entity: 'OPCO',
      funding_amount: '5000',
      organization_id: firstOrg.id,
    });
  }, 30000);

  it('tests the entire process of subscribing with a voucher from a batch order', async () => {
    /**
     * Initialization.
     */
    const course = PacedCourseFactory().one();
    const product = ProductFactory().one();
    const offering = OfferingFactory({
      course,
      product,
      is_withdrawable: false,
    }).one();
    const paymentPlan = PaymentPlanFactory().one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      offering,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
      paymentPlan,
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
      formatPrice(product.price_currency, product.price),
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
     * Submit voucher and check price
     */
    const paymentPlanVoucher = PaymentPlanFactory({
      discounted_price: 0,
      discount: '-100%',
      payment_schedule: undefined,
      from_batch_order: true,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/?voucher_code=DISCOUNT100`,
      paymentPlanVoucher,
      { overwriteRoutes: true },
    );
    await user.type(screen.getByLabelText('Voucher code'), 'DISCOUNT100');
    await user.click(screen.getByRole('button', { name: 'Validate' }));
    expect(screen.queryByRole('heading', { name: 'Payment schedule' })).not.toBeInTheDocument();
    await screen.findByTestId('sale-tunnel__total__amount');
    const $totalAmountVoucher = screen.getByTestId('sale-tunnel__total__amount');
    expect($totalAmountVoucher).toHaveTextContent(
      'Total' +
        formatPrice(product.price_currency, paymentPlanVoucher.price!) +
        formatPrice(product.price_currency, paymentPlanVoucher.discounted_price!),
    );

    /**
     * Make sure the checkbox to waive withdrawal right is not displayed
     */
    expect(screen.queryByTestId('withdraw-right-checkbox')).not.toBeInTheDocument();

    /**
     * Subscribe
     */
    const order = CredentialOrderFactory({
      state: OrderState.COMPLETED,
      payment_schedule: undefined,
    }).one();
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
     * No withdrawal error should be displayed.
     */
    expect(
      await screen.queryByText('You must waive your withdrawal right.'),
    ).not.toBeInTheDocument();

    // // Make sure the success step is shown.
    await screen.findByTestId('generic-sale-tunnel-success-step');

    screen.getByText('Subscription confirmed!');
  }, 10000);

  it('should display the appropriate error message when there are not enough seats available', async () => {
    const course = PacedCourseFactory().one();
    const product = ProductFactory().one();
    const offering = OfferingFactory({ course, product, is_withdrawable: false }).one();
    const paymentPlan = PaymentPlanFactory().one();
    const offeringOrganization = OfferingBatchOrderFactory({
      product: { id: product.id, title: product.title },
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      offering,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
      paymentPlan,
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/enrollments/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify({
        product_id: product.id,
        course_code: course.code,
        state: NOT_CANCELED_ORDER_STATES,
      })}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offerings/${offering.id}/get-organizations/`,
      offeringOrganization,
    );

    render(<CourseProductItem productId={product.id} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    // Verify product info
    await screen.findByRole('heading', { level: 3, name: product.title });
    await screen.findByText(formatPrice(product.price_currency, product.price));
    expect(screen.queryByText('Purchased')).not.toBeInTheDocument();

    const user = userEvent.setup();
    const buyButton = screen.getByRole('button', { name: product.call_to_action });

    expect(screen.queryByTestId('generic-sale-tunnel-payment-step')).not.toBeInTheDocument();
    await user.click(buyButton);
    await screen.findByTestId('generic-sale-tunnel-payment-step');

    // Verify learning path
    await screen.findByText('Your learning path');
    const targetCourses = await screen.findAllByTestId('product-target-course');
    expect(targetCourses).toHaveLength(product.target_courses.length);
    targetCourses.forEach((targetCourse, index) => {
      const courseItem = product.target_courses[index];
      const courseDetail = within(targetCourse).getByTestId(
        `target-course-detail-${courseItem.code}`,
      );
      const summary = courseDetail.querySelector('summary')!;
      expect(summary).toHaveTextContent(courseItem.title);

      const courseRuns = targetCourse.querySelectorAll(
        '.product-detail-row__course-run-dates__item',
      );
      const openedCourseRuns = courseItem.course_runs.filter(
        (cr: CourseRun) => cr.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
      expect(courseRuns).toHaveLength(openedCourseRuns.length);
    });

    // Select group buy form
    await screen.findByText('Purchase type');
    const formTypeSelect = screen.getByRole('combobox', { name: 'Purchase type' });
    const menu: HTMLDivElement = screen.getByRole('listbox', { name: 'Purchase type' });
    expectMenuToBeClosed(menu);
    await user.click(formTypeSelect);
    expectMenuToBeOpen(menu);
    await user.click(screen.getByText('I am purchasing on behalf of an organization'));

    // Company step
    const $companyName = await screen.findByRole('textbox', { name: 'Company name' });
    const $idNumber = screen.getByRole('textbox', { name: /Registration number/ });
    const $address = screen.getByRole('textbox', { name: 'Address' });
    const $postCode = screen.getByRole('textbox', { name: 'Postal code' });
    const $city = screen.getByRole('textbox', { name: 'City' });
    const $country = screen.getByRole('combobox', { name: 'Country' });

    await user.type($companyName, 'GIP-FUN');
    await user.type($idNumber, '789 242 229 01694');
    await user.type($address, '61 Bis Rue de la Glaciere');
    await user.type($postCode, '75013');
    await user.type($city, 'Paris');

    const countryMenu: HTMLDivElement = screen.getByRole('listbox', { name: 'Country' });
    await user.click($country);
    expectMenuToBeOpen(countryMenu);
    await user.click(screen.getByText('France'));

    expect($companyName).toHaveValue('GIP-FUN');
    const visibleValue = $country.querySelector('.c__select__inner__value span');
    expect(visibleValue!.textContent).toBe('France');

    // Follow-up step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $lastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $firstName = screen.getByRole('textbox', { name: 'First name' });
    const $role = screen.getByRole('textbox', { name: 'Role' });
    const $email = screen.getByRole('textbox', { name: 'Email' });
    const $phone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($lastName, 'Doe');
    await user.type($firstName, 'John');
    await user.type($role, 'HR');
    await user.type($email, 'john.doe@fun-mooc.com');
    await user.type($phone, '+338203920103');

    expect($lastName).toHaveValue('Doe');
    expect($email).toHaveValue('john.doe@fun-mooc.com');

    // Signatory step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $signatoryLastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $signatoryFirstName = screen.getByRole('textbox', { name: 'First name' });
    const $signatoryRole = screen.getByRole('textbox', { name: 'Role' });
    const $signatoryEmail = screen.getByRole('textbox', { name: 'Email' });
    const $signatoryPhone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($signatoryLastName, 'Doe');
    await user.type($signatoryFirstName, 'John');
    await user.type($signatoryRole, 'CEO');
    await user.type($signatoryEmail, 'john.doe@fun-mooc.com');
    await user.type($signatoryPhone, '+338203920103');

    // Participants step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $nbParticipants = await screen.findByLabelText('Number of participants to register');
    await user.type($nbParticipants, '13');
    expect($nbParticipants).toHaveValue(13);

    // Financing step
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const $purchaseOrderRadio = await screen.findByLabelText('Purchase order');
    await user.click($purchaseOrderRadio);

    fetchMock.post('https://joanie.endpoint/api/v1.0/batch-orders/', {
      status: 422,
      body: {
        __all__: ['Maximum number of orders reached for product Credential Product'],
      },
    });

    const $subscribeButton = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;
    await user.click($subscribeButton);

    await screen.findByText(
      'Unable to create the order: the maximum number of available seats for this offering has been reached. Please contact support for more information.',
    );
  }, 30000);

  it('tests optional fields can be filled and cleared without breaking validation', async () => {
    const course = PacedCourseFactory().one();
    const product = ProductFactory().one();
    const offering = OfferingFactory({ course, product, is_withdrawable: false }).one();
    const paymentPlan = PaymentPlanFactory().one();
    const organizations = OrganizationFactory().many(3);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      offering,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-plan/`,
      paymentPlan,
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/enrollments/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify({
        product_id: product.id,
        course_code: course.code,
        state: NOT_CANCELED_ORDER_STATES,
      })}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offerings/${offering.id}/get-organizations/`,
      organizations,
    );

    render(<CourseProductItem productId={product.id} course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    await screen.findByRole('heading', { level: 3, name: product.title });
    const user = userEvent.setup();
    const buyButton = screen.getByRole('button', { name: product.call_to_action });
    await user.click(buyButton);
    await screen.findByTestId('generic-sale-tunnel-payment-step');

    // Select group buy form
    const formTypeSelect = screen.getByRole('combobox', { name: 'Purchase type' });
    await user.click(formTypeSelect);
    await user.click(screen.getByText('I am purchasing on behalf of an organization'));

    // Company step
    const $companyName = await screen.findByRole('textbox', { name: 'Company name' });
    const $idNumber = screen.getByRole('textbox', { name: /Registration number/ });
    const $address = screen.getByRole('textbox', { name: 'Address' });
    const $postCode = screen.getByRole('textbox', { name: 'Postal code' });
    const $city = screen.getByRole('textbox', { name: 'City' });
    const $country = screen.getByRole('combobox', { name: 'Country' });

    await user.type($companyName, 'Test Company');
    await user.type($idNumber, '123456789');
    await user.type($address, '123 Test Street');
    await user.type($postCode, '12345');
    await user.type($city, 'Test City');
    await user.click($country);
    await user.click(screen.getByText('France'));

    // Fill and clear billing address optional fields
    const $billingCheckbox = screen.getByLabelText('Use different billing information');
    await user.click($billingCheckbox);

    const $billingContactName = await screen.findByRole('textbox', {
      name: 'Contact name',
    });
    const $billingContactEmail = screen.getByRole('textbox', { name: 'Contact email' });
    const billingCompanyInputs = screen.getAllByRole('textbox', { name: 'Company name' });
    const $billingCompanyName = billingCompanyInputs[billingCompanyInputs.length - 1];
    const billingIdInputs = screen.getAllByRole('textbox', { name: /Registration number/ });
    const $billingIdNumber = billingIdInputs[billingIdInputs.length - 1];
    const billingAddressInputs = screen.getAllByRole('textbox', { name: 'Address' });
    const $billingAddress = billingAddressInputs[billingAddressInputs.length - 1];
    const billingPostCodeInputs = screen.getAllByRole('textbox', { name: 'Postal code' });
    const $billingPostCode = billingPostCodeInputs[billingPostCodeInputs.length - 1];
    const billingCityInputs = screen.getAllByRole('textbox', { name: 'City' });
    const $billingCity = billingCityInputs[billingCityInputs.length - 1];
    const billingCountrySelects = screen.getAllByRole('combobox', { name: 'Country' });
    const $billingCountry = billingCountrySelects[billingCountrySelects.length - 1];

    await user.type($billingContactName, 'Billing Contact');
    await user.type($billingContactEmail, 'billing@test.com');
    await user.type($billingCompanyName, 'Billing Company');
    await user.type($billingIdNumber, '987654321');
    await user.type($billingAddress, '456 Billing Street');
    await user.type($billingPostCode, '54321');
    await user.type($billingCity, 'Billing City');
    await user.click($billingCountry);
    await user.click(screen.getAllByText('France')[1]);

    await user.clear($billingContactName);
    await user.clear($billingContactEmail);
    await user.clear($billingCompanyName);
    await user.clear($billingIdNumber);
    await user.clear($billingAddress);
    await user.clear($billingPostCode);
    await user.clear($billingCity);

    await user.click($billingCheckbox);

    // Follow-up step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $lastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $firstName = screen.getByRole('textbox', { name: 'First name' });
    const $role = screen.getByRole('textbox', { name: 'Role' });
    const $email = screen.getByRole('textbox', { name: 'Email' });
    const $phone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($lastName, 'Doe');
    await user.type($firstName, 'Jane');
    await user.type($role, 'Manager');
    await user.type($email, 'jane.doe@test.com');
    await user.type($phone, '+33123456789');

    // Signatory step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $signatoryLastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $signatoryFirstName = screen.getByRole('textbox', { name: 'First name' });
    const $signatoryRole = screen.getByRole('textbox', { name: 'Role' });
    const $signatoryEmail = screen.getByRole('textbox', { name: 'Email' });
    const $signatoryPhone = screen.getByRole('textbox', { name: 'Phone number' });

    await user.type($signatoryLastName, 'Smith');
    await user.type($signatoryFirstName, 'John');
    await user.type($signatoryRole, 'Director');
    await user.type($signatoryEmail, 'john.smith@test.com');
    await user.type($signatoryPhone, '+33987654321');

    // Participants step
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $nbParticipants = await screen.findByLabelText('Number of participants to register');
    await user.type($nbParticipants, '10');

    // Financing step - fill and clear optional fields
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const $purchaseOrderRadio = await screen.findByLabelText('Purchase order');
    await user.click($purchaseOrderRadio);

    const $fundingEntity = screen.getByLabelText('Entity name');
    await user.type($fundingEntity, 'Test OPCO');
    expect($fundingEntity).toHaveValue('Test OPCO');

    const $fundingAmount = screen.getByLabelText('Amount covered');
    await user.type($fundingAmount, '1000');
    expect($fundingAmount).toHaveValue(1000);

    await user.clear($fundingAmount);
    expect($fundingAmount).toHaveValue(null);

    await user.clear($fundingEntity);
    expect($fundingEntity).toHaveValue('');

    // Submit the batch order
    const batchOrderRead = BatchOrderReadFactory().one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/batch-orders/', batchOrderRead);
    const $subscribeButton = screen.getByRole('button', {
      name: 'Subscribe',
    }) as HTMLButtonElement;

    expect($subscribeButton).not.toBeDisabled();
    await user.click($subscribeButton);
    await screen.findByTestId('generic-sale-tunnel-success-step');

    // Verify the batch order payload does NOT contain the cleared optional fields
    const batchOrderCalls = fetchMock.calls('https://joanie.endpoint/api/v1.0/batch-orders/');
    expect(batchOrderCalls).toHaveLength(1);
    const batchOrderPayload = JSON.parse(batchOrderCalls[0][1]?.body as string);

    expect(batchOrderPayload.billing_address).toBeUndefined();
    expect(batchOrderPayload.funding_entity).toBeUndefined();
    expect(batchOrderPayload.funding_amount).toBeUndefined();
    expect(batchOrderPayload.organization_id).toBeUndefined();

    expect(batchOrderPayload).toMatchObject({
      offering_id: offering.id,
      company_name: 'Test Company',
      identification_number: '123456789',
      payment_method: PaymentMethod.PURCHASE_ORDER,
      nb_seats: '10',
    });
  }, 30000);
});
