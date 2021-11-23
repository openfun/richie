import { FC } from 'react';
import { UserMenuProps } from '.';

export const MobileUserMenu: FC<UserMenuProps> = ({ user }) => (
  <div className="user-menu user-menu--mobile">
    <h6 className="user-menu__username">
      <svg aria-hidden={true} role="img" className="icon">
        <use xlinkHref="#icon-login" />
      </svg>
      {user.username}
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
