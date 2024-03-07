import * as joanieFactories from './joanieLegacy';

describe('Factories joanie', () => {
  it.each(Object.entries(joanieFactories))('can instanciate %s', (name, Factory) => {
    expect(() => Factory().one()).not.toThrow(Error);
  });
});
