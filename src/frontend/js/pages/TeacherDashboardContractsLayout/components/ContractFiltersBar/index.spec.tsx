import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { render, screen, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';
import { userEvent } from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ContractState } from 'types/Joanie';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { noop } from 'utils';
import ContractFiltersBar from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('<ContractFiltersBar/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user: true })}>
          <JoanieSessionProvider>
            <CunninghamProvider>{children}</CunninghamProvider>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('should render SignatureState and Organization filters with default value', async () => {
    const filterChange = jest.fn();
    const organizations = OrganizationFactory().many(2);
    const defaultValues = {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: organizations[1].id,
    };

    fetchMock.get('https://joanie.test/api/v1.0/organizations/', organizations);

    render(
      <Wrapper>
        <ContractFiltersBar onFiltersChange={filterChange} defaultValues={defaultValues} />
      </Wrapper>,
    );

    await waitFor(() => expectNoSpinner());

    // Two selects should have rendered
    const organizationFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).toHaveAttribute('value', organizations[1].title);

    const signatureStateFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    const value = (signatureStateFilter.querySelector('input[type="hidden"]') as HTMLInputElement)
      ?.value;
    expect(value).toBe('half_signed');

    expect(filterChange).not.toHaveBeenCalled();

    // Now change value of organization filter should trigger the onFiltersChange callback
    const user = userEvent.setup();
    await user.click(organizationFilter);
    let optionToSelect = screen.getByRole('option', { name: organizations[0].title });
    await user.click(optionToSelect);
    expect(filterChange).toHaveBeenNthCalledWith(1, { organization_id: organizations[0].id });

    // Then change value of signature state filter should trigger the onFiltersChange callback too
    filterChange.mockRestore();
    await user.click(signatureStateFilter);
    optionToSelect = screen.getByRole('option', { name: 'Signed' });
    await user.click(optionToSelect);
    expect(filterChange).toHaveBeenNthCalledWith(1, { signature_state: ContractState.SIGNED });
  });

  it('should allow to hide signatureState filter', async () => {
    const organizations = OrganizationFactory().many(2);
    const defaultValues = {
      organization_id: organizations[0].id,
    };

    fetchMock.get('https://joanie.test/api/v1.0/organizations/', organizations);

    render(
      <Wrapper>
        <ContractFiltersBar
          onFiltersChange={noop}
          defaultValues={defaultValues}
          hideFilterSignatureState={true}
        />
      </Wrapper>,
    );

    await waitFor(() => expectNoSpinner());

    // Organization filter should have been rendered
    screen.getByRole('combobox', { name: 'Organization' });

    // Signature state filter should have not been rendered
    const signatureStateFilter = screen.queryByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    expect(signatureStateFilter).not.toBeInTheDocument();
  });

  it('should allow to hide organization filter', async () => {
    const organizations = OrganizationFactory().many(2);
    const defaultValues = {
      organization_id: organizations[0].id,
    };

    fetchMock.get('https://joanie.test/api/v1.0/organizations/', organizations);

    render(
      <Wrapper>
        <ContractFiltersBar
          onFiltersChange={noop}
          defaultValues={defaultValues}
          hideFilterOrganization={true}
        />
      </Wrapper>,
    );

    await waitFor(() => expectNoSpinner());

    // Signature state filter should have been rendered
    screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', { name: 'Organization' });
    expect(organizationFilter).not.toBeInTheDocument();
  });

  it('should be able to select default value for organization if none are provided', async () => {
    const organizations = OrganizationFactory().many(2);
    const handleChange = jest.fn();

    fetchMock.get('https://joanie.test/api/v1.0/organizations/', organizations);

    render(
      <Wrapper>
        <ContractFiltersBar onFiltersChange={handleChange} />
      </Wrapper>,
    );

    await waitFor(() => expectNoSpinner());

    // Organization filter should have been rendered and the first organization should be selected
    const organizationFilter = screen.getByRole('combobox', { name: 'Organization' });
    expect(organizationFilter).toHaveAttribute('value', organizations[0].title);
    expect(handleChange).toHaveBeenNthCalledWith(1, { organization_id: organizations[0].id });
  });
});
