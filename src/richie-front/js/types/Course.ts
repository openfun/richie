import { Resource } from './Resource';

export interface Course extends Resource {
  absolute_url: string;
  cover_image: string;
  end: string;
  enrollment_end: string;
  enrollment_start: string;
  languages: string[];
  organizations: number[];
  start: string;
  subjects: number[];
  title: string;
}
