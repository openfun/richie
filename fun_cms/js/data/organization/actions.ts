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
