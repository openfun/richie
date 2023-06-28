import { faker } from '@faker-js/faker';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { act, renderHook } from '@testing-library/react';
import { Maybe } from 'types/utils';
import validationSchema from './validationSchema';

describe('validationSchema', () => {
  // Creation and Update form validation relies on a schema resolves by Yup.
  it('should not have error if values are valid', async () => {
    const defaultValues = {
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.countryCode(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      postcode: faker.location.zipCode(),
      title: faker.lorem.word(),
      save: false,
    };

    const { result } = renderHook(() =>
      useForm({
        defaultValues,
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('first_name');
    result.current.register('last_name');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    await act(async () => {
      result.current.trigger();
    });

    const { formState } = result.current;

    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(true);
  });

  it('should have an error if values are invalid', async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: yupResolver(validationSchema),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    result.current.formState.errors;
    result.current.register('address');
    result.current.register('city');
    result.current.register('country');
    result.current.register('first_name');
    result.current.register('last_name');
    result.current.register('postcode');
    result.current.register('title');
    result.current.register('save');

    // - Trigger form validation with empty values
    await act(async () => {
      result.current.trigger();
    });

    let { formState } = result.current;

    type ErrorMessageObject = Maybe<{ key: string; values: Record<any, any> }>;

    expect(formState.errors.address?.type).toEqual('optionality');
    expect((formState.errors.address?.message as ErrorMessageObject)?.key).toEqual('mixedRequired');
    expect((formState.errors.address?.message as ErrorMessageObject)?.values?.path).toEqual(
      'address',
    );
    expect(formState.errors.city?.type).toEqual('optionality');
    expect((formState.errors.city?.message as ErrorMessageObject)?.key).toEqual('mixedRequired');
    expect((formState.errors.city?.message as ErrorMessageObject)?.values?.path).toEqual('city');
    expect(formState.errors.country?.type).toEqual('optionality');
    expect((formState.errors.country?.message as ErrorMessageObject)?.key).toEqual('mixedRequired');
    expect((formState.errors.country?.message as ErrorMessageObject)?.values?.path).toEqual(
      'country',
    );
    expect(formState.errors.first_name?.type).toEqual('optionality');
    expect((formState.errors.first_name?.message as ErrorMessageObject)?.key).toEqual(
      'mixedRequired',
    );
    expect((formState.errors.first_name?.message as ErrorMessageObject)?.values?.path).toEqual(
      'first_name',
    );
    expect(formState.errors.last_name?.type).toEqual('optionality');
    expect((formState.errors.last_name?.message as ErrorMessageObject)?.key).toEqual(
      'mixedRequired',
    );
    expect((formState.errors.last_name?.message as ErrorMessageObject)?.values?.path).toEqual(
      'last_name',
    );
    expect(formState.errors.postcode?.type).toEqual('optionality');
    expect((formState.errors.postcode?.message as ErrorMessageObject)?.key).toEqual(
      'mixedRequired',
    );
    expect((formState.errors.postcode?.message as ErrorMessageObject)?.values?.path).toEqual(
      'postcode',
    );
    expect(formState.errors.title?.type).toEqual('optionality');
    expect((formState.errors.title?.message as ErrorMessageObject)?.key).toEqual('mixedRequired');
    expect((formState.errors.title?.message as ErrorMessageObject)?.values?.path).toEqual('title');
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(false);

    // - Set values for all field but with a wrong one for country field
    await act(async () => {
      result.current.setValue('address', faker.location.streetAddress());
      result.current.setValue('city', faker.location.city());
      // set country value with an invalid country code
      result.current.setValue('country', 'AA');
      result.current.setValue('first_name', faker.person.firstName());
      result.current.setValue('last_name', faker.person.lastName());
      result.current.setValue('postcode', faker.location.zipCode());
      result.current.setValue('title', faker.lorem.word());
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country?.type).toEqual('oneOf');
    expect((formState.errors.country?.message as ErrorMessageObject)?.key).toEqual('mixedOneOf');
    expect((formState.errors.country?.message as ErrorMessageObject)?.values?.path).toEqual(
      'country',
    );
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(false);

    // - Set country value with a valid country code
    await act(async () => {
      result.current.setValue('country', 'FR');
      result.current.trigger();
    });

    formState = result.current.formState;
    expect(formState.errors.address).not.toBeDefined();
    expect(formState.errors.city).not.toBeDefined();
    expect(formState.errors.country).not.toBeDefined();
    expect(formState.errors.first_name).not.toBeDefined();
    expect(formState.errors.last_name).not.toBeDefined();
    expect(formState.errors.postcode).not.toBeDefined();
    expect(formState.errors.title).not.toBeDefined();
    expect(formState.errors.save).not.toBeDefined();
    expect(formState.isValid).toBe(true);
  });
});
