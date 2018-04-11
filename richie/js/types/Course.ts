import Organization from './Organization';
import Resource from './Resource';
import Subject from './Subject';

export default interface Course extends Resource {
  end_date: string;
  enrollment_end_date: string;
  enrollment_start_date: string;
  language: string;
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
