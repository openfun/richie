import Organization from '../../types/Organization';

export type ORGANIZATION_ADD = {
  organization: Organization,
  type: 'ORGANIZATION_ADD',
};

export function addOrganization (organization: Organization): ORGANIZATION_ADD {
  return {
    organization,
    type: 'ORGANIZATION_ADD',
  };
}
