import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import { Pagination, usePagination } from 'components/Pagination/index';
import { History, HistoryContext } from 'hooks/useHistory';

jest.mock('utils/indirection/window', () => ({
  location: {},
  scroll: jest.fn(),
}));

describe('<Pagination/>', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = () => [
    {
      state: { name: '', data: {} },
      title: '',
      url: `/`,
    },
    historyPushState,
    historyReplaceState,
  ];
  it('does not display pagination ( 0 pages )', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    await waitFor(() => expect(pagination.result.current.maxPage).toBeUndefined());
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });
  it('does not display pagination for 1 page', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(10));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(1));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });
  it('displays pagination for 2 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(20));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(2));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Last page 2');
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });
  it('displays pagination for 3 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(29));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(3));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Last page 3');
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });
  it('displays pagination for 4 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(40));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(4));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Page 3');
    screen.getByText('4');
    screen.getByText('Last page 4');
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });
  it('displays pagination for 5 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(50));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(5));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Page 3');
    screen.getByText('4');
    screen.getByText('Page 4');
    screen.getByText('5');
    screen.getByText('Last page 5');
    expect(screen.queryByText('...')).not.toBeInTheDocument();
  });
  it('displays pagination for 6 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(56));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(6));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Page 3');
    screen.getByText('...');
    screen.getByText('6');
    screen.getByText('Last page 6');
  });
  it('displays pagination for 6 pages with current = 3', async () => {
    const Wrapper = () => {
      const pagination = usePagination({ itemsPerPage: 10 });
      useEffect(() => {
        pagination.setItemsCount(53);
      }, []);
      return (
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <Pagination {...pagination} />
          </HistoryContext.Provider>
        </IntlProvider>
      );
    };
    render(<Wrapper />);

    await userEvent.click(screen.getByText('Page 3'));
    screen.getByTestId('pagination');
    screen.getAllByText('Page 1');
    screen.getByText('Previous page 2');
    screen.getByText('2');
    screen.getByText('Currently reading page 3');
    screen.getByText('3');
    screen.getByText('Next page 4');
    screen.getByText('4');
    screen.getByText('Page 5');
    screen.getByText('5');
    screen.getByText('Last page 6');
    screen.getByText('6');
  });
  it('displays pagination for 10 pages', async () => {
    const pagination = renderHook(() => usePagination({ itemsPerPage: 10 }));
    act(() => pagination.result.current.setItemsCount(100));
    await waitFor(() => expect(pagination.result.current.maxPage).toBe(10));
    render(
      <IntlProvider locale="en">
        <Pagination {...pagination.result.current} />
      </IntlProvider>,
    );
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Page 3');
    screen.getByText('...');
    screen.getByText('10');
    screen.getByText('Last page 10');
  });
  it('displays pagination for 15 pages with current = 7', async () => {
    const Wrapper = () => {
      const pagination = usePagination({ itemsPerPage: 10 });
      useEffect(() => {
        pagination.setItemsCount(150);
      }, []);
      return (
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <Pagination {...pagination} />
          </HistoryContext.Provider>
        </IntlProvider>
      );
    };
    render(<Wrapper />);
    screen.getByTestId('pagination');
    screen.getByText('Page 1');
    screen.getByText('Currently reading page 1');
    screen.getByText('2');
    screen.getByText('Next page 2');
    screen.getByText('3');
    screen.getByText('Page 3');
    screen.getByText('...');
    screen.getByText('15');
    screen.getByText('Last page 15');

    await userEvent.click(screen.getByText('Page 3'));
    await screen.findByText('Currently reading page 3');

    await userEvent.click(screen.getByText('Page 5'));
    await screen.findByText('Currently reading page 5');

    await userEvent.click(screen.getByText('Page 7'));

    await screen.findAllByText('Page 1');
    expect(screen.getAllByText('...').length).toBe(2);
    screen.getByText('Page 5');
    screen.getByText('Previous page 6');
    screen.getByText('Currently reading page 7');
    screen.getByText('Next page 8');
    screen.getByText('Page 9');
    // "..." again here ( that's why we expect 2 times "..." above )
    screen.getByText('15');
    screen.getByText('Last page 15');
  });
});
