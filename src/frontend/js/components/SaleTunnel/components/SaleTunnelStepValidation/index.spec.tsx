import { fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { userEvent } from '@storybook/testing-library';
import { Priority } from 'types';
import { CourseRun, ProductType } from 'types/Joanie';
import {
  CertificateProductFactory,
  CourseRunFactory,
  CredentialProductFactory,
} from 'utils/test/factories/joanie';
import { SaleTunnelStepValidation } from '.';

describe('SaleTunnelStepValidation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    { productType: ProductType.CERTIFICATE, instructions: true },
    { productType: ProductType.CREDENTIAL, instructions: true },
    { productType: ProductType.CERTIFICATE, instructions: false },
    { productType: ProductType.CREDENTIAL, instructions: false },
  ])('shows generic informations for product %s', async ({ productType, instructions }) => {
    const productInstructions = instructions ? '<h2>Product instructions</h2>' : null;
    let product = CredentialProductFactory({
      instructions: productInstructions,
    }).one();
    if (productType === ProductType.CERTIFICATE) {
      product = CertificateProductFactory({
        instructions: productInstructions,
      }).one();
    }

    const mockNext = jest.fn();
    render(
      <IntlProvider locale="en">
        <SaleTunnelStepValidation next={mockNext} product={product} />
      </IntlProvider>,
    );

    const formatter = new Intl.NumberFormat('en', {
      currency: product.price_currency,
      style: 'currency',
    });

    screen.getByRole('heading', { level: 2, name: product.title });
    screen.getByText(`${formatter.format(product.price).replaceAll(' ', ' ')} including VAT`);

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
      <IntlProvider locale="en">
        <SaleTunnelStepValidation next={jest.fn()} product={product} />
      </IntlProvider>,
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
    const courseRun = CourseRunFactory().one();
    render(
      <IntlProvider locale="en">
        <SaleTunnelStepValidation next={jest.fn()} product={product} courseRun={courseRun} />
      </IntlProvider>,
    );
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: courseRun.course.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('course-run-list-item')).toBeInTheDocument();
  });
});
