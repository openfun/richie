import { FC } from 'react';
import { User } from 'types/User';
import useMatchMedia from 'utils/useMatchMedia';
import { DesktopUserMenu } from './DesktopUserMenu';
import { MobileUserMenu } from './MobileUserMenu';

export interface UserMenuProps {
  user: User & {
    urls: {
      key: string;
      label: string;
      action: string | (() => void);
    }[];
  };
}

export const UserMenu: FC<UserMenuProps> = (props: UserMenuProps) => {
  const showDesktop = useMatchMedia('(min-width: 992px)');

  return showDesktop ? <DesktopUserMenu {...props} /> : <MobileUserMenu {...props} />;
};
