import { RootState } from '../../rootReducer';

import { Resource } from '../../../types/Resource';

export interface ResourceAdd<R extends Resource> {
  type: 'RESOURCE_ADD';
  resourceName: keyof RootState['resources'];
  resource: R;
}

export function addResource<R extends Resource>(
  resourceName: keyof RootState['resources'],
  resource: R,
): ResourceAdd<R> {
  return {
    resource,
    resourceName,
    type: 'RESOURCE_ADD',
  };
}

export interface ResourceMultipleAdd<R extends Resource> {
  type: 'RESOURCE_MULTIPLE_ADD';
  resourceName: keyof RootState['resources'];
  resources: R[];
}

export function addMultipleResources<R extends Resource>(
  resourceName: keyof RootState['resources'],
  resources: R[],
): ResourceMultipleAdd<R> {
  return {
    resourceName,
    resources,
    type: 'RESOURCE_MULTIPLE_ADD',
  };
}
