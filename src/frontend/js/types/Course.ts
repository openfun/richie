import { Nullable } from '../utils/types';
import { Resource } from './Resource';

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  cover_image: Nullable<{
    alt: string;
    sizes: string;
    src: string;
    srcset: string;
  }>;
  organization_highlighted: string;
  organizations: string[];
  state: {
    call_to_action: Nullable<string>;
    datetime: Nullable<string>;
    priority: number;
    text: string;
  };
  title: string;
}

export type CourseForSuggestion = Pick<Course, 'absolute_url' | 'id' | 'title'>;
