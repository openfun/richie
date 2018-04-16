import Organization from '../../types/Organization';
import { ResourceAdd } from '../genericReducers/resourceById/actions';

export function addOrganization(organization: Organization): ResourceAdd<Organization> {
  return {
    resource: organization,
    resourceName: 'organization',
    type: 'RESOURCE_ADD',
  };
}

export interface OrganizationsGet {
  params?: { keys?: string[] };
  type: 'ORGANIZATION_LIST_GET';
}

export function getOrganizations(params: OrganizationsGet['params']): OrganizationsGet {
  return {
    params,
    type: 'ORGANIZATION_LIST_GET',
  };
}

export interface OrganizationsGetSuccess {
  organizations: Organization[];
  params: OrganizationsGet['params'];
  type: 'ORGANIZATION_LIST_GET_SUCCESS';
}

export function didGetOrganizations(
  organizations: OrganizationsGetSuccess['organizations'],
  params: OrganizationsGetSuccess['params'],
): OrganizationsGetSuccess {
  return {
    organizations,
    params,
    type: 'ORGANIZATION_LIST_GET_SUCCESS',
  };
}

export interface OrganizationsGetFailure {
  error: Error | string;
  type: 'ORGANIZATION_LIST_GET_FAILURE';
}

export function failedToGetOrganizations(error: OrganizationsGetFailure['error']): OrganizationsGetFailure {
  return {
    error,
    type: 'ORGANIZATION_LIST_GET_FAILURE',
  };
}
