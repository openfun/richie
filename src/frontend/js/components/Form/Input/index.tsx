import {
  InputProps as CunninghamInputProps,
  Input as CunninghamInput,
} from '@openfun/cunningham-react';
import { Controller, useFormContext } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { getLocalizedCunninghamErrorProp } from '../utils';

export interface InputProps extends CunninghamInputProps {
  name: string;
}

const Input = (props: InputProps) => {
  const intl = useIntl();
  const { control, setValue, formState } = useFormContext();
  const error = props.name in formState.errors ? formState.errors[props.name] : undefined;
  return (
    <Controller
      control={control}
      name={props.name}
      render={({ field }) => {
        return (
          <CunninghamInput
            {...props}
            aria-invalid={!!error}
            state={error ? 'error' : 'default'}
            {...getLocalizedCunninghamErrorProp(
              intl,
              error ? (error.message as string) : undefined,
            )}
            onBlur={(e) => {
              field.onBlur();
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setValue(field.name, e.target.value);
              props.onChange?.(e);
            }}
            value={field.value}
          />
        );
      }}
    />
  );
};

export default Input;
