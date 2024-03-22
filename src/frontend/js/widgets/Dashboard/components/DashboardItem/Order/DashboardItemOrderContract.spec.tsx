import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { CourseLight } from 'types/Joanie';
import {
  ContractDefinitionFactory,
  ContractFactory,
  CredentialOrderFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { expectBannerError } from 'utils/test/expectBanner';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

jest.mock('utils/indirection/window', () => ({
  alert: jest.fn(() => true),
}));

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  CONTRACT_SETTINGS: { dummySignatureSignTimeout: 0 },
}));

describe('<DashboardItemOrder/> Contract', () => {
  setupJoanieSession();
  beforeEach(() => {
    fetchMock.get(
      'begin:https://joanie.endpoint/api/v1.0/enrollments/',
      { results: [], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
    fetchMock.get('https://joanie.endpoint/api/v1.0/me', []);
  });

  describe('non writable', () => {
    it('renders a non-writable order without contract attribute', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: null,
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Enroll' })).toBeInTheDocument();
    });

    it('renders a non-writable order with a signed contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ student_signed_on: faker.date.past().toISOString() }).one(),
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Enroll' })).toBeInTheDocument();
    });

    it('renders a non-writable order with a contract not signed yet', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ student_signed_on: undefined }).one(),
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(screen.getByText('Ref. ' + (order.course as CourseLight).code)).toBeInTheDocument();
      expect(
        screen.getByText('You have to sign this training contract to access your training.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Signature required')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign' })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Enroll' })).not.toBeInTheDocument();
    });
  });

  describe('writable', () => {
    it('renders a writable order without contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: undefined,
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        { wrapper: BaseJoanieAppWrapper },
      );

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
    });
    it('renders a writable order with a contract not signed yet', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: null,
      }).one();
      const { product } = mockCourseProductWithOrder(order);
      product.contract_definition = ContractDefinitionFactory().one();

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        { wrapper: BaseJoanieAppWrapper },
      );
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.getByText('Signature required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument();
      expect(
        screen.getByText('You have to sign this training contract to access your training.'),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByText(/You signed this training contract./)).not.toBeInTheDocument();

      const $enrollButtons = screen.getAllByRole('button', { name: 'Enroll' });
      expect($enrollButtons).toHaveLength(order.target_courses[0].course_runs.length);
      $enrollButtons.forEach(($button) => expect($button).toBeDisabled());

      await expectBannerError('You need to sign your contract before enrolling in a course run');
    });

    it('renders a writable order with a signed contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({
          student_signed_on: faker.date.past().toISOString(),
          organization_signed_on: faker.date.past().toISOString(),
        }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        { wrapper: BaseJoanieAppWrapper },
      );

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByText(/You signed this training contract./)).toBeInTheDocument();

      const $enrollButtons = screen.getAllByRole('button', { name: 'Enroll' });
      expect($enrollButtons).toHaveLength(order.target_courses[0].course_runs.length);
      $enrollButtons.forEach(($button) => expect($button).toBeEnabled());

      expect(
        screen.queryByText('You need to sign your contract before enrolling to your courses'),
      ).not.toBeInTheDocument();
    });

    it("should display contract's download button", async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({
          student_signed_on: faker.date.past().toISOString(),
          organization_signed_on: faker.date.past().toISOString(),
        }).one(),
      }).one();
      mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const DOWNLOAD_URL = `https://joanie.endpoint/api/v1.0/contracts/${
        order.contract!.id
      }/download/`;
      fetchMock.get(DOWNLOAD_URL, 'contract content');

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        { wrapper: BaseJoanieAppWrapper },
      );
      expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
    });
  });
});
