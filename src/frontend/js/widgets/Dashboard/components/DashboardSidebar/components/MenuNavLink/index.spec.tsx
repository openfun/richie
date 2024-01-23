import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MenuLink } from '../..';
import MenuNavLink from '.';

describe('<MenuNavLink />', () => {
  const Wrapper = ({ children }: PropsWithChildren) => <MemoryRouter>{children} </MemoryRouter>;
  it('should render a MenuNavLink with route and label', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My navigation link',
    };

    render(
      <Wrapper>
        <MenuNavLink link={link} />
      </Wrapper>,
    );

    expect(screen.getByRole('link', { name: 'My navigation link' })).toBeInTheDocument();
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
  });

  it('should render a MenuNavLink with a badge', () => {
    const link: MenuLink = {
      to: '/dummy/url/',
      label: 'My navigation link',
    };

    render(
      <Wrapper>
        <MenuNavLink link={link} badgeCount={999} />
      </Wrapper>,
    );

    expect(screen.getByRole('link', { name: 'My navigation link' })).toBeInTheDocument();
    expect(screen.getByText('999')).toBeInTheDocument();
  });
});
