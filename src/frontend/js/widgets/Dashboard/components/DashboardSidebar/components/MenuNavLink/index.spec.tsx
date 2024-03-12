import { screen } from '@testing-library/react';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import { MenuLink } from '../..';
import MenuNavLink from '.';

describe('<MenuNavLink />', () => {
  it('should render a MenuNavLink with route and label', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My navigation link',
    };

    render(<MenuNavLink link={link} />, { wrapper: RouterWrapper });

    expect(screen.getByRole('link', { name: 'My navigation link' })).toBeInTheDocument();
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('should render a MenuNavLink with a badge', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My navigation link',
    };

    render(<MenuNavLink link={link} badgeCount={999} />, { wrapper: RouterWrapper });

    expect(screen.getByRole('link', { name: 'My navigation link' })).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
