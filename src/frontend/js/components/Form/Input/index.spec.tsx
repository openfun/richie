import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { FormProvider, useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import Input from '.';

interface TestFormValues {
  firstName: string;
}

describe('<Input/>', () => {
  let user: UserEvent;

  const Wrapper = ({ children, defaultValue }: PropsWithChildren & { defaultValue?: string }) => {
    const form = useForm<TestFormValues>({
      defaultValues: {
        firstName: defaultValue,
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
        <Input label="FirstName" name="firstName" />
      </Wrapper>,
    );
    const cunninghamInput = screen.getByRole('textbox', { name: 'FirstName' });
    expect(cunninghamInput).toHaveValue('');
  });

  it('should change Input value', async () => {
    render(
      <Wrapper>
        <Input label="FirstName" name="firstName" />
      </Wrapper>,
    );

    const cunninghamInput = screen.getByRole('textbox', { name: 'FirstName' });
    await user.type(cunninghamInput, 'Robert');
    expect(cunninghamInput).toHaveValue('Robert');
  });

  it('should initialize with default value', () => {
    render(
      <Wrapper defaultValue="Robert">
        <Input label="FirstName" name="firstName" />
      </Wrapper>,
    );
    const cunninghamInput = screen.getByRole('textbox', { name: 'FirstName' });
    expect(cunninghamInput).toHaveValue('Robert');
  });

  it('should Input a value', async () => {
    render(
      <Wrapper defaultValue="Robert">
        <Input label="FirstName" name="firstName" />
      </Wrapper>,
    );
    const cunninghamInput = screen.getByRole('textbox', { name: 'FirstName' });
    userEvent.clear(cunninghamInput);
    expect(cunninghamInput).toHaveValue('');
  });
});
