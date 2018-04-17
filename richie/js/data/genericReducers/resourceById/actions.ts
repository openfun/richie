import { RootState } from '../../rootReducer';

import Resource from '../../../types/Resource';

export interface ResourceAdd<R extends Resource> {
  type: 'RESOURCE_ADD';
  resourceName: keyof RootState['resources'];
  resource: R;
}

export function addResource(resourceName: keyof RootState['resources'], resource: Resource): ResourceAdd<Resource> {
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

export function addMultipleResources(
  resourceName: keyof RootState['resources'],
  resources: Resource[],
): ResourceMultipleAdd<Resource> {
  return {
    resourceName,
    resources,
    type: 'RESOURCE_MULTIPLE_ADD',
  };
}
