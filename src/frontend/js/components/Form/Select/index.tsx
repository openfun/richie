import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Select as CunninghamSelect,
  SelectProps as CunninghamSelectProps,
} from '@openfun/cunningham-react';
import { useIntl } from 'react-intl';
import { getLocalizedCunninghamErrorProp } from '../utils';

export interface SelectProps extends CunninghamSelectProps {
  name: string;
}

const Select = (props: SelectProps) => {
  const intl = useIntl();
  const { control, setValue, formState } = useFormContext();
  const error = props.name in formState.errors ? formState.errors[props.name] : undefined;
  return (
    <Controller
      control={control}
      name={props.name}
      render={({ field }) => (
        <CunninghamSelect
          {...props}
          onBlur={(e) => {
            field.onBlur();
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setValue(field.name, e.target.value);
            props.onChange?.(e);
          }}
          value={field.value}
          aria-invalid={!!error}
          state={error ? 'error' : 'default'}
          {...getLocalizedCunninghamErrorProp(intl, error ? (error.message as string) : undefined)}
        />
      )}
    />
  );
};

export default Select;
