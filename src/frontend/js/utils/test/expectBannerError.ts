import { findByText, waitFor } from '@testing-library/react';

export const expectBannerError = async (message: string) => {
  await waitFor(async () => {
    const banner = document!.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, message);
  });
};
