export type Maybe<T> = T | undefined;

export type Nullable<T> = T | null;

export type PropsWithTestId<Props> = Props & { 'data-testid'?: string };

export type AddParameters<
  TFunction extends (...args: readonly unknown[]) => unknown,
  TParameters extends [...args: readonly unknown[]],
> = (...args: [...Parameters<TFunction>, ...TParameters]) => ReturnType<TFunction>;

export const isEnumValue = <T extends { [k: string]: string }>(
  something: any,
  enumObject: T,
): something is T[keyof T] =>
  typeof something === 'string' && Object.values(enumObject).includes(something);
