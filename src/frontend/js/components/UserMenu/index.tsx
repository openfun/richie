import React from 'react';
import { User } from 'types/User';
import useMatchMedia from 'utils/useMatchMedia';
import { DesktopUserMenu } from './DesktopUserMenu';
import { MobileUserMenu } from './MobileUserMenu';

export interface UserMenuProps {
  user: string;
  links: User['urls'];
}

export const UserMenu: React.FC<UserMenuProps> = (props) => {
  const showDesktop = useMatchMedia('(min-width: 992px)');
  return showDesktop ? <DesktopUserMenu {...props} /> : <MobileUserMenu {...props} />;
};
