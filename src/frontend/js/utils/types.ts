export type jestMockOf<T extends (...args: any[]) => any> = jest.Mock<
  ReturnType<T>,
  Parameters<T>
>;

export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;
