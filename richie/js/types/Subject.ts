import { Resource } from './Resource';

export interface Subject extends Resource {
  image: string | null;
  name: string;
}
