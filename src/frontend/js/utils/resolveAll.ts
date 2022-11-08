export async function resolveAll<T>(
  array: Array<T>,
  callback: (item: T, index: number) => Promise<void>,
) {
  await Promise.all(array.map(callback));
}
