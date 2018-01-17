import { Subject } from './Subject';
import { University } from './University';

export interface Course {
  course_ended: boolean;
  course_started: boolean;
  end_date: string;
  end_date_display: string;
  enrollment_end_date: string;
  enrollment_ended: boolean;
  enrollment_start_date: string;
  has_verified_course_mode: boolean;
  id: number;
  image_url: string;
  key: string;
  level: string;
  main_university: University;
  session_display: string;
  session_number: number;
  short_description: string;
  start_date: string;
  start_date_display: string;
  subjects: Subject[];
  thumbnails: {
    about: string;
    big: string;
    facebook: string;
    small: string;
  };
  title: string;
  universities: University[];
  university_name: string;
}