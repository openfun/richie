import classNames from 'classnames';
import { NavLink, useLocation } from 'react-router-dom';
import Badge from 'components/Badge';
import { MenuLink } from '../..';
import { isMenuLinkActive } from '../../utils';

interface MenuNavLinkProps {
  link: MenuLink;
  badgeCount?: number;
}

const MenuNavLink = ({ link, badgeCount }: MenuNavLinkProps) => {
  const location = useLocation();
  return (
    <li
      className={classNames('dashboard-sidebar__container__nav__item', {
        active: isMenuLinkActive(link.to, location),
      })}
    >
      <NavLink to={link.to} end>
        {link.label}
      </NavLink>
      {badgeCount && <Badge color="primary">{badgeCount}</Badge>}
    </li>
  );
};

export default MenuNavLink;
