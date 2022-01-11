declare module '@helpscout/helix' {
  // Utils types
  type DerivedValue<T> = T & { isDerivedValue: true };

  type ShapeExtractor<Spec> = Spec extends HelixSpec<infer Shape> ? Shape : Spec;

  type SpecValue<T> = {
    [K in keyof T]:
      | T[K]
      | ((...args: T[K] extends (...a: infer P) => any ? P : never[]) => T[K])
      | HelixSpec<T[K]>;
  };

  // HelixSpec Class
  class HelixSpec<ShapeType, IncomeType = ShapeType> {
    shape: SpecValue<ShapeType>;
    seedValue: undefined | number;
    _afterGenerate(props: ShapeType): IncomeType;
    generate(count: number, max?: number): IncomeType extends ShapeType ? ShapeType[] : IncomeType;
    generate(): IncomeType;
    extend<NewType>(
      ...specs: NewType[]
    ): HelixSpec<
      NewType & Omit<ShapeType, keyof NewType>,
      IncomeType extends ShapeType ? NewType & Omit<ShapeType, keyof NewType> : IncomeType
    >;
    beforeGenerate<NewType>(
      callback: (props: SpecValue<ShapeType>) => SpecValue<NewType>,
    ): HelixSpec<NewType, IncomeType extends ShapeType ? NewType : IncomeType>;
    afterGenerate<K>(callback: (props: ShapeType | ShapeType[]) => K): HelixSpec<ShapeType, K>;
    seed(seedValue: number): this;
  }

  // remapped faker
  type RemappedFaker<T extends Partial<Faker.FakerStatic> = Faker.FakerStatic> = {
    [K in keyof T]: T[K] extends Function
      ? (...args: T[K] extends (...a: infer P) => any ? P : never[]) => T[K]
      : RemappedFaker<T[K]>;
  };
  const faker: RemappedFaker;

  // derived
  function derived<T>(mapper: (shape: any) => T): DerivedValue<T>;

  // createSpec
  function createSpec<T>(specs: SpecValue<T>): HelixSpec<T>;

  // oneOf
  function oneOf<T extends SpecValue<any>[]>(
    specs: T,
  ): T extends { [key: number]: infer S }
    ? S extends HelixSpec<unknown>
      ? S
      : HelixSpec<S>
    : never;

  // compose
  function compose<S1 extends SpecValue<any>>(spec1: S1): HelixSpec<ShapeExtractor<S1>>;
  function compose<S1 extends SpecValue<any>, S2 extends SpecValue<any>>(
    spec1: S1,
    spec2: S2,
  ): HelixSpec<ShapeExtractor<S1> & ShapeExtractor<S2>>;
  function compose<S1 extends SpecValue<any>, S2 extends SpecValue<any>, S3 extends SpecValue<any>>(
    spec1: S1,
    spec2: S2,
    spec3: S3,
  ): HelixSpec<ShapeExtractor<S1> & ShapeExtractor<S2> & ShapeExtractor<S3>>;
  function compose<
    S1 extends SpecValue<any>,
    S2 extends SpecValue<any>,
    S3 extends SpecValue<any>,
    S4 extends SpecValue<any>,
  >(
    spec1: S1,
    spec2: S2,
    spec3: S3,
    spec4: S4,
  ): HelixSpec<ShapeExtractor<S1> & ShapeExtractor<S2> & ShapeExtractor<S3> & ShapeExtractor<S4>>;
  function compose(...specs: SpecValue<any>[]): HelixSpec<ShapeExtractor<SpecValue<any>>>;
}
