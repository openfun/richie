import { render, screen, within } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { CunninghamProvider, Option } from '@openfun/cunningham-react';
import { FormProvider, useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import { changeSelect, clearSelect } from '../test-utils';
import Select from '.';

interface TestFormValues {
  country: string;
}

describe('<Select/>', () => {
  let user: UserEvent;
  const countryOptions: Option[] = [
    {
      label: 'France',
      value: 'fr',
    },
    {
      label: 'England',
      value: 'en',
    },
  ];
  const Wrapper = ({
    children,
    defaultOptionValue,
  }: PropsWithChildren & { defaultOptionValue?: string }) => {
    const form = useForm<TestFormValues>({
      defaultValues: {
        country: defaultOptionValue,
      },
    });
    return (
      <IntlProvider locale="en">
        <CunninghamProvider>
          <FormProvider {...form}>{children}</FormProvider>
        </CunninghamProvider>
      </IntlProvider>
    );
  };
  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should initialize empty', () => {
    render(
      <Wrapper>
        <Select label="Country" options={countryOptions} name="country" />
      </Wrapper>,
    );
    const cunninghamSelect = screen.getByRole('combobox', { name: 'Country' });
    expect(
      within(cunninghamSelect).queryByDisplayValue(countryOptions[0].label),
    ).not.toBeInTheDocument();
    expect(
      within(cunninghamSelect).queryByDisplayValue(countryOptions[1].label),
    ).not.toBeInTheDocument();
  });

  it('should change select value', async () => {
    render(
      <Wrapper>
        <Select label="Country" options={countryOptions} name="country" />
      </Wrapper>,
    );

    const selectOption = countryOptions[0];
    const cunninghamSelect = screen.getByRole('combobox', { name: 'Country' });
    await changeSelect(cunninghamSelect, selectOption.label, user);
    expect(within(cunninghamSelect).getByDisplayValue(selectOption.value!)).toBeInTheDocument();
  });

  it('should initialize with default value', () => {
    const defaultOption = countryOptions[0];
    render(
      <Wrapper defaultOptionValue={defaultOption.value}>
        <Select label="Country" options={countryOptions} name="country" />
      </Wrapper>,
    );
    const cunninghamSelect = screen.getByRole('combobox', { name: 'Country' });
    expect(within(cunninghamSelect).getByDisplayValue(defaultOption.value!)).toBeInTheDocument();
  });

  it('should clear selected a value', async () => {
    const defaultOption = countryOptions[0];
    render(
      <Wrapper defaultOptionValue={defaultOption.value}>
        <Select label="Country" options={countryOptions} name="country" />
      </Wrapper>,
    );
    const cunninghamSelect = screen.getByRole('combobox', { name: 'Country' });
    await clearSelect(cunninghamSelect);
    expect(
      within(cunninghamSelect).queryByDisplayValue(defaultOption.value!),
    ).not.toBeInTheDocument();
  });
});
