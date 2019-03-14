import { Resource } from './Resource';

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  cover_image: string;
  organizations: string[];
  state: {
    call_to_action: string;
    datetime: string;
    priority: number;
    text: string;
  };
  title: string;
}
