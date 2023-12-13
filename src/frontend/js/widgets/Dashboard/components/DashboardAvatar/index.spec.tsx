import { render, screen } from '@testing-library/react';
import { JoanieFileFactory } from 'utils/test/factories/joanie';
import { DashboardAvatar, DashboardAvatarVariantEnum } from '.';

describe('<DashboardAvatar/>', () => {
  it('should work with empty title', () => {
    render(<DashboardAvatar title="" />);
    expect(screen.getByTestId('dashboard-avatar')).toHaveTextContent('');
  });

  it('should display the first letter of the title', () => {
    render(<DashboardAvatar title="Bob" />);
    expect(screen.getByTestId('dashboard-avatar')).toHaveTextContent('B');
  });

  it('should display an image if given', () => {
    const image = JoanieFileFactory({
      src: 'http://my.awesome.image',
      srcset: '200w http://my.awesome.image/200',
    }).one();
    render(<DashboardAvatar title="Bob" image={image} />);
    const img = screen.getByAltText('Bob');
    expect(img).toHaveAttribute('src', 'http://my.awesome.image');
    expect(img).toHaveAttribute('srcset', '200w http://my.awesome.image/200');
  });

  it('should contain the variant class for SQUARE', () => {
    render(<DashboardAvatar title="Bob" variant={DashboardAvatarVariantEnum.SQUARE} />);
    expect(screen.getByTestId('dashboard-avatar')).toHaveClass('dashboard__avatar--square');
  });
});
