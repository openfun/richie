export interface CourseRun {
  id: number;
  resource_link: string;
  start: string;
  end: string;
  enrollment_start: string;
  enrollment_end: string;
  languages: string[];
  state: CourseState;
}

export interface CourseState {
  priority: number;
  datetime: string;
  call_to_action: string;
  text: string;
}

export interface Enrollment {
  created_at: string;
  course_run: CourseRun['id'];
  id: number;
  user: number;
}
