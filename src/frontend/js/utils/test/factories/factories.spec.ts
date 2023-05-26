import { faker } from '@faker-js/faker';
import { factory } from './factories';

interface DemoPointOfInterest {
  name: string;
}

interface DemoAddress {
  street: string;
  city: string;
  pointOfInterests: DemoPointOfInterest[];
}

interface DemoUser {
  fullname: string;
  username?: string;
  mainAddress: DemoAddress;
  addresses: DemoAddress[];
}

describe('factory', () => {
  const DemoPointOfInterestFactory = factory<DemoPointOfInterest>(() => {
    return {
      name: faker.lorem.word(),
    };
  });
  const DemoAddressFactory = factory<DemoAddress>(() => {
    return {
      city: faker.location.city(),
      street: faker.location.street(),
      pointOfInterests: DemoPointOfInterestFactory().many(3),
    };
  });
  const DemoUserFactory = factory<DemoUser>((options) => {
    let fullname = faker.person.fullName();
    if (options?.generateIndex !== undefined) {
      fullname += `_${options.generateIndex}`;
    }
    return {
      fullname,
      username: faker.internet.userName(),
      mainAddress: DemoAddressFactory().one(),
      addresses: DemoAddressFactory().many(3),
      favoriteColors: Array(2).fill(faker.color.human()),
    };
  });

  it('generates one entity', () => {
    const generatedUser = DemoUserFactory({
      fullname: 'toto',
      mainAddress: { city: 'Paris' },
    }).one();

    expect(generatedUser.fullname).toEqual('toto');
    expect(generatedUser.username).not.toEqual('toto');
    expect(Object.keys(generatedUser)).toEqual([
      'fullname',
      'username',
      'mainAddress',
      'addresses',
      'favoriteColors',
    ]);
    expect(typeof generatedUser.username).toEqual('string');
    expect(typeof generatedUser.mainAddress.street).toEqual('string');
    expect(generatedUser.mainAddress.city).toEqual('Paris');
    expect(generatedUser.addresses.length).toEqual(3);
  });

  it('generates many entities', () => {
    const generatedUserList = DemoUserFactory({
      fullname: 'toto',
      mainAddress: { city: 'Paris' },
    }).many(2);

    expect(generatedUserList.length).toEqual(2);
    const [firstUser, secondUser] = generatedUserList;
    expect(firstUser.fullname).toEqual('toto');
    expect(firstUser.username).not.toEqual('toto');
    expect(Object.keys(firstUser)).toEqual([
      'fullname',
      'username',
      'mainAddress',
      'addresses',
      'favoriteColors',
    ]);
    expect(typeof firstUser.username).toEqual('string');
    expect(typeof secondUser.mainAddress.street).toEqual('string');
    expect(secondUser.mainAddress.city).toEqual('Paris');

    expect(secondUser.fullname).toEqual('toto');
    expect(secondUser.username).not.toEqual('toto');
    expect(Object.keys(secondUser)).toEqual([
      'fullname',
      'username',
      'mainAddress',
      'addresses',
      'favoriteColors',
    ]);
    expect(typeof secondUser.username).toEqual('string');
    expect(typeof secondUser.mainAddress.street).toEqual('string');
    expect(secondUser.mainAddress.city).toEqual('Paris');
  });

  // generatedIndex only work's on factory definition
  // it's not working with override data.
  it('allow usage of "generatedIndex" in factory\'s property', () => {
    const generatedUserList = DemoUserFactory().many(2);
    const [firstUser, secondUser] = generatedUserList;
    expect(firstUser.fullname.slice(-2)).toEqual('_0');
    expect(secondUser.fullname.slice(-2)).toEqual('_1');
  });

  it('generates override property with undefined', () => {
    const generatedUser = DemoUserFactory({
      username: undefined,
    }).one();
    expect(generatedUser.username).toBeUndefined();
  });

  it('generates override array property', () => {
    const generatedUser = DemoUserFactory({
      fullname: 'toto',
      addresses: DemoAddressFactory().many(1),
    }).one();
    expect(generatedUser.addresses.length).toEqual(1);
  });

  it('generates override deep array property', () => {
    const generatedUser = DemoUserFactory({
      fullname: 'toto',
      addresses: [
        {
          city: 'skyline',
          street: 'angel street',
          pointOfInterests: [{ name: 'some clouds' }],
        },
      ],
    }).one();
    expect(generatedUser.addresses.length).toEqual(1);
    const [address] = generatedUser.addresses;
    expect(address.pointOfInterests.length).toEqual(1);
  });

  it('generates override deep array property with sub factories', () => {
    const generatedUser = DemoUserFactory({
      fullname: 'toto',
      addresses: DemoAddressFactory({
        city: 'skyline',
        street: 'angel street',
        pointOfInterests: DemoPointOfInterestFactory({ name: 'some clouds' }).many(1),
      }).many(1),
    }).one();
    expect(generatedUser.addresses.length).toEqual(1);
    const [address] = generatedUser.addresses;
    expect(address.pointOfInterests.length).toEqual(1);
  });
});
