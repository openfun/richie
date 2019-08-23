import { Nullable } from '../utils/types';
import { Resource } from './Resource';

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  icon: Nullable<{
    color: string;
    sizes: string;
    src: string;
    srcset: string;
    title: string;
  }>;
  organization_highlighted: string;
  organizations: string[];
  state: {
    call_to_action: Nullable<string>;
    datetime: Nullable<string>;
    priority: number;
    text: string;
  };
}
