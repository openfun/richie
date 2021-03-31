import { Priority } from 'types';
import { Resource } from 'types/Resource';
import { Nullable } from 'types/utils';

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  code: Nullable<string>;
  cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  duration: string;
  effort: string;
  icon: Nullable<{
    color: string;
    sizes: string;
    src: string;
    srcset: string;
    title: string;
  }>;
  organization_highlighted: string;
  organization_highlighted_cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  organizations: string[];
  state: {
    call_to_action: Nullable<string>;
    datetime: Nullable<string>;
    priority: Priority;
    text: string;
  };
}
