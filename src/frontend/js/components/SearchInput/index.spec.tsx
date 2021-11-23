import { fireEvent, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { ContextFactory } from 'utils/test/factories';
import { SearchInput } from '.';

describe('<SearchInput />', () => {
  const contextProps: CommonDataProps['context'] = ContextFactory().generate();

  const inputProps = {};

  it('renders with the input field and button', () => {
    const { container, getByText } = render(
      <IntlProvider locale="en">
        <SearchInput context={contextProps} inputProps={inputProps} />
      </IntlProvider>,
    );

    getByText('Search');
    // NB: we're searching the DOM as labelling and a11y for this input are handled by `react-autosuggest`
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.innerHTML).toContain('icon-magnifying-glass');
  });

  it('triggers the passed callback on click', () => {
    const callback = jest.fn();

    const { getByText } = render(
      <IntlProvider locale="en">
        <SearchInput context={contextProps} inputProps={inputProps} onClick={callback} />
      </IntlProvider>,
    );

    fireEvent.click(getByText('Search'));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
