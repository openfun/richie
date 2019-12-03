import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';

const messages = defineMessages({
  button: {
    defaultMessage: 'Search',
    description:
      'Accessibility text for the search button inside the Search input.',
    id: 'components.SearchInput.button',
  },
});

/**
 * Component. Search input to be used exclusively with `react-autosuggest` as it does not create necessary a11y
 * markup at all (as `<Autosuggest />` does that for us).
 * @param context General contextual app information as defined in common data props.
 * @param inputProps Mandatory passthrough for inputProps provided by `<Autosuggest />`.
 * @param onClick Handler to call when the user clicks on the search icon.
 */
export const SearchInput = ({
  context,
  inputProps, // just a passthrough from react-autosuggest to react-autosuggest
  onClick = () => {}, // by default, do nothing, this will just remove focus and close suggestions
}: { inputProps: any; onClick?: () => void } & CommonDataProps) => (
  <div className="search-input">
    <input {...inputProps} />
    <button className="search-input__btn" onClick={onClick}>
      <svg
        aria-hidden={true}
        role="img"
        className="icon search-input__btn__icon"
      >
        <use xlinkHref={`${context.assets.icons}#icon-magnifying-glass`} />
      </svg>{' '}
      <span className="offscreen">
        <FormattedMessage {...messages.button} />
      </span>
    </button>
  </div>
);
