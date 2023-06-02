export interface IntegrityData {
  id: string;
}

/**
 * Check if item's ids of both stack have the same order.
 * If so, we call it integrity.
 *
 * @param previousStack
 * @param newStack
 * @param integrityCount
 * @returns boolean
 */
export const hasIntegrity = <Data extends IntegrityData = IntegrityData>(
  previousStack: Data[],
  newStack: Data[],
  integrityCount: number,
) => {
  if (previousStack.length < integrityCount || newStack.length < integrityCount) {
    return false;
  }

  // If we find a difference, we return false.
  return !newStack.slice(0, integrityCount).find((item, index) => {
    return previousStack[index].id !== item.id;
  });
};
