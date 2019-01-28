import { Resource } from './Resource';

export interface Subject extends Resource {
  logo: string | null;
  title: string;
}
