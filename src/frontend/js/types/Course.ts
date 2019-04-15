import { Resource } from './Resource';

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  cover_image: string;
  organization_highlighted: string;
  organizations: string[];
  state: {
    call_to_action: string;
    datetime: string;
    priority: number;
    text: string;
  };
  title: string;
}

export type CourseForSuggestion = Pick<Course, 'absolute_url' | 'id' | 'title'>;
