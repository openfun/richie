import { render, screen } from '@testing-library/react';
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
    render(<DashboardAvatar title="Bob" imageUrl="http://my.awesome.image" />);
    expect(screen.getByAltText('Bob')).toHaveAttribute('src', 'http://my.awesome.image');
  });

  it('should contain the variant class for SQUARE', () => {
    render(<DashboardAvatar title="Bob" variant={DashboardAvatarVariantEnum.SQUARE} />);
    expect(screen.getByTestId('dashboard-avatar')).toHaveClass('dashboard__avatar--square');
  });
});
