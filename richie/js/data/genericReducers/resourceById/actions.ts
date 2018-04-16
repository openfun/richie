import { RootState } from '../../rootReducer';

import Resource from '../../../types/Resource';

export interface ResourceAdd<R extends Resource> {
  type: 'RESOURCE_ADD';
  resourceName: keyof RootState['resources'];
  resource: R;
}
