import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BatchOrderReadFactory } from 'utils/test/factories/joanie';
import { DashboardItemBatchOrder } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<DashboardItemBatchOrder />', () => {
  setupJoanieSession();

  it('renders a batch order', async () => {
    const batchOrder = BatchOrderReadFactory().one();
    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/`, [batchOrder]);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/batch-orders/${batchOrder.id}/`, batchOrder);
    render(<DashboardItemBatchOrder batchOrder={batchOrder} />);
    expect(await screen.findByText(batchOrder.offering?.product.title)).toBeVisible();
  });
});
