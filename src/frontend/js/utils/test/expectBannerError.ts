import { findByText, waitFor } from '@testing-library/react';

export const expectBannerError = async (message: string, rootElement: ParentNode = document) => {
  await waitFor(async () => {
    const banner = rootElement.querySelector('.banner--error') as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, message);
  });
};
