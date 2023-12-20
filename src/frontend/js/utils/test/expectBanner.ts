import { getByText, screen, waitFor } from '@testing-library/react';
import { BannerType, getBannerTestId } from 'components/Banner';

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
    getByText(banner!, message);
  });
};

export const expectNoBannerError = async (message: string) => {
  return expectNoBanner(BannerType.ERROR, message);
};
export const expectNoBannerInfo = async (message: string) => {
  return expectNoBanner(BannerType.INFO, message);
};

export const expectNoBanner = async (type: BannerType, message: string) => {
  await waitFor(() => {
    expect(screen.queryByTestId(getBannerTestId(message, type))).toBeNull();
  });
};
