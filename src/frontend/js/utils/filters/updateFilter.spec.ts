import { stringify } from 'query-string';

import { FilterDefinition } from '../../types/filters';
import { modelName } from '../../types/models';
import { jestMockOf } from '../types';
import { computeNewFilterValue } from './computeNewFilterValue';
import { updateFilter } from './updateFilter';

const mockComputeNewFilterValue: jestMockOf<
  typeof computeNewFilterValue
> = computeNewFilterValue as any;
jest.mock('./computeNewFilterValue');

describe('utils/filters/updateFilter', () => {
  let dispatch: jest.Mock;

  beforeEach(() => {
    dispatch = jest.fn();
    mockComputeNewFilterValue.mockReturnValue('some filter value');
  });

  it('dispatches relevant actions with the updated params', () => {
    updateFilter(
      dispatch,
      { limit: 13, offset: 3, organizations: [42, 84] },
      'add',
      {
        humanName: { defaultMessage: 'Availability', id: 'availability' },
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
      resourceName: modelName.COURSES,
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
