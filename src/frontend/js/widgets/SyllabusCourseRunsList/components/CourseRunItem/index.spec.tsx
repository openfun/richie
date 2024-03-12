import { screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CourseRunFactory } from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import CourseRunItem from '.';

describe('CourseRunItem', () => {
  it('should render title, start and end date of the course run', () => {
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    render(
      <IntlProvider locale="en">
        <CourseRunItem item={courseRun} />
      </IntlProvider>,
      { wrapper: null },
    );

    // First title letter should have been capitalized
    // Dates should have been formatted as "Month day, year"
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
  });

  it('should only render start and end dates of the course run when title is undefined', () => {
    const courseRun = CourseRunFactory({
      title: undefined,
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    render(
      <IntlProvider locale="en">
        <CourseRunItem item={courseRun} />
      </IntlProvider>,
      { wrapper: null },
    );

    // Only dates should have been displayed.
    screen.getByText('From Jan 01, 2023 to Dec 31, 2023');
  });
});
