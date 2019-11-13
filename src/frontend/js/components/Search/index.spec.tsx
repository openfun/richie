import 'testSetup';

import { act, fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
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

describe('<Search />', () => {
  const commonDataProps = {
    assets: {
      icons: '/icons.svg',
    },
  };

  beforeEach(fetchMock.restore);

  it('shows a spinner while the results are loading', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <Search context={commonDataProps} />
      </IntlProvider>,
    );

    expect(
      getByText('Loading search results...').parentElement,
    ).toHaveAttribute('role', 'status');

    await wait();
    expect(queryByText('Loading search results...')).toBeNull();
  });

  it('always shows the filters pane on large screens', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    mockMatches = true;
    const { container } = render(
      <IntlProvider locale="en">
        <Search context={commonDataProps} />
      </IntlProvider>,
    );
    await wait();

    // The search filters pane is not hidden, there is no button to show/hide it
    expect(container.querySelector('.search-filters-pane')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    expect(container.querySelector('.search__filters__toggle')).toEqual(null);
  });

  it('hides the filters pane on small screens by default and lets users show it', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=20&offset=0', {
      meta: {
        total_count: 200,
      },
      objects: [],
    });

    mockMatches = false;
    const { container, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <Search context={commonDataProps} />
      </IntlProvider>,
    );
    await wait();

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
