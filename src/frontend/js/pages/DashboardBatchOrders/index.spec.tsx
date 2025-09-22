import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardBatchOrders } from './index';
import { useBatchOrders } from 'hooks/useBatchOrder/useBatchOrder';
import { BatchOrderState } from 'types/Joanie';

jest.mock('hooks/useBatchOrder/useBatchOrder', () => ({
  useBatchOrders: jest.fn(),
}));

jest.mock('widgets/Dashboard/components/DashboardItem/BatchOrder', () => ({
  DashboardItemBatchOrder: jest.fn(({ batchOrder }) => <div>{batchOrder.title}</div>),
}));

describe('<DashboardBatchOrders />', () => {
  const queryClient = new QueryClient();

  it('renders empty placeholder', async () => {
    (useBatchOrders as jest.Mock).mockReturnValue({
      items: [],
      meta: { pagination: { count: 0 } },
      states: { isPending: false, error: null },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <DashboardBatchOrders />
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('You have no batch orders yet.')).toBeInTheDocument();
  });

  it('renders a list of batch orders', async () => {
    const mockItems = [
      { id: '1', title: 'Batch Order 1', state: BatchOrderState.PENDING },
      { id: '2', title: 'Batch Order 2', state: BatchOrderState.COMPLETED },
      { id: '3', title: 'Batch Order 3', state: BatchOrderState.CANCELED },
    ];

    (useBatchOrders as jest.Mock).mockReturnValue({
      items: mockItems,
      meta: { pagination: { count: 3 } },
      states: { isPending: false, error: null },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <DashboardBatchOrders />
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Batch Order 1')).toBeInTheDocument();
    expect(screen.getByText('Batch Order 2')).toBeInTheDocument();
    expect(screen.queryByText('Batch Order 3')).not.toBeInTheDocument();
  });

  it('renders an error banner when there is an error', async () => {
    const errorMessage = 'API Error';

    (useBatchOrders as jest.Mock).mockReturnValue({
      items: [],
      meta: { pagination: { count: 0 } },
      states: { isPending: false, error: errorMessage },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <DashboardBatchOrders />
        </IntlProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});
