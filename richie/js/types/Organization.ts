import { Resource } from './Resource';

export interface Organization extends Resource {
  banner: string | null;
  code: string;
  logo: string | null;
  name: string;
}
