import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { SearchInput } from '.';

describe('<SearchInput />', () => {
  const context = {
    assets: {
      icons: '/icons.svg',
    },
  };

  const inputProps = {};

  it('renders with the input field and button', () => {
    const { container, getByText } = render(
      <IntlProvider locale="en">
        <SearchInput context={context} inputProps={inputProps} />
      </IntlProvider>,
    );

    getByText('Search');
    // NB: we're searching the DOM as labelling and a11y for this input are handled by `react-autosuggest`
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.innerHTML).toContain('/icons.svg');
  });

  it('triggers the passed callback on click', () => {
    const callback = jest.fn();

    const { getByText } = render(
      <IntlProvider locale="en">
        <SearchInput
          context={context}
          inputProps={inputProps}
          onClick={callback}
        />
      </IntlProvider>,
    );

    fireEvent.click(getByText('Search'));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
