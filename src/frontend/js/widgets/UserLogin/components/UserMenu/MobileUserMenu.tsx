import { FC } from 'react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { UserHelper } from 'utils/UserHelper';
import { UserMenuProps } from '.';

export const MobileUserMenu: FC<UserMenuProps> = ({ user }) => (
  <div className="user-menu user-menu--mobile">
    <h6 className="user-menu__username">
      <Icon name={IconTypeEnum.LOGIN} />
      {UserHelper.getName(user)}
    </h6>
    <ul className="user-menu__list">
      {user.urls.map(({ key, label, action }) => (
        <li className="user-menu__list__item" key={key}>
          {typeof action === 'string' ? (
            <a href={action}>{label}</a>
          ) : (
            <button onClick={action}>{label}</button>
          )}
        </li>
      ))}
    </ul>
  </div>
);
