import { createIntl } from 'react-intl';
import { screen } from '@testing-library/react';
import { getAllByRole, within } from '@testing-library/dom';
import { faker } from '@faker-js/faker';
import { NestedCourseOrderFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { PaginationFactory } from 'utils/test/factories/cunningham';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { OrderState } from 'types/Joanie';
import { render } from 'utils/test/render';
import { PresentationalAppWrapper } from 'utils/test/wrappers/PresentationalAppWrapper';
import CourseLearnerDataGrid from '.';

describe('pages/CourseLearnerDataGrid', () => {
  it('should render a list of user', async () => {
    const courseOrderList = NestedCourseOrderFactory({
      state: OrderState.VALIDATED,
      certificate_id: faker.string.uuid(),
    }).many(3);
    render(
      <CourseLearnerDataGrid
        courseOrders={courseOrderList}
        sortModel={[
          {
            field: 'created_on',
            sort: 'asc',
          },
        ]}
        setSortModel={jest.fn()}
        pagination={PaginationFactory().one()}
        isLoading={false}
      />,
      { wrapper: PresentationalAppWrapper },
    );

    await expectNoSpinner();

    // Table header should have been rendered with 5 columns
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(5);
    // avatar column have no header
    expect(columnHeaders[0]).toHaveTextContent('');
    expect(columnHeaders[1]).toHaveTextContent('Learner');
    expect(columnHeaders[2]).toHaveTextContent('Enrolled on');
    expect(columnHeaders[3]).toHaveTextContent('State');
    expect(columnHeaders[4]).toHaveTextContent('Actions');

    const intl = createIntl({ locale: 'en' });
    // Table body should have been rendered with 3 rows (one per contract)
    courseOrderList.forEach((courseOrder) => {
      const row = screen.getByTestId(courseOrder.id);
      const cells = getAllByRole(row, 'cell');
      expect(cells.length).toBe(5);
      expect(cells[1]).toHaveTextContent(courseOrder.owner.full_name);
      expect(cells[2]).toHaveTextContent(
        intl.formatDate(new Date(courseOrder.created_on), DEFAULT_DATE_FORMAT),
      );
      expect(cells[3]).toHaveTextContent('Certified');
      expect(within(cells[4]).getByText('Contact')).toBeInTheDocument();
    });
  });
});
