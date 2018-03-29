import Organization from '../../types/Organization';

export interface OrganizationAdd {
  organization: Organization;
  type: 'ORGANIZATION_ADD';
}

export function addOrganization(organization: Organization): OrganizationAdd {
  return {
    organization,
    type: 'ORGANIZATION_ADD',
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
