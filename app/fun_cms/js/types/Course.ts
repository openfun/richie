import Subject from './Subject';
import Organization from './Organization';

export default interface Course {
  course_ended: boolean;
  course_started: boolean;
  end_date: string;
  enrollment_end_date: string;
  enrollment_ended: boolean;
  enrollment_start_date: string;
  has_verified_course_mode: boolean;
  id: number;
  image_url: string;
  key: string;
  level: string;
  main_university: Organization;
  session_number: number;
  short_description: string;
  start_date: string;
  subjects: Subject[];
  thumbnails: {
    about: string;
    big: string;
    facebook: string;
    small: string;
  };
  title: string;
  universities: Organization[];
  university_name: string;
}