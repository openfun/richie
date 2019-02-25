import '../../testSetup';

import React from 'react';
import { cleanup, fireEvent, render } from 'react-testing-library';

import { SearchFilter } from './SearchFilter';

describe('components/SearchFilter', () => {
  let addFilter: jasmine.Spy;
  let removeFilter: jasmine.Spy;

  beforeEach(() => {
    addFilter = jasmine.createSpy('addFilter');
    removeFilter = jasmine.createSpy('removeFilter');
  });

  afterEach(cleanup);

  it('renders the name of the filter', () => {
    const { getByText } = render(
      <SearchFilter
        addFilter={addFilter}
        filter={{
          count: 217,
          human_name: 'Human name',
          key: '42',
        }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );

    // The filter value is displayed with its facet count
    const button = getByText('Human name').parentElement;
    expect(button).toHaveTextContent('217');
    // The filter is not currently active
    expect(button).not.toHaveClass('active');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the filter as active when `isActive` is true', () => {
    const { getByText } = render(
      <SearchFilter
        addFilter={addFilter}
        filter={{
          count: 217,
          human_name: 'Human name',
          key: '42',
        }}
        isActive={true}
        removeFilter={removeFilter}
      />,
    );

    // The button shows its active state
    const button = getByText('Human name').parentElement;
    expect(button).toHaveClass('active');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls addFilter on button click if it was not active', () => {
    const { getByText } = render(
      <SearchFilter
        addFilter={addFilter!}
        filter={{
          count: 217,
          human_name: 'Human name',
          key: '43',
        }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );

    fireEvent.click(getByText('Human name'));
    expect(addFilter).toHaveBeenCalledWith('43');
    expect(removeFilter).not.toHaveBeenCalled();
  });

  it('calls removeFilter on button click if it was active', () => {
    const { getByText } = render(
      <SearchFilter
        addFilter={addFilter!}
        filter={{
          count: 217,
          human_name: 'Human name',
          key: '44',
        }}
        isActive={true}
        removeFilter={removeFilter}
      />,
    );

    fireEvent.click(getByText('Human name'));
    expect(removeFilter).toHaveBeenCalledWith('44');
    expect(addFilter).not.toHaveBeenCalled();
  });
});
