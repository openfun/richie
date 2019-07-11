import { Resource } from './Resource';

export interface Organization extends Resource {
  logo: string | null;
}

export type OrganizationForSuggestion = Pick<Organization, 'id' | 'title'>;
