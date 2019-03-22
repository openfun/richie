import { Resource } from './Resource';

export interface Organization extends Resource {
  logo: string | null;
  title: string;
}

export type OrganizationForSuggestion = Pick<Organization, 'id' | 'title'>;
