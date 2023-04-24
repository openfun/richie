import { fireEvent, getByRole, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import { ProductFactory } from 'utils/test/factories/joanie';
import { SaleTunnelStepValidation } from '.';

describe('SaleTunnelStepValidation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows product information and details course runs included', () => {
    const product = ProductFactory().one();

    const mockNext = jest.fn();

    const { container } = render(
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

    const courses = container.querySelectorAll('.product-detail-row--course');
    expect(courses).toHaveLength(product.target_courses.length);
    courses.forEach((course, index) => {
      const courseItem = product.target_courses[index];
      expect(
        getByRole(course as HTMLElement, 'heading', {
          level: 3,
          name: courseItem.title,
        }),
      );

      const courseRuns = course.querySelectorAll('.product-detail-row__course-run-dates__item');
      // Only course runs opened for enrollment should be displayed
      const openedCourseRuns = courseItem.course_runs.filter(
        (cr: Joanie.CourseRun) => cr.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
      expect(courseRuns).toHaveLength(openedCourseRuns.length);
    });

    const certificate = container.querySelector('.product-detail-row--certificate');
    expect(certificate).not.toBeNull();
    expect(
      getByRole(container, 'heading', { level: 3, name: product.certificate_definition.title }),
    );

    // Click on the button trigger the next function
    const button = screen.getByRole('button', { name: 'Proceed to payment' });
    fireEvent.click(button);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
