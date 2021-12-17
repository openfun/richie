import { render } from '@testing-library/react';
import Banner, { BannerType } from '.';

describe('Banner', () => {
  it('displays a message', () => {
    const { getByText } = render(
      <Banner type={BannerType.INFO} message="A message for test purpose" />,
    );

    const $message = getByText('A message for test purpose');
    expect(Object.values($message.classList)).toEqual(['banner__message']);
  });

  it('has a type property', () => {
    const types = Object.keys(BannerType);
    const randomIndex = Math.floor(Math.random() * types.length);
    const randomType = types[randomIndex] as BannerType;

    const { container } = render(<Banner type={randomType} message="A message for test purpose" />);
    const $banner = container.querySelector(`.banner.banner--${randomType}`);

    expect($banner).not.toBeNull();
  });

  it('has a rounded boolean property', () => {
    const { container } = render(<Banner message="A message for test purpose" rounded />);
    const $banner = container.querySelector('.banner.banner--info.banner--rounded');

    expect($banner).not.toBeNull();
  });
});
