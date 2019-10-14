import 'testSetup';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Search } from '.';

let mockMatches = false;
jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn() },
  location: { search: '' },
  matchMedia: () => {
    return { matches: mockMatches };
  },
}));

jest.mock('data/useCourseSearch', () => ({
  useCourseSearch: () => null,
}));

describe('<Search />', () => {
  const commonDataProps = {
    assets: {
      icons: '/icons.svg',
    },
  };

  it('always shows the filters pane on large screens', () => {
    mockMatches = true;
    const { container } = render(
      <IntlProvider locale="en">
        <Search context={commonDataProps} />
      </IntlProvider>,
    );

    // The search filters pane is not hidden, there is no button to show/hide it
    expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    expect(container.querySelector('.search__filters__toggle')).toEqual(null);
  });

  it('hides the filters pane on small screens by default and lets users show it', () => {
    mockMatches = false;
    const { container, debug, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <Search context={commonDataProps} />
      </IntlProvider>,
    );

    // The search filters pane is hidden, there is a button to show/hide it
    expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container.querySelector('.search__filters__toggle')).toEqual(
      jasmine.any(HTMLButtonElement),
    );

    {
      // We have a "Show" button with the appropriate aria helper
      expect(queryByText('Hide filters pane')).toEqual(null);
      const button = getByText('Show filters pane');
      expect(
        container.querySelector('.search__filters__toggle'),
      ).toHaveAttribute('aria-expanded', 'false');

      // After a click the filters pane is now shown
      fireEvent.click(button);
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'false',
      );
    }
    {
      // We now have a "Hide" button with the appropriate aria helper
      expect(queryByText('Show filters pane')).toEqual(null);
      const button = getByText('Hide filters pane');
      expect(
        container.querySelector('.search__filters__toggle'),
      ).toHaveAttribute('aria-expanded', 'true');

      // After another click the filters pane is hidden again
      fireEvent.click(button);
      expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
  });
});
