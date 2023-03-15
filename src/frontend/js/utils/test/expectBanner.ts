import { findByText, waitFor } from '@testing-library/react';
import { BannerType } from 'components/Banner';

export const expectBannerError = async (message: string, rootElement: ParentNode = document) => {
  return expectBanner(BannerType.ERROR, message, rootElement);
};
export const expectBannerInfo = async (message: string, rootElement: ParentNode = document) => {
  return expectBanner(BannerType.INFO, message, rootElement);
};

export const expectBanner = async (
  type: BannerType,
  message: string,
  rootElement: ParentNode = document,
) => {
  await waitFor(async () => {
    const banner = rootElement.querySelector('.banner--' + type) as HTMLElement;
    expect(banner).not.toBeNull();
    await findByText(banner!, message);
  });
};
