import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardBatchOrders } from './index';
import { useBatchOrders } from 'hooks/useBatchOrder/useBatchOrder';

jest.mock('hooks/useBatchOrder/useBatchOrder', () => ({
  useBatchOrders: jest.fn(),
}));

describe('<DashboardBatchOrders />', () => {
  const queryClient = new QueryClient();

  it('renders empty placeholder', async () => {
    // Mock retourne aucun batch order et aucun état d’erreur
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
});
