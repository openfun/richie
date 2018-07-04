import { Resource } from './Resource';

export interface Course extends Resource {
  end_date: string;
  enrollment_end_date: string;
  enrollment_start_date: string;
  language: string;
  organization_main: number;
  organizations: number[];
  session_number: number;
  short_description: string;
  start_date: string;
  subjects: number[];
  thumbnails: {
    about: string;
    big: string;
    facebook: string;
    small: string;
  };
  title: string;
}
