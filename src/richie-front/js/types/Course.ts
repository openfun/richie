import { Resource } from './Resource';

export interface Course extends Resource {
  start: string;
  end: string;
  enrollment_start: string;
  enrollment_end: string;
  absolute_url: string;
  cover_image: string;
  languages: string[];
  organizations: number[];
  subjects: number[];
  title: string;
}
