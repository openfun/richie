import { fireEvent, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { CommonDataProps } from 'types/commonDataProps';
import { RichieContextFactory } from 'utils/test/factories/richie';
import { SearchInput } from '.';

describe('<SearchInput />', () => {
  const contextProps: CommonDataProps['context'] = RichieContextFactory().one();

  const inputProps = {};

  it('renders with the input field, label and button', () => {
    const { container, getByRole, getByLabelText } = render(
      <IntlProvider locale="en">
        <SearchInput context={contextProps} inputProps={inputProps} />
      </IntlProvider>,
    );

    getByRole('button', { name: 'Search' });
    getByLabelText('Search');
    // NB: we're searching the DOM as labelling and a11y for this input are handled by `react-autosuggest`
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.innerHTML).toContain('icon-magnifying-glass');
  });

  it('triggers the passed callback on click', () => {
    const callback = jest.fn();

    const { getByRole } = render(
      <IntlProvider locale="en">
        <SearchInput context={contextProps} inputProps={inputProps} onClick={callback} />
      </IntlProvider>,
    );

    fireEvent.click(getByRole('button', { name: 'Search' }));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
