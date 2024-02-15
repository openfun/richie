import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { ContractState } from 'types/Joanie';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { noop } from 'utils';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import CourseLearnersFiltersBar from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<CourseLearnersFiltersBar/>', () => {
  setupJoanieSession();

  it('should render organization filter with default value', async () => {
    const filterChange = jest.fn();
    const organizations = OrganizationFactory().many(2);
    const defaultValues = {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: organizations[1].id,
    };

    render(
      <CourseLearnersFiltersBar
        onFiltersChange={filterChange}
        defaultValues={defaultValues}
        organizationList={organizations}
      />,
    );

    // Two selects should have rendered
    const organizationFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Organization',
    });

    expect(organizationFilter).toHaveAttribute('value', organizations[1].title);
    expect(filterChange).not.toHaveBeenCalled();

    // Now change value of organization filter should trigger the onFiltersChange callback
    const user = userEvent.setup();
    await user.click(organizationFilter);

    const optionToSelect = screen.getByRole('option', { name: organizations[0].title });
    await user.click(optionToSelect);
    expect(filterChange).toHaveBeenNthCalledWith(1, { organization_id: organizations[0].id });
  });

  it('should allow to hide organization filter', async () => {
    const organizations = OrganizationFactory().many(2);

    render(
      <CourseLearnersFiltersBar
        onFiltersChange={noop}
        hideFilterOrganization={true}
        organizationList={organizations}
      />,
    );

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', { name: 'Organization' });
    expect(organizationFilter).not.toBeInTheDocument();
  });
});
