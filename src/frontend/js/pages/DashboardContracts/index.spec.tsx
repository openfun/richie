import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Contract } from 'types/Joanie';
import { resolveAll } from 'utils/resolveAll';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError, expectBannerInfo } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { ContractFactory } from 'utils/test/factories/joanie';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {},
  scroll: jest.fn(),
}));

describe('<DashboardContract/>', () => {
  const Wrapper = () => (
    <BaseJoanieAppWrapper queryOptions={{ client: createTestQueryClient({ user: true }) }}>
      <DashboardTest initialRoute={LearnerDashboardPaths.CONTRACTS} />
    </BaseJoanieAppWrapper>
  );

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders an empty list of contract', async () => {
    const listContractsDeferred = new Deferred();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/contracts/?page=1&page_size=10',
      listContractsDeferred.promise,
    );

    render(<Wrapper />);

    // Make sure the spinner appear during first load.
    await expectSpinner('Loading training contracts...');

    listContractsDeferred.resolve({
      results: [],
      next: null,
      previous: null,
      count: 30,
    });
    await expectNoSpinner('Loading training contract...');

    await expectBannerInfo('You have no training contract yet.');
  });

  it('renders 3 pages of contracts', async () => {
    const contracts: Contract[] = ContractFactory().many(30);
    const contractPage1 = contracts.slice(0, 10);
    const contractPage2 = contracts.slice(10, 20);

    fetchMock.get('https://joanie.endpoint/api/v1.0/contracts/?page=1&page_size=10', {
      results: contractPage1,
      next: null,
      previous: null,
      count: 30,
    });

    fetchMock.get('https://joanie.endpoint/api/v1.0/contracts/?page=2&page_size=10', contractPage2);

    render(<Wrapper />);

    await expectNoSpinner('Loading contracts...');

    // Make sure the first page is loaded.
    await screen.findByText('Currently reading page 1');
    await resolveAll(contractPage1, async (contract) => {
      await screen.findByText(contract.definition.title);
    });

    // Go to page 2.
    const user = userEvent.setup();
    await user.click(screen.getByText('Next page 2'));

    // Make sure the second page is loaded.
    await screen.findByText('Currently reading page 2');
    await resolveAll(contractPage2, async (contract) => {
      await screen.findByText(contract.definition.title);
    });

    // Go back to page 1.
    await user.click(screen.getByText('Previous page 1'));

    await screen.findByText('Currently reading page 1');
    await resolveAll(contractPage1, async (contract) => {
      await screen.findByText(contract.definition.title);
    });
  });

  it('shows an error when request to retrieve contract fails', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/contracts/?page=1&page_size=10', {
      status: 500,
      body: 'Internal error',
    });

    render(<Wrapper />);

    // Make sure error is shown.
    await expectBannerError('An error occurred while fetching contracts. Please retry later.');

    // ... and the spinner hidden.
    await expectNoSpinner('Loading ...');
  });
});
