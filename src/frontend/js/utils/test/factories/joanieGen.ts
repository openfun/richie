import { faker } from '@faker-js/faker';
import { Address, CountryEnum } from 'api/joanie/gen';
import { factory } from './factories';
import { FactoryHelper } from './helper';

export const AddressFactory = factory((): Address => {
  return {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.countryCode() as CountryEnum,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    id: faker.string.uuid(),
    is_main: false,
    postcode: faker.location.zipCode(),
    title: FactoryHelper.sequence((counter) => `Address ${counter}`),
  };
});
