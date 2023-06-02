import { DEBUG_UNION_RESOURCES_HOOK } from 'settings';

export const log = (...args: any) => {
  if (DEBUG_UNION_RESOURCES_HOOK) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};
