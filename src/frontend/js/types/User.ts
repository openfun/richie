export interface User {
  access_token?: string;
  full_name?: string;
  email?: string;
  username: string;
}

export enum JoanieUserApiAbilityActions {
  DELETE = 'delete',
  GET = 'get',
  PATCH = 'patch',
  PUT = 'put',
  HAS_COURSE_ACCESS = 'has_course_access',
  HAS_ORGANIZATION_ACCESS = 'has_organization_access',
}

export interface JoanieUserProfile {
  id: string;
  username: string;
  full_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  abilities: { [key in JoanieUserApiAbilityActions]?: boolean };
}
