import React from 'react';
import { UserMenuProps } from '.';

export const MobileUserMenu: React.FC<UserMenuProps> = ({ user, links }) => (
  <div className="user-menu user-menu--mobile">
    <h6 className="user-menu__username">
      <svg aria-hidden={true} role="img" className="icon">
        <use xlinkHref="#icon-login" />
      </svg>
      {user}
    </h6>
    <ul className="user-menu__list">
      {links.map(({ label, href }, index) => (
        <li className="user-menu__list__item" key={`user-link-${label}-${index}`}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>
  </div>
);
