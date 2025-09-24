import { screen, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
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
  PaymentInstallmentFactory,
  ProductFactory,
  OfferingBatchOrderFactory,
  BatchOrderReadFactory,
} from 'utils/test/factories/joanie';
import { CourseRun, NOT_CANCELED_ORDER_STATES } from 'types/Joanie';
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
    const paymentSchedule = PaymentInstallmentFactory().many(2);
    const offeringOrganization = OfferingBatchOrderFactory({
      product_id: product.id,
      product_title: product.title,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/`,
      offering,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
      paymentSchedule,
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
    await user.click(screen.getByText('Group purchase (B2B)'));

    // Company step
    const $companyName = await screen.findByRole('textbox', { name: 'Company name' });
    const $idNumber = screen.getByRole('textbox', { name: /Identification number/ });
    const $address = screen.getByRole('textbox', { name: 'Address' });
    const $postCode = screen.getByRole('textbox', { name: 'Post code' });
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
    await user.click(screen.getByText('Follow-up'));
    const $lastName = await screen.findByRole('textbox', { name: 'Last name' });
    const $firstName = screen.getByRole('textbox', { name: 'First name' });
    const $role = screen.getByRole('textbox', { name: 'Role' });
    const $email = screen.getByRole('textbox', { name: 'Email' });
    const $phone = screen.getByRole('textbox', { name: 'Phone' });

    await user.type($lastName, 'Doe');
    await user.type($firstName, 'John');
    await user.type($role, 'HR');
    await user.type($email, 'john.doe@fun-mooc.com');
    await user.type($phone, '+338203920103');

    expect($lastName).toHaveValue('Doe');
    expect($email).toHaveValue('john.doe@fun-mooc.com');

    // Participants step
    await user.click(screen.getByText('Participants'));
    const $nbParticipants = await screen.findByLabelText('How many participants ?');
    await user.type($nbParticipants, '13');
    expect($nbParticipants).toHaveValue(13);

    // Submit the batch order
    const batchOrderRead = BatchOrderReadFactory().one();
    fetchMock.post('https://joanie.endpoint/api/v1.0/batch-orders/', batchOrderRead);
    const $subscribebutton = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;
    await user.click($subscribebutton);
    await screen.findByTestId('generic-sale-tunnel-success-step');
    screen.getByText('Subscription confirmed!');
    const $dashboardLink = screen.getByRole('link', { name: 'Close' });
    expect($dashboardLink).toHaveAttribute(
      'href',
      `/en/dashboard/batch-orders/${batchOrderRead.id}`,
    );
  }, 15000);
});
