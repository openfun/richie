import { getByRole, getByText, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import faker from 'faker';
import {
  JoanieCourseRunFactory,
  JoanieEnrollmentFactory,
  OrderFactory,
} from 'utils/test/factories';
import { DashboardItemOrder } from 'components/DashboardItem/DashboardItemOrder';
import { Order } from 'types/Joanie';
import { DEFAULT_DATE_FORMAT } from 'utils/useDateFormat';

describe('<DashboardItemOrder/>', () => {
  it('renders component without enrollments', () => {
    const order: Order = OrderFactory.generate();

    render(
      <IntlProvider locale="en">
        <DashboardItemOrder order={order} />
      </IntlProvider>,
    );
    screen.getByRole('heading', { level: 5, name: order.course!.title });
    const button = screen.getByRole('link', { name: 'ACCESS COURSE' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('href', '/dashboard/courses/' + order.course!.code);
  });

  it('renders component with enrollments', () => {
    const order: Order = {
      ...OrderFactory.generate(),
      enrollments: [
        {
          ...JoanieEnrollmentFactory.generate(),
          course_run: {
            ...JoanieCourseRunFactory({ course: true }).generate(),
            enrollment_start: faker.date.past(0.25).toISOString(),
            enrollment_end: faker.date.future(0.5).toISOString(),
            start: faker.date.future(0.75).toISOString(),
            end: faker.date.future(1.0).toISOString(),
          },
        },
        {
          ...JoanieEnrollmentFactory.generate(),
          course_run: {
            ...JoanieCourseRunFactory({ course: true }).generate(),
            enrollment_start: faker.date.past(1).toISOString(),
            enrollment_end: faker.date.past(0.75).toISOString(),
            start: faker.date.past(0.25).toISOString(),
            end: faker.date.past(0.5).toISOString(),
          },
        },
      ],
    };

    render(
      <IntlProvider locale="en">
        <DashboardItemOrder order={order} />
      </IntlProvider>,
    );
    screen.getByRole('heading', { level: 5, name: order.course!.title });
    const button = screen.getAllByRole('link', { name: 'ACCESS COURSE' })[0];
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('href', '/dashboard/courses/' + order.course!.code);

    // First enrollment.
    {
      const element = screen.getByText(order.enrollments[0].course_run.course!.title);
      const container = element.closest('[data-testid=dashboard-sub-item]') as HTMLElement;
      const link = getByRole(container, 'link', { name: 'ACCESS COURSE' });
      expect(link).toBeEnabled();
      expect(link).toHaveAttribute('href', order.enrollments[0].course_run.resource_link);
      getByText(
        container,
        'COURSE OPEN • Started on ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
            new Date(order.enrollments[0].course_run.start),
          ),
      );
    }

    // Second enrollment.
    {
      const element = screen.getByText(order.enrollments[1].course_run.course!.title);
      const container = element.closest('[data-testid=dashboard-sub-item]') as HTMLElement;
      const link = getByRole(container, 'link', { name: 'ACCESS COURSE' });
      expect(link).toBeEnabled();
      expect(link).toHaveAttribute('href', order.enrollments[1].course_run.resource_link);
      getByText(
        container,
        'CLOSED • Finished on ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
            new Date(order.enrollments[1].course_run.end),
          ),
      );
    }
  });
});
