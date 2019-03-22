import { Resource } from './Resource';

export interface Category extends Resource {
  logo: string | null;
  title: string;
}

export type CategoryForSuggestion = Pick<Category, 'id' | 'title'>;
