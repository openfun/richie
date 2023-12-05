import { fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { userEvent } from '@storybook/testing-library';
import { PropsWithChildren, useMemo, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { Priority } from 'types';
import {
  CourseRun,
  Enrollment,
  Order,
  Product,
  ProductType,
  isCertificateProduct,
} from 'types/Joanie';
import {
  CertificateProductFactory,
  CourseLightFactory,
  CredentialProductFactory,
  EnrollmentFactory,
} from 'utils/test/factories/joanie';
import { User } from 'types/User';
import { Maybe } from 'types/utils';
import { SaleTunnelContext, SaleTunnelContextType } from 'components/SaleTunnel/context';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { SaleTunnelStepValidation } from '.';

describe('SaleTunnelStepValidation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const Wrapper = ({
    children,
    user,
    product,
    enrollment,
  }: PropsWithChildren<{ user?: User; product: Product; enrollment?: Enrollment }>) => {
    const [order, setOrder] = useState<Maybe<Order>>();
    const context: SaleTunnelContextType = useMemo(() => {
      if (isCertificateProduct(product)) {
        return {
          product,
          order,
          setOrder,
          key: `${enrollment!.id}+${product.id}`,
          enrollment: enrollment!,
        };
      }
      return {
        product,
        order,
        setOrder,
        course: CourseLightFactory({ code: '00000' }).one(),
        key: `00000+${product.id}`,
      };
    }, [product, order, setOrder, enrollment]);

    return (
      <QueryClientProvider client={createTestQueryClient({ user: user || true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <CunninghamProvider>
              <SaleTunnelContext.Provider value={context}>{children}</SaleTunnelContext.Provider>
            </CunninghamProvider>
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  it.each([
    { productType: ProductType.CERTIFICATE, instructions: true },
    { productType: ProductType.CREDENTIAL, instructions: true },
    { productType: ProductType.CERTIFICATE, instructions: false },
    { productType: ProductType.CREDENTIAL, instructions: false },
  ])('shows generic informations for product %s', async ({ productType, instructions }) => {
    const productInstructions = instructions ? '<h2>Product instructions</h2>' : null;
    const product =
      productType === ProductType.CERTIFICATE
        ? CertificateProductFactory({ instructions: productInstructions }).one()
        : CredentialProductFactory({ instructions: productInstructions }).one();
    const enrollment =
      productType === ProductType.CERTIFICATE ? EnrollmentFactory().one() : undefined;

    const mockNext = jest.fn();
    render(
      <Wrapper product={product} enrollment={enrollment}>
        <SaleTunnelStepValidation next={mockNext} />
      </Wrapper>,
    );

    const formatter = new Intl.NumberFormat('en', {
      currency: product.price_currency,
      style: 'currency',
    });

    screen.getByRole('heading', { level: 2, name: product.title });
    screen.getByText(`${formatter.format(product.price).replaceAll(/\s/g, ' ')} including VAT`);

    expect(screen.getByTestId('product-certificate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: product.certificate_definition.title }));

    if (instructions) {
      expect(screen.getByRole('heading', { name: 'Product instructions' })).toBeInTheDocument();
    }

    // Click on the button trigger the next function
    const button = screen.getByRole('button', { name: 'Proceed to payment' });
    await userEvent.click(button);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('shows product credential target course runs informations', async () => {
    const product = CredentialProductFactory().one();
    render(
      <Wrapper product={product}>
        <SaleTunnelStepValidation next={jest.fn()} />
      </Wrapper>,
    );

    const targetCourses = screen.getAllByTestId('product-target-course');
    expect(targetCourses).toHaveLength(product.target_courses.length);
    targetCourses.forEach((targetCourse, index) => {
      const courseItem = product.target_courses[index];
      const courseDetail = within(targetCourse).getByTestId(
        `target-course-detail-${courseItem.code}`,
      );

      // Details should be closed by default
      expect(courseDetail).not.toHaveAttribute('open');

      // Check if the course title is displayed
      const summary = courseDetail.querySelector('summary')!;
      expect(summary).toHaveTextContent(courseItem.title);

      // Click on summary should open the details
      fireEvent.click(summary);
      expect(courseDetail).toHaveAttribute('open');

      const courseRuns = targetCourse.querySelectorAll(
        '.product-detail-row__course-run-dates__item',
      );
      // Only course runs opened for enrollment should be displayed
      const openedCourseRuns = courseItem.course_runs.filter(
        (cr: CourseRun) => cr.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
      expect(courseRuns).toHaveLength(openedCourseRuns.length);
    });
  });

  it('shows product certificate linked course run informations', () => {
    const product = CertificateProductFactory().one();
    const enrollment = EnrollmentFactory().one();

    render(
      <Wrapper product={product} enrollment={enrollment}>
        <SaleTunnelStepValidation next={jest.fn()} />
      </Wrapper>,
    );
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: enrollment.course_run.course.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('course-run-list-item')).toBeInTheDocument();
  });
});
