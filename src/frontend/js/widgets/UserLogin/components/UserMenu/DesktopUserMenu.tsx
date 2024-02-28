import { FC } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useSelect } from 'downshift';
import classNames from 'classnames';
import { location } from 'utils/indirection/window';
import { UserHelper } from 'utils/UserHelper';
import { UserMenuProps } from '.';

const messages = defineMessages({
  menuPurpose: {
    defaultMessage: 'Access to your profile settings',
    description: 'Accessible label for user menu button',
    id: 'components.DesktopUserMenu.menuPurpose',
  },
});

export const DesktopUserMenu: FC<UserMenuProps> = ({ user }) => {
  const labels = user.urls.map((label) => label);
  const {
    isOpen,
    highlightedIndex,
    getMenuProps,
    getItemProps,
    getToggleButtonProps,
    getLabelProps,
  } = useSelect({
    items: labels,
    onSelectedItemChange: ({ selectedItem }) => {
      // We have to handle action manually in case the user
      // is interacting through keyboard, and therefore with a list item, and
      // not by clicking on the actual links.
      if (typeof selectedItem!.action === 'string') {
        location.replace(selectedItem!.action);
      } else {
        selectedItem!.action();
      }
    },
  });

  const teacherDasbhoardUrl = user.urls.find((link) => {
    return link.key === 'dashboard_teacher';
  });
  let menuLinkList;
  if (teacherDasbhoardUrl) {
    menuLinkList = [
      teacherDasbhoardUrl,
      ...user.urls.filter((link) => {
        return link.key !== 'dashboard_teacher';
      }),
    ];
  } else {
    menuLinkList = user.urls;
  }

  return (
    <div className="user-menu user-menu--desktop selector">
      <label {...getLabelProps()} className="offscreen">
        <FormattedMessage {...messages.menuPurpose} />
      </label>
      <button {...getToggleButtonProps()} className="selector__button">
        {UserHelper.getName(user)}
        <svg role="img" className="selector__button__icon" aria-hidden="true">
          <use xlinkHref="#icon-chevron-down" />
        </svg>
      </button>
      <ul
        {...getMenuProps()}
        className={`selector__list ${isOpen ? '' : 'selector__list--is-closed'}`}
      >
        {isOpen &&
          menuLinkList.map((link, index) => (
            <li
              key={link.key}
              {...getItemProps({ item: link, index })}
              className={classNames({
                'selector__list__item--bordered': link.key === 'dashboard_teacher',
              })}
            >
              {typeof link.action === 'string' ? (
                <a
                  className={`selector__list__link ${
                    highlightedIndex === index ? 'selector__list__link--highlighted' : ''
                  }`}
                  href={link.action}
                >
                  {link.label}
                </a>
              ) : (
                <button
                  className={`selector__list__link
                  ${highlightedIndex === index ? 'selector__list__link--highlighted' : ''}`}
                >
                  {link.label}
                </button>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};
