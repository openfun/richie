import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useSelect } from 'downshift';
import { location } from 'utils/indirection/window';
import { UserMenuProps } from '.';

const messages = defineMessages({
  menuPurpose: {
    defaultMessage: 'Access to your profile settings',
    description: 'Accessible label for user menu button',
    id: 'components.DesktopUserMenu.menuPurpose',
  },
});

export const DesktopUserMenu: React.FC<UserMenuProps> = ({ user }) => {
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
      // Manually handle action in case the user interacted with a keyboard, and therefore with a
      // list item, and not by clicking on the actual links.
      if (typeof selectedItem!.action === 'string') {
        location.replace(selectedItem!.action);
      } else {
        selectedItem!.action();
      }
    },
  });

  return (
    <div className="user-menu user-menu--desktop selector">
      <label {...getLabelProps()} className="offscreen">
        <FormattedMessage {...messages.menuPurpose} />
      </label>
      <button {...getToggleButtonProps()} className="selector__button">
        {user.username}
        <svg role="img" className="selector__button__icon" aria-hidden="true">
          <use xlinkHref="#icon-chevron-down" />
        </svg>
      </button>
      <ul
        {...getMenuProps()}
        className={`selector__list ${isOpen ? '' : 'selector__list--is-closed'}`}
      >
        {isOpen &&
          user.urls.map((link, index) => (
            <li key={`user-link-${link.label}-${index}`} {...getItemProps({ item: link, index })}>
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
                  onClick={link.action}
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
