import { findByText, waitFor } from '@testing-library/react';

export const expectBannerError = async (message: string, element?: HTMLElement) => {
  await waitFor(async () => {
    const root = element ?? document;
    const banner = root.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, message);
  });
};
