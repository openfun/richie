import { stringify } from 'query-string';

import { FilterDefinition } from '../../types/filters';
import * as filterComputer from './computeNewFilterValue';
import { mergeProps } from './searchFilterGroupContainer';

describe('components/searchFilterGroupContainer/mergeProps', () => {
  let dispatch: jasmine.Spy;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(filterComputer, 'computeNewFilterValue').and.returnValue(
      'some filter value',
    );
  });

  const expectDispatches = (disp: jasmine.Spy, expectedParams: any) => {
    expect(disp).toHaveBeenCalledWith({
      params: expectedParams,
      resourceName: 'courses',
      type: 'RESOURCE_LIST_GET',
    });
    expect(disp).toHaveBeenCalledWith({
      state: null,
      title: '',
      type: 'HISTORY_PUSH_STATE',
      url: `?${stringify(expectedParams)}`,
    });
  };

  describe('addFilter', () => {
    describe('when the filter is drilldown', () => {
      it('dispatches actions with params -> the current params with the new filter added on', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, offset: 0 },
            filter: { isDrilldown: true } as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.addFilter('some_value');

        expectDispatches(dispatch, { limit: 20, new: 'some_value', offset: 0 });
      });

      it('dispatches actions with params -> replaces any existing value for the filter in the params', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, new: 'old_value', offset: 0 },
            filter: { isDrilldown: true } as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.addFilter('new_value');

        expectDispatches(dispatch, { limit: 20, new: 'new_value', offset: 0 });
      });
    });

    describe('when the filter is not drilldown', () => {
      it('delegates to computeNewFilterValue', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, offset: 0 },
            filter: {} as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.addFilter('mocked_out_value');

        expectDispatches(dispatch, {
          limit: 20,
          new: 'some filter value',
          offset: 0,
        });
      });
    });
  });

  describe('removeFilter', () => {
    describe('when the filter is drilldown', () => {
      it('returns undefined when it matches the passed value', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, new: 'value_to_remove', offset: 0 },
            filter: { isDrilldown: true } as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.removeFilter('value_to_remove');

        expectDispatches(dispatch, { limit: 20, new: undefined, offset: 0 });
      });

      it('keeps the existing filter value when it does not match the passed value', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, new: 'existing_value', offset: 0 },
            filter: { isDrilldown: true } as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.removeFilter('imaginary_value');

        expectDispatches(dispatch, {
          limit: 20,
          new: 'existing_value',
          offset: 0,
        });
      });

      it('returns undefined and does not throw when there was no existing value', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, offset: 0 },
            filter: { isDrilldown: true } as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.removeFilter('where_does_this_come_from');

        expectDispatches(dispatch, { limit: 20, new: undefined, offset: 0 });
      });
    });

    describe('when the filter is not drilldown', () => {
      it('delegates to computeNewFilterValue', () => {
        const props = mergeProps(
          {
            currentParams: { limit: 20, offset: 0 },
            filter: {} as FilterDefinition,
          },
          { dispatch },
          { machineName: 'new' },
        );
        props.removeFilter('mocked_out_value');

        expectDispatches(dispatch, {
          limit: 20,
          new: 'some filter value',
          offset: 0,
        });
      });
    });
  });
});
