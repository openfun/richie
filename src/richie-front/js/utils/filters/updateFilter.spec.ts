import { stringify } from 'query-string';

import { FilterDefinition } from '../../types/filters';
import * as filterComputer from './computeNewFilterValue';
import { updateFilter } from './updateFilter';

describe('utils/filters/updateFilter', () => {
  let dispatch: jasmine.Spy;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(filterComputer, 'computeNewFilterValue').and.returnValue(
      'some filter value',
    );
  });

  it('dispatches relevant actions with the updated params', () => {
    updateFilter(
      dispatch,
      { limit: 13, offset: 3, organizations: [42, 84] },
      'add',
      {
        humanName: 'Availability',
        isDrilldown: true,
        machineName: 'availability',
      } as FilterDefinition,
      'some filter value',
    );

    expect(dispatch).toHaveBeenCalledWith({
      params: {
        availability: 'some filter value',
        limit: 13,
        offset: 3,
        organizations: [42, 84],
      },
      resourceName: 'courses',
      type: 'RESOURCE_LIST_GET',
    });
    expect(dispatch).toHaveBeenCalledWith({
      state: null,
      title: '',
      type: 'HISTORY_PUSH_STATE',
      url: `?${stringify({
        availability: 'some filter value',
        limit: 13,
        offset: 3,
        organizations: [42, 84],
      })}`,
    });
  });
});
