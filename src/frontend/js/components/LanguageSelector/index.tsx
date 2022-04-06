import { useSelect } from 'downshift';
import { FC } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { location } from 'utils/indirection/window';

const messages = defineMessages({
  currentlySelected: {
    defaultMessage: '(currently selected)',
    description: 'Accessible hint to mark the currently selected language in the language selector',
    id: 'components.LanguageSelector.currentlySelected',
  },
  languages: {
    defaultMessage: 'Languages',
    description:
      'Default text for the language selector button when the current language cannot be identified',
    id: 'components.LanguageSelector.languages',
  },
  selectLanguage: {
    defaultMessage: 'Select a language:',
    description: 'Accessible label for the language selector button',
    id: 'components.LanguageSelector.selectLanguage',
  },
  switchToLanguage: {
    defaultMessage: 'Switch to {language}',
    description: 'Accessible link title for the language switching links in language selector',
    id: 'components.LanguageSelector.switchToLanguage',
  },
});

interface LanguageSelectorProps {
  currentLanguage: string;
  languages: { [code: string]: { code: string; name: string; url: string } };
}

const LanguageSelector: FC<LanguageSelectorProps> = ({ currentLanguage, languages }) => {
  const intl = useIntl();
  const languagesList = Object.values(languages);

  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({
    items: languagesList,
    initialSelectedItem: languages[currentLanguage],
    onSelectedItemChange: ({ selectedItem: newSelectedItem }) => {
      // Manually handle location changes in case the user interacted with a keyboard, and therefore with a
      // list item, and not by clicking on the actual links.

      location.replace(`${newSelectedItem!.url}${location.search}`);
    },
  });

  return (
    <div className="selector">
      <label {...getLabelProps()} className="offscreen">
        <FormattedMessage {...messages.selectLanguage} />
      </label>
      <button {...getToggleButtonProps()} className="selector__button">
        {selectedItem?.name || intl.formatMessage(messages.languages)}
        <svg role="img" className="selector__button__icon" aria-hidden="true">
          <use xlinkHref="#icon-chevron-down" />
        </svg>
      </button>
      <ul
        {...getMenuProps()}
        className={`selector__list ${isOpen ? '' : 'selector__list--is-closed'}`}
      >
        {isOpen &&
          languagesList.map((language, index) => (
            <li key={`${language.code}${index}`} {...getItemProps({ item: language, index })}>
              <a
                className={`selector__list__link ${
                  highlightedIndex === index ? 'selector__list__link--highlighted' : ''
                }`}
                href={`${language!.url}${location.search}`}
                title={`${intl.formatMessage(messages.switchToLanguage, {
                  language: language.name,
                })}${
                  selectedItem?.code === language.code
                    ? ' ' + intl.formatMessage(messages.currentlySelected)
                    : ''
                }`}
              >
                {language.name}
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default LanguageSelector;
