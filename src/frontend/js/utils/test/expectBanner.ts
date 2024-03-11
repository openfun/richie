import { screen, waitFor } from '@testing-library/react';
import { BannerType, getBannerTestId } from 'components/Banner';

export const expectBannerError = (message: string, rootElement: ParentNode = document) => {
  return expectBanner(BannerType.ERROR, message, rootElement);
};
export const expectBannerInfo = (message: string, rootElement: ParentNode = document) => {
  return expectBanner(BannerType.INFO, message, rootElement);
};

export const expectBanner = (
  type: BannerType,
  message: string,
  rootElement: ParentNode = document,
) => {
  return waitFor(async () => {
    const banner = rootElement.querySelector('.banner--' + type) as HTMLElement;
    expect(banner).not.toBeNull();
    expect(banner).toHaveTextContent(message);
  });
};

export const expectNoBannerError = (message: string) => {
  return expectNoBanner(BannerType.ERROR, message);
};
export const expectNoBannerInfo = (message: string) => {
  return expectNoBanner(BannerType.INFO, message);
};

export const expectNoBanner = (type: BannerType, message: string) => {
  return waitFor(() => {
    expect(screen.queryByTestId(getBannerTestId(message, type))).toBeNull();
  });
};
